import type { WebSocket } from 'ws';

export interface DeviceInfo {
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
}

export interface Peer {
  id: string;
  ws: WebSocket;
  role: 'sender' | 'receiver';
  deviceInfo: DeviceInfo;
  joinedAt: number;
}

export interface Room {
  roomId: string;
  sender: Peer;
  receiver?: Peer;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
}

// Client -> Server messages
export type ClientMessage =
  | { type: 'create-room'; deviceInfo: DeviceInfo }
  | { type: 'join-room'; roomId: string; deviceInfo: DeviceInfo }
  | { type: 'signal'; roomId: string; signalType: 'offer' | 'answer' | 'candidate'; payload: any }
  | { type: 'leave-room'; roomId: string }
  | { type: 'ping' };

// Server -> Client messages
export type ServerMessage =
  | { type: 'room-created'; roomId: string; expiresAt: number; senderId: string }
  | { type: 'room-joined'; roomId: string; senderInfo: DeviceInfo }
  | { type: 'peer-joined'; roomId: string; receiverInfo: DeviceInfo }
  | { type: 'signal'; signalType: 'offer' | 'answer' | 'candidate'; payload: any }
  | { type: 'peer-disconnected'; role: 'sender' | 'receiver'; reason?: string }
  | { type: 'error'; message: string; code: 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'ROOM_EXPIRED' | 'INVALID_REQUEST' }
  | { type: 'pong' };
