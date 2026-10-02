import type { DeviceInfo } from './signaling';

export interface RoomState {
  roomId: string | null;
  role: 'sender' | 'receiver' | null;
  expiresAt: number | null;
  remotePeer: DeviceInfo | null;
  localDevice: DeviceInfo;
  isJoined: boolean;
}
