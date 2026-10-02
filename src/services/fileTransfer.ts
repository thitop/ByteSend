import type {
  FileItemState,
  FileMetadata,
  TransferStats,
  TransferStatus,
  DataChannelMessage,
} from '../types/transfer';
import { formatSpeed, formatDuration } from '../utils/format';

const CHUNK_SIZE = 64 * 1024; // 64 KB universally safe chunk size
const HIGH_WATERMARK = 1024 * 1024; // 1 MB backpressure pause

export interface TransferProgressCallback {
  (params: {
    status: TransferStatus;
    files: FileItemState[];
    activeFileIndex: number;
    stats: TransferStats;
    error?: string;
  }): void;
}

export class FileTransferService {
  private dataChannel: RTCDataChannel | null = null;
  private files: FileItemState[] = [];
  private activeFileIndex = 0;
  private status: TransferStatus = 'idle';
  private callback: TransferProgressCallback | null = null;

  // Transfer stats tracking
  private totalBytes = 0;
  private transferredBytes = 0;
  private lastProgressUpdateTime = 0;
  private bytesInWindow = 0;
  private lastWindowTime = 0;
  private currentSpeed = 0;

  // Flow control flags
  private isPaused = false;
  private isCancelled = false;
  private resumeResolve: (() => void) | null = null;

  // Receiver buffer: Map fileIndex -> ArrayBuffer[]
  private receivedChunks: Map<number, ArrayBuffer[]> = new Map();

  constructor() {}

  public setChannel(channel: RTCDataChannel | null) {
    this.dataChannel = channel;
    if (channel) {
      channel.binaryType = 'arraybuffer';
      channel.bufferedAmountLowThreshold = 512 * 1024;
    }
  }

  public onProgress(cb: TransferProgressCallback) {
    this.callback = cb;
  }

  private notify() {
    if (!this.callback) return;

    // Calculate ETA
    let etaSeconds = 0;
    if (this.currentSpeed > 0 && this.totalBytes > this.transferredBytes) {
      etaSeconds = (this.totalBytes - this.transferredBytes) / this.currentSpeed;
    }

    const percent = this.totalBytes > 0
      ? Math.min(100, Math.round((this.transferredBytes / this.totalBytes) * 100))
      : 0;

    const stats: TransferStats = {
      speed: this.currentSpeed,
      formattedSpeed: formatSpeed(this.currentSpeed),
      etaSeconds,
      formattedEta: formatDuration(etaSeconds),
      transferredBytes: this.transferredBytes,
      totalBytes: this.totalBytes,
      percent,
    };

    this.callback({
      status: this.status,
      files: [...this.files],
      activeFileIndex: this.activeFileIndex,
      stats,
    });
  }

  // ==========================================
  // SENDER METHODS
  // ==========================================

