import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import crypto from 'node:crypto';
import { RoomManager } from './rooms.js';
import type { ClientMessage, Peer, DeviceInfo } from './types.js';

export function setupWebSocketServer(httpServer: Server, roomManager: RoomManager) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Map active ws to peer
  const activePeers = new Map<WebSocket, Peer>();

  function safeSend(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  wss.on('connection', (ws: WebSocket, req) => {
    const peerId = crypto.randomUUID();
    let currentPeer: Peer = {
      id: peerId,
      ws,
      role: 'sender',
      deviceInfo: {
        name: 'Unknown Device',
        type: 'desktop',
        browser: 'Browser',
        os: 'OS',
      },
      joinedAt: Date.now(),
    };
    activePeers.set(ws, currentPeer);

    ws.on('message', (rawData: Buffer | string) => {
      try {
        const text = rawData.toString();
        const msg = JSON.parse(text) as ClientMessage;

        switch (msg.type) {
          case 'ping': {
            safeSend(ws, { type: 'pong' });
            break;
          }

          case 'create-room': {
            currentPeer.role = 'sender';
            if (msg.deviceInfo) {
              currentPeer.deviceInfo = msg.deviceInfo;
            }

            const room = roomManager.createRoom(currentPeer);
            safeSend(ws, {
              type: 'room-created',
              roomId: room.roomId,
              expiresAt: room.expiresAt,
              senderId: currentPeer.id,
            });
            break;
          }

          case 'join-room': {
            currentPeer.role = 'receiver';
            if (msg.deviceInfo) {
              currentPeer.deviceInfo = msg.deviceInfo;
            }

            const joinResult = roomManager.joinRoom(msg.roomId, currentPeer);
            if (!joinResult.success || !joinResult.room) {
              safeSend(ws, {
                type: 'error',
                code: joinResult.code || 'ROOM_NOT_FOUND',
                message: joinResult.error || 'Failed to join room',
              });
              return;
            }

            const room = joinResult.room;
            // Notify receiver that join succeeded with sender's info
            safeSend(ws, {
              type: 'room-joined',
              roomId: room.roomId,
              senderInfo: room.sender.deviceInfo,
            });

            // Notify sender that receiver has arrived
            safeSend(room.sender.ws, {
              type: 'peer-joined',
              roomId: room.roomId,
              receiverInfo: currentPeer.deviceInfo,
            });
            break;
          }

          case 'signal': {
            const room = roomManager.getRoom(msg.roomId);
            if (!room) {
              safeSend(ws, {
                type: 'error',
                code: 'ROOM_NOT_FOUND',
                message: 'Room not found during signaling relay',
              });
              return;
            }

            roomManager.touchRoom(msg.roomId);

            // Forward signal payload directly to the other peer in the room
            const targetPeer = ws === room.sender.ws ? room.receiver : room.sender;
            if (targetPeer && targetPeer.ws.readyState === WebSocket.OPEN) {
              safeSend(targetPeer.ws, {
                type: 'signal',
                signalType: msg.signalType,
                payload: msg.payload,
              });
            }
            break;
          }

          case 'leave-room': {
            const result = roomManager.removePeer(currentPeer.id);
            if (result && result.room) {
              const otherPeer = result.wasSender ? result.room.receiver : result.room.sender;
              if (otherPeer) {
                safeSend(otherPeer.ws, {
                  type: 'peer-disconnected',
                  role: result.wasSender ? 'sender' : 'receiver',
                  reason: 'Peer left the room',
                });
              }
            }
            break;
          }

          default: {
            console.warn('[WS] Unknown message type:', (msg as any).type);
          }
        }
      } catch (err) {
        console.error('[WS] Error processing message:', err);
        safeSend(ws, {
          type: 'error',
          code: 'INVALID_REQUEST',
          message: 'Invalid message payload',
        });
      }
    });

    ws.on('close', () => {
      activePeers.delete(ws);
      const result = roomManager.removePeer(currentPeer.id);
      if (result && result.room) {
        const otherPeer = result.wasSender ? result.room.receiver : result.room.sender;
        if (otherPeer && otherPeer.ws.readyState === WebSocket.OPEN) {
          safeSend(otherPeer.ws, {
            type: 'peer-disconnected',
            role: result.wasSender ? 'sender' : 'receiver',
            reason: result.wasSender ? 'Sender disconnected' : 'Receiver disconnected',
          });
        }
      }
    });

    ws.on('error', (err) => {
      console.error('[WS] Socket error for peer', currentPeer.id, err);
    });
  });

  return wss;
}
