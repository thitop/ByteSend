export interface DeviceInfo {
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
}

export type SignalType = 'offer' | 'answer' | 'candidate';

export type ClientSignalingMessage =
  | { type: 'create-room'; deviceInfo: DeviceInfo }
  | { type: 'join-room'; roomId: string; deviceInfo: DeviceInfo }
  | { type: 'signal'; roomId: string; signalType: SignalType; payload: any }
  | { type: 'leave-room'; roomId: string }
  | { type: 'ping' };

export type ServerSignalingMessage =
  | { type: 'room-created'; roomId: string; expiresAt: number; senderId: string }
  | { type: 'room-joined'; roomId: string; senderInfo: DeviceInfo }
  | { type: 'peer-joined'; roomId: string; receiverInfo: DeviceInfo }
  | { type: 'signal'; signalType: SignalType; payload: any }
  | { type: 'peer-disconnected'; role: 'sender' | 'receiver'; reason?: string }
  | { type: 'error'; message: string; code: 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'ROOM_EXPIRED' | 'INVALID_REQUEST' }
  | { type: 'pong' };
