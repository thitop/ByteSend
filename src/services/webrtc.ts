import { signalingService } from './signaling';
import type { SignalType } from '../types/signaling';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
};

export interface WebRTCEvents {
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onDataChannelOpen: () => void;
  onDataChannelClose: () => void;
  onDataChannelMessage: (data: string | ArrayBuffer) => void;
  onError: (error: Error) => void;
}

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private roomId: string | null = null;
  private events: Partial<WebRTCEvents> = {};
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private isInitiator = false;

  constructor() {}

  public init(roomId: string, isInitiator: boolean, events: Partial<WebRTCEvents>) {
    this.close();
    this.roomId = roomId;
    this.isInitiator = isInitiator;
    this.events = events;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.pc = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && this.roomId) {
        signalingService.sendSignal(this.roomId, 'candidate', event.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      this.events.onConnectionStateChange?.(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
    };

    if (isInitiator) {
      // Sender creates the DataChannel
      this.setupDataChannel(pc.createDataChannel('bytesend-channel', { ordered: true }));
    } else {
      // Receiver waits for DataChannel from sender
      pc.ondatachannel = (event) => {
        console.log('[WebRTC] DataChannel received by peer');
        this.setupDataChannel(event.channel);
      };
    }
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel;
    channel.binaryType = 'arraybuffer';
    // Backpressure threshold for large transfers: 512 KB
    channel.bufferedAmountLowThreshold = 512 * 1024;

    channel.onopen = () => {
      console.log('[WebRTC] DataChannel OPEN');
      this.events.onDataChannelOpen?.();
    };

    channel.onclose = () => {
      console.log('[WebRTC] DataChannel CLOSED');
      this.events.onDataChannelClose?.();
    };

    channel.onmessage = (event: MessageEvent) => {
      this.events.onDataChannelMessage?.(event.data);
    };

    channel.onerror = (err) => {
      console.error('[WebRTC] DataChannel error', err);
      this.events.onError?.(new Error('DataChannel error'));
    };
  }

  public async startHandshake(): Promise<void> {
    if (!this.pc || !this.roomId) return;
    try {
      console.log('[WebRTC] Creating offer as initiator...');
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      signalingService.sendSignal(this.roomId, 'offer', offer);
    } catch (err) {
      console.error('[WebRTC] Error creating offer:', err);
      this.events.onError?.(err as Error);
    }
  }

  public async handleSignal(signalType: SignalType, payload: any): Promise<void> {
    if (!this.pc) {
      console.warn('[WebRTC] Received signal but peer connection is not ready');
      return;
    }

    try {
      switch (signalType) {
        case 'offer': {
          console.log('[WebRTC] Handling offer...');
          await this.pc.setRemoteDescription(new RTCSessionDescription(payload));
          // Process any queued ICE candidates
          await this.flushPendingCandidates();

          console.log('[WebRTC] Creating answer...');
          const answer = await this.pc.createAnswer();
          await this.pc.setLocalDescription(answer);
          if (this.roomId) {
            signalingService.sendSignal(this.roomId, 'answer', answer);
          }
          break;
        }

        case 'answer': {
          console.log('[WebRTC] Handling answer...');
          await this.pc.setRemoteDescription(new RTCSessionDescription(payload));
          await this.flushPendingCandidates();
          break;
        }

        case 'candidate': {
          const candidate = new RTCIceCandidate(payload);
          if (this.pc.remoteDescription && this.pc.remoteDescription.type) {
            await this.pc.addIceCandidate(candidate);
          } else {
            this.pendingCandidates.push(payload);
          }
          break;
        }
      }
    } catch (err) {
      console.error('[WebRTC] Error handling signal:', signalType, err);
      this.events.onError?.(err as Error);
    }
  }

  private async flushPendingCandidates() {
    if (!this.pc) return;
    while (this.pendingCandidates.length > 0) {
      const candidatePayload = this.pendingCandidates.shift();
      if (candidatePayload) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidatePayload));
        } catch (e) {
          console.warn('[WebRTC] Error adding queued ICE candidate', e);
        }
      }
    }
  }

  public getDataChannel(): RTCDataChannel | null {
    return this.dataChannel;
  }

  public isChannelOpen(): boolean {
    return this.dataChannel !== null && this.dataChannel.readyState === 'open';
  }

  public getIsInitiator(): boolean {
    return this.isInitiator;
  }

  public close() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.pendingCandidates = [];
    this.roomId = null;
    this.events = {};
  }
}

export const webrtcService = new WebRTCService();
