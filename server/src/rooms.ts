import crypto from 'node:crypto';
import type { Room, Peer, DeviceInfo } from './types.js';

// Safe charset: uppercase alphanumeric excluding O, 0, I, 1
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 6;
const ROOM_TTL_MS = 15 * 60 * 1000; // 15 minutes

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private peerToRoom: Map<string, string> = new Map(); // peerId -> roomId
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Generate an unambiguous 6-character room code
   */
  private generateRoomCode(): string {
    const bytes = crypto.randomBytes(CODE_LENGTH);
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CHARSET[bytes[i] % CHARSET.length];
    }
    return code;
  }

  /**
   * Create a new room with the sender peer
   */
  public createRoom(senderPeer: Peer): Room {
    // Generate unique code
    let code: string;
    let attempts = 0;
    do {
      code = this.generateRoomCode();
      attempts++;
      if (attempts > 50) {
        throw new Error('Failed to generate unique room code');
      }
    } while (this.rooms.has(code));

    const now = Date.now();
    const room: Room = {
      roomId: code,
      sender: senderPeer,
      createdAt: now,
      expiresAt: now + ROOM_TTL_MS,
      lastActivity: now,
    };

    this.rooms.set(code, room);
    this.peerToRoom.set(senderPeer.id, code);

    return room;
  }

  /**
   * Find a room by room code (case-insensitive)
   */
  public getRoom(roomId: string): Room | undefined {
    const normalized = roomId.trim().toUpperCase();
    const room = this.rooms.get(normalized);
    if (!room) return undefined;

    if (Date.now() > room.expiresAt) {
      this.destroyRoom(normalized, 'expired');
      return undefined;
    }

    return room;
  }

  /**
   * Join an existing room as a receiver
   */
  public joinRoom(roomId: string, receiverPeer: Peer): { success: boolean; error?: string; code?: 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'ROOM_EXPIRED'; room?: Room } {
    const normalized = roomId.trim().toUpperCase();
    const room = this.rooms.get(normalized);

    if (!room) {
      return { success: false, error: 'Transfer room not found. Check code and try again.', code: 'ROOM_NOT_FOUND' };
    }

    if (Date.now() > room.expiresAt) {
      this.destroyRoom(normalized, 'expired');
      return { success: false, error: 'Transfer room has expired.', code: 'ROOM_EXPIRED' };
    }

    if (room.receiver && room.receiver.id !== receiverPeer.id) {
      return { success: false, error: 'Transfer room already has a connected receiver.', code: 'ROOM_FULL' };
    }

    room.receiver = receiverPeer;
    room.lastActivity = Date.now();
    this.peerToRoom.set(receiverPeer.id, normalized);

    return { success: true, room };
  }

  /**
   * Remove a peer from their current room
   */
  public removePeer(peerId: string): { room?: Room; wasSender: boolean } | null {
    const roomId = this.peerToRoom.get(peerId);
    if (!roomId) return null;

    this.peerToRoom.delete(peerId);
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (room.sender.id === peerId) {
      // Sender left: destroy room completely
      this.destroyRoom(roomId, 'sender_disconnected');
      return { room, wasSender: true };
    } else if (room.receiver?.id === peerId) {
      // Receiver left: room remains open for reconnection or another receiver
      room.receiver = undefined;
      room.lastActivity = Date.now();
      return { room, wasSender: false };
    }

    return null;
  }

  /**
   * Explicitly destroy a room
   */
  public destroyRoom(roomId: string, reason = 'destroyed'): Room | undefined {
    const normalized = roomId.trim().toUpperCase();
    const room = this.rooms.get(normalized);
    if (!room) return undefined;

    this.peerToRoom.delete(room.sender.id);
    if (room.receiver) {
      this.peerToRoom.delete(room.receiver.id);
    }
    this.rooms.delete(normalized);

    return room;
  }

  /**
   * Update room activity timestamp to prevent premature expiration
   */
  public touchRoom(roomId: string): void {
    const room = this.rooms.get(roomId.toUpperCase());
    if (room) {
      room.lastActivity = Date.now();
    }
  }

  /**
   * Periodic cleanup of expired rooms
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [code, room] of this.rooms.entries()) {
        if (now > room.expiresAt) {
          try {
            if (room.sender.ws.readyState === 1) {
              room.sender.ws.send(JSON.stringify({
                type: 'error',
                code: 'ROOM_EXPIRED',
                message: 'Room has expired due to inactivity.',
              }));
            }
            if (room.receiver && room.receiver.ws.readyState === 1) {
              room.receiver.ws.send(JSON.stringify({
                type: 'error',
                code: 'ROOM_EXPIRED',
                message: 'Room has expired.',
              }));
            }
          } catch {
            // Ignore send failures on dead sockets
          }
          this.destroyRoom(code, 'expired_cleanup');
        }
      }
    }, 30 * 1000);
  }

  public getStats() {
    return {
      activeRooms: this.rooms.size,
      connectedPeers: this.peerToRoom.size,
    };
  }

  public close(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
