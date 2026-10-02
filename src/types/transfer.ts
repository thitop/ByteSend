export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  totalChunks: number;
}

export interface FileItemState {
  meta: FileMetadata;
  file?: File; // Sender only
  blob?: Blob; // Receiver only
  downloadUrl?: string; // Receiver only
  status: 'pending' | 'transferring' | 'completed' | 'error' | 'cancelled';
  progress: number; // 0 to 100
  transferredBytes: number;
  error?: string;
}

export interface TransferStats {
  speed: number; // bytes per second
  formattedSpeed: string; // e.g. "48.2 MB/s"
  etaSeconds: number; // estimated seconds remaining
  formattedEta: string; // e.g. "15 sec"
  transferredBytes: number;
  totalBytes: number;
  percent: number; // 0 to 100
}

export type TransferRole = 'sender' | 'receiver';

export type TransferStatus =
  | 'idle'
  | 'creating_room'
  | 'waiting_for_receiver'
  | 'joining_room'
  | 'connecting'
  | 'connected'
  | 'transferring'
  | 'paused'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface DataChannelMessage {
  type:
    | 'manifest'
    | 'file-start'
    | 'file-end'
    | 'all-complete'
    | 'pause'
    | 'resume'
    | 'cancel';
  payload?: any;
}