  public setFilesToSend(rawFiles: File[]) {
    this.totalBytes = rawFiles.reduce((acc, f) => acc + f.size, 0);
    this.transferredBytes = 0;
    this.activeFileIndex = 0;
    this.isPaused = false;
    this.isCancelled = false;

    this.files = rawFiles.map((file, idx) => {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE) || 1;
      return {
        meta: {
          id: `file-${idx}-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          lastModified: file.lastModified,
          totalChunks,
        },
        file,
        status: 'pending',
        progress: 0,
        transferredBytes: 0,
      };
    });

    this.notify();
  }

  public async startSending(): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('DataChannel is not open');
    }

    if (this.files.length === 0) {
      return;
    }

    this.status = 'transferring';
    this.lastWindowTime = Date.now();
    this.bytesInWindow = 0;
    this.notify();

    // 1. Send manifest
    const manifestPayload: DataChannelMessage = {
      type: 'manifest',
      payload: {
        totalFiles: this.files.length,
        totalBytes: this.totalBytes,
        files: this.files.map((f) => f.meta),
      },
    };
    this.sendJson(manifestPayload);

    // 2. Transfer each file sequentially
    for (let fIdx = 0; fIdx < this.files.length; fIdx++) {
      if (this.isCancelled) break;

      this.activeFileIndex = fIdx;
      const fileItem = this.files[fIdx];
      const rawFile = fileItem.file;
      if (!rawFile) continue;

      fileItem.status = 'transferring';
      this.notify();

      // Send file-start header
      this.sendJson({
        type: 'file-start',
        payload: { fileIndex: fIdx, meta: fileItem.meta },
      });

      const totalChunks = fileItem.meta.totalChunks;
      let offset = 0;

      for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        if (this.isCancelled) break;

        // Check if paused
        if (this.isPaused) {
          await new Promise<void>((resolve) => {
            this.resumeResolve = resolve;
          });
        }

        // Check backpressure
        if (this.dataChannel.bufferedAmount > HIGH_WATERMARK) {
          await this.waitForBufferDrain();
        }

        const slice = rawFile.slice(offset, offset + CHUNK_SIZE);
        const chunkBuffer = await slice.arrayBuffer();
        const payloadLength = chunkBuffer.byteLength;

        // Build 12-byte header + chunkBuffer
        // Header: [4 bytes fileIndex, 4 bytes chunkIndex, 4 bytes payloadLength]
        const packet = new Uint8Array(12 + payloadLength);
        const view = new DataView(packet.buffer);
        view.setUint32(0, fIdx, false);
        view.setUint32(4, chunkIdx, false);
        view.setUint32(8, payloadLength, false);
        packet.set(new Uint8Array(chunkBuffer), 12);

        this.dataChannel.send(packet.buffer);

        offset += payloadLength;
        fileItem.transferredBytes += payloadLength;
        this.transferredBytes += payloadLength;
        this.bytesInWindow += payloadLength;
        fileItem.progress = Math.min(100, Math.round((fileItem.transferredBytes / fileItem.meta.size) * 100));

        // Update speed smoothing
        const now = Date.now();
        if (now - this.lastWindowTime >= 500) {
          const deltaSec = (now - this.lastWindowTime) / 1000;
          this.currentSpeed = this.bytesInWindow / deltaSec;
          this.bytesInWindow = 0;
          this.lastWindowTime = now;
        }

        // Throttle UI notification to ~60ms
        if (now - this.lastProgressUpdateTime > 60 || chunkIdx === totalChunks - 1) {
          this.lastProgressUpdateTime = now;
          this.notify();
        }
      }

      if (this.isCancelled) break;

      fileItem.status = 'completed';
      fileItem.progress = 100;

      // Send file-end
      this.sendJson({
        type: 'file-end',
        payload: { fileIndex: fIdx },
      });
      this.notify();
    }

    if (!this.isCancelled) {
      this.status = 'completed';
      this.sendJson({ type: 'all-complete' });
      this.notify();
    }
  }

  private waitForBufferDrain(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.dataChannel || this.dataChannel.bufferedAmount <= 512 * 1024) {
        resolve();
        return;
      }

      const onLow = () => {
        this.dataChannel?.removeEventListener('bufferedamountlow', onLow);
        resolve();
      };
      this.dataChannel.addEventListener('bufferedamountlow', onLow);
    });
  }

  // ==========================================
  // RECEIVER METHODS
  // ==========================================

  public handleIncomingData(data: string | ArrayBuffer) {
    if (typeof data === 'string') {
      this.handleControlMessage(data);
    } else if (data instanceof ArrayBuffer) {
      this.handleBinaryChunk(data);
    }
  }

  private handleControlMessage(raw: string) {
    try {
      const msg = JSON.parse(raw) as DataChannelMessage;
      switch (msg.type) {
        case 'manifest': {
          const { totalBytes, files } = msg.payload as {
            totalFiles: number;
            totalBytes: number;
            files: FileMetadata[];
          };
          this.totalBytes = totalBytes;
          this.transferredBytes = 0;
          this.status = 'transferring';
          this.lastWindowTime = Date.now();
          this.bytesInWindow = 0;
          this.receivedChunks.clear();

          this.files = files.map((meta) => ({
            meta,
            status: 'pending',
            progress: 0,
            transferredBytes: 0,
          }));

          this.notify();
          break;
        }

        case 'file-start': {
          const { fileIndex } = msg.payload as { fileIndex: number };
          this.activeFileIndex = fileIndex;
          if (this.files[fileIndex]) {
            this.files[fileIndex].status = 'transferring';
            this.receivedChunks.set(fileIndex, []);
          }
          this.notify();
          break;
        }

        case 'file-end': {
          const { fileIndex } = msg.payload as { fileIndex: number };
          const fileItem = this.files[fileIndex];
          if (fileItem) {
            const chunks = this.receivedChunks.get(fileIndex) || [];
            const blob = new Blob(chunks, { type: fileItem.meta.type || 'application/octet-stream' });
            fileItem.blob = blob;
            fileItem.downloadUrl = URL.createObjectURL(blob);
            fileItem.status = 'completed';
            fileItem.progress = 100;
            fileItem.transferredBytes = fileItem.meta.size;
            // Clean memory reference for raw chunks
            this.receivedChunks.delete(fileIndex);
          }
          this.notify();
          break;
        }

        case 'all-complete': {
          this.status = 'completed';
          this.notify();
          break;
        }

        case 'pause': {
          this.status = 'paused';
          this.notify();
          break;
        }

        case 'resume': {
          this.status = 'transferring';
          this.notify();
          break;
        }

        case 'cancel': {
          this.status = 'cancelled';
          this.notify();
          break;
        }
      }
    } catch (e) {
      console.error('[FileTransfer] Error handling control message', e);
    }
  }

  private handleBinaryChunk(buffer: ArrayBuffer) {
    if (buffer.byteLength < 12) return;

    const view = new DataView(buffer);
    const fileIndex = view.getUint32(0, false);
    // view.getUint32(4, false) is chunkIndex (in-order delivery guaranteed)
    const payloadLength = view.getUint32(8, false);

    const chunkData = buffer.slice(12, 12 + payloadLength);

    let chunks = this.receivedChunks.get(fileIndex);
    if (!chunks) {
      chunks = [];
      this.receivedChunks.set(fileIndex, chunks);
    }
    chunks.push(chunkData);

    const fileItem = this.files[fileIndex];
    if (fileItem) {
      fileItem.transferredBytes += payloadLength;
      this.transferredBytes += payloadLength;
      this.bytesInWindow += payloadLength;
      fileItem.progress = Math.min(100, Math.round((fileItem.transferredBytes / fileItem.meta.size) * 100));

      const now = Date.now();
      if (now - this.lastWindowTime >= 500) {
        const deltaSec = (now - this.lastWindowTime) / 1000;
        this.currentSpeed = this.bytesInWindow / deltaSec;
        this.bytesInWindow = 0;
        this.lastWindowTime = now;
      }

      if (now - this.lastProgressUpdateTime > 60) {
        this.lastProgressUpdateTime = now;
        this.notify();
      }
    }
  }

  // ==========================================
  // CONTROLS
  // ==========================================

  public pause(): void {
    if (this.status !== 'transferring') return;
    this.isPaused = true;
    this.status = 'paused';
    this.sendJson({ type: 'pause' });
    this.notify();
  }

  public resume(): void {
    if (this.status !== 'paused') return;
    this.isPaused = false;
    this.status = 'transferring';
    if (this.resumeResolve) {
      this.resumeResolve();
      this.resumeResolve = null;
    }
    this.sendJson({ type: 'resume' });
    this.notify();
  }

  public cancel(reason = 'User cancelled transfer'): void {
    this.isCancelled = true;
    this.status = 'cancelled';
    if (this.resumeResolve) {
      this.resumeResolve();
      this.resumeResolve = null;
    }
    this.sendJson({ type: 'cancel', payload: { reason } });
    this.notify();
  }

  private sendJson(msg: DataChannelMessage) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify(msg));
      } catch (err) {
        console.error('[FileTransfer] Error sending JSON control message:', err);
      }
    }
  }

  public reset() {
    this.files.forEach((f) => {
      if (f.downloadUrl) {
        URL.revokeObjectURL(f.downloadUrl);
      }
    });
    this.files = [];
    this.receivedChunks.clear();
    this.totalBytes = 0;
    this.transferredBytes = 0;
    this.activeFileIndex = 0;
    this.currentSpeed = 0;
    this.isPaused = false;
    this.isCancelled = false;
    this.status = 'idle';
    this.notify();
  }
}

export const fileTransferService = new FileTransferService();
