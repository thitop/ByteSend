import { useState, useEffect, useCallback, useRef } from 'react';
import { signalingService, type ServerWarmupStatus } from '../services/signaling';
import { webrtcService } from '../services/webrtc';
import { fileTransferService } from '../services/fileTransfer';
import { getDeviceInfo } from '../utils/device';
import type { DeviceInfo } from '../types/signaling';
import type { FileItemState, TransferStats, TransferStatus } from '../types/transfer';
import confetti from 'canvas-confetti';

export type AppView = 'home' | 'send' | 'receive' | 'transfer' | 'complete';

export type ConnectionState =
  | 'disconnected'
  | 'connecting_signal'
  | 'signal_ready'
  | 'waiting_peer'
  | 'webrtc_connecting'
  | 'webrtc_connected'
  | 'failed';

export function useDropCode() {
  const [view, setView] = useState<AppView>('home');
  const [role, setRole] = useState<'sender' | 'receiver' | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [localDevice] = useState<DeviceInfo>(getDeviceInfo());
  const [remoteDevice, setRemoteDevice] = useState<DeviceInfo | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [serverStatus, setServerStatus] = useState<ServerWarmupStatus>(signalingService.getWarmupStatus());
  const [transferStatus, setTransferStatus] = useState<TransferStatus>('idle');
  const [files, setFiles] = useState<FileItemState[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [stats, setStats] = useState<TransferStats>({
    speed: 0,
    formattedSpeed: '0 B/s',
    etaSeconds: 0,
    formattedEta: '--',
    transferredBytes: 0,
    totalBytes: 0,
    percent: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRoomExpired, setIsRoomExpired] = useState(false);

  const roleRef = useRef(role);
  roleRef.current = role;
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  // Pre-warm Render backend immediately on app launch and track status
  useEffect(() => {
    signalingService.warmUpServer();
    const unsubscribe = signalingService.subscribeWarmup((status) => {
      setServerStatus(status);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Initialize transfer service callback
  useEffect(() => {
    fileTransferService.onProgress((update) => {
      setTransferStatus(update.status);
      setFiles(update.files);
      setActiveFileIndex(update.activeFileIndex);
      setStats(update.stats);

      if (update.status === 'completed') {
        setView('complete');
        // Trigger celebration confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#06b6d4', '#3b82f6'],
          });
        } catch {
          // Ignore in environments where canvas is unavailable
        }
      }
    });
  }, []);

  // Subscribe to signaling service messages
  useEffect(() => {
    const unsubscribe = signalingService.subscribe((msg) => {
      console.log('[DropCodeHook] Received signaling msg:', msg.type);

      switch (msg.type) {
        case 'room-created': {
          setRoomId(msg.roomId);
          setExpiresAt(msg.expiresAt);
          setConnectionState('waiting_peer');
          break;
        }

        case 'room-joined': {
          setRoomId(msg.roomId);
          setRemoteDevice(msg.senderInfo);
          setConnectionState('webrtc_connecting');
          // Receiver initializes WebRTC as non-initiator
          webrtcService.init(msg.roomId, false, {
            onConnectionStateChange: (state) => {
              if (state === 'connected') {
                setConnectionState('webrtc_connected');
              } else if (state === 'failed' || state === 'disconnected') {
                setConnectionState('failed');
                setErrorMessage('Direct connection lost. Please try again.');
              }
            },
            onDataChannelOpen: () => {
              console.log('[DropCodeHook] Receiver DataChannel Ready');
              setConnectionState('webrtc_connected');
              fileTransferService.setChannel(webrtcService.getDataChannel());
              setView('transfer');
            },
            onDataChannelMessage: (data) => {
              fileTransferService.handleIncomingData(data);
            },
            onError: (err) => {
              setErrorMessage(err.message);
            },
          });
          break;
        }

        case 'peer-joined': {
          // Receiver has joined the sender's room!
          setRemoteDevice(msg.receiverInfo);
          setConnectionState('webrtc_connecting');

          if (roleRef.current === 'sender' && roomIdRef.current) {
            // Sender initializes WebRTC as initiator
            webrtcService.init(roomIdRef.current, true, {
              onConnectionStateChange: (state) => {
                if (state === 'connected') {
                  setConnectionState('webrtc_connected');
                } else if (state === 'failed' || state === 'disconnected') {
                  setConnectionState('failed');
                  setErrorMessage('Direct connection lost.');
                }
              },
              onDataChannelOpen: () => {
                console.log('[DropCodeHook] Sender DataChannel Ready');
                setConnectionState('webrtc_connected');
                fileTransferService.setChannel(webrtcService.getDataChannel());
                setView('transfer');

                // Auto-start sending files
                setTimeout(() => {
                  fileTransferService.startSending().catch((err) => {
                    console.error('[DropCodeHook] Transfer error', err);
                    setErrorMessage('Transfer failed: ' + err.message);
                  });
                }, 300);
              },
              onDataChannelMessage: (data) => {
                fileTransferService.handleIncomingData(data);
              },
              onError: (err) => {
                setErrorMessage(err.message);
              },
            });

            // Start offer exchange
            webrtcService.startHandshake();
          }
          break;
        }

        case 'signal': {
          webrtcService.handleSignal(msg.signalType, msg.payload);
          break;
        }

        case 'peer-disconnected': {
          setErrorMessage('Peer disconnected.');
          setConnectionState('disconnected');
          break;
        }

        case 'error': {
          if (msg.code === 'ROOM_EXPIRED') {
            setIsRoomExpired(true);
          } else {
            setErrorMessage(msg.message);
          }
          setConnectionState('failed');
          break;
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Action: Start Send Flow
  const startSendFlow = useCallback(async (selectedFiles: File[]) => {
    setErrorMessage(null);
    setRole('sender');
    setView('send');
    setConnectionState('connecting_signal');

    fileTransferService.setFilesToSend(selectedFiles);

    try {
      await signalingService.connect();
      setConnectionState('signal_ready');
      signalingService.createRoom(localDevice);
    } catch (err: any) {
      setErrorMessage('Could not connect to signaling server: ' + err.message);
      setConnectionState('failed');
    }
  }, [localDevice]);

  // Action: Start Receive Flow (Join Room)
  const startReceiveFlow = useCallback(async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setErrorMessage('Please enter a valid 6-character room code.');
      return;
    }

    setErrorMessage(null);
    setRole('receiver');
    setView('receive');
    setConnectionState('connecting_signal');

    try {
      await signalingService.connect();
      setConnectionState('signal_ready');
      signalingService.joinRoom(cleanCode, localDevice);
    } catch (err: any) {
      setErrorMessage('Could not connect to signaling server: ' + err.message);
      setConnectionState('failed');
    }
  }, [localDevice]);

  // Pause / Resume / Cancel
  const pauseTransfer = useCallback(() => {
    fileTransferService.pause();
  }, []);

  const resumeTransfer = useCallback(() => {
    fileTransferService.resume();
  }, []);

  const cancelTransfer = useCallback(() => {
    fileTransferService.cancel();
    if (roomId) {
      signalingService.leaveRoom(roomId);
    }
    webrtcService.close();
  }, [roomId]);

  // Reset back to Home
  const resetToHome = useCallback(() => {
    if (roomId) {
      signalingService.leaveRoom(roomId);
    }
    webrtcService.close();
    fileTransferService.reset();
    setRole(null);
    setRoomId(null);
    setExpiresAt(null);
    setRemoteDevice(null);
    setConnectionState('disconnected');
    setTransferStatus('idle');
    setErrorMessage(null);
    setIsRoomExpired(false);
    setView('home');
  }, [roomId]);

  // Download a single file
  const downloadFile = useCallback((fileId: string) => {
    const item = files.find((f) => f.meta.id === fileId);
    if (item && item.downloadUrl) {
      const a = document.createElement('a');
      a.href = item.downloadUrl;
      a.download = item.meta.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [files]);

  // Download all completed files
  const downloadAllFiles = useCallback(() => {
    files.forEach((item, index) => {
      if (item.downloadUrl) {
        setTimeout(() => {
          const a = document.createElement('a');
          a.href = item.downloadUrl!;
          a.download = item.meta.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }, index * 250);
      }
    });
  }, [files]);

  return {
    view,
    setView,
    role,
    roomId,
    expiresAt,
    localDevice,
    remoteDevice,
    connectionState,
    serverStatus,
    transferStatus,
    files,
    activeFileIndex,
    stats,
    errorMessage,
    isRoomExpired,
    startSendFlow,
    startReceiveFlow,
    pauseTransfer,
    resumeTransfer,
    cancelTransfer,
    resetToHome,
    downloadFile,
    downloadAllFiles,
  };
}

export const useByteSend = useDropCode;
