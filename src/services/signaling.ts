import type {
  ClientSignalingMessage,
  ServerSignalingMessage,
  SignalType,
  DeviceInfo,
} from '../types/signaling';

type SignalingCallback = (msg: ServerSignalingMessage) => void;

export class SignalingService {
  private ws: WebSocket | null = null;
  private listeners: Set<SignalingCallback> = new Set();
  private pingTimer: number | null = null;
  private isExplicitlyClosed = false;

  constructor() {}

  /**
   * Determine optimal WebSocket URL
   */
  private getWebSocketUrl(): string {
    const isHttps = window.location.protocol === 'https:';
    const wsProto = isHttps ? 'wss:' : 'ws:';
    
    // In production or when hosted behind reverse proxy
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }

    // If port is 5173 (Vite dev server), use proxy /ws or direct 3001
    const host = window.location.hostname || 'localhost';
    if (window.location.port === '5173') {
      return `${wsProto}//${host}:3001/ws`;
    }

    // Default to relative /ws on same host
    return `${wsProto}//${window.location.host}/ws`;
  }

  public connect(): Promise<void> {
    this.isExplicitlyClosed = false;
    return new Promise((resolve, reject) => {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        resolve();
        return;
      }

      const url = this.getWebSocketUrl();
      console.log('[Signaling] Connecting to', url);

      try {
        const socket = new WebSocket(url);
        this.ws = socket;

        socket.onopen = () => {
          console.log('[Signaling] Connected successfully');
          this.startHeartbeat();
          resolve();
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as ServerSignalingMessage;
            this.notifyListeners(data);
          } catch (e) {
            console.error('[Signaling] Failed to parse message', e);
          }
        };

        socket.onerror = (err) => {
          console.error('[Signaling] Socket error', err);
        };

        socket.onclose = () => {
          console.log('[Signaling] Connection closed');
          this.stopHeartbeat();
          if (!this.isExplicitlyClosed) {
            // Can notify listeners
          }
        };

        // Fallback timeout in case onopen doesn't fire
        setTimeout(() => {
          if (socket.readyState === WebSocket.OPEN) {
            resolve();
          }
        }, 1500);
      } catch (err) {
        reject(err);
      }
    });
  }

  public send(msg: ClientSignalingMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('[Signaling] Socket not ready, trying to reconnect and send...');
      this.connect().then(() => {
        this.ws?.send(JSON.stringify(msg));
      }).catch(err => {
        console.error('[Signaling] Could not send message:', err);
      });
    }
  }

  public createRoom(deviceInfo: DeviceInfo): void {
    this.send({ type: 'create-room', deviceInfo });
  }

  public joinRoom(roomId: string, deviceInfo: DeviceInfo): void {
    this.send({ type: 'join-room', roomId, deviceInfo });
  }

  public sendSignal(roomId: string, signalType: SignalType, payload: any): void {
    this.send({ type: 'signal', roomId, signalType, payload });
  }

  public leaveRoom(roomId: string): void {
    this.send({ type: 'leave-room', roomId });
  }

  public subscribe(callback: SignalingCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(msg: ServerSignalingMessage): void {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('[Signaling] Listener error:', err);
      }
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingTimer = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 20000);
  }

  private stopHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const signalingService = new SignalingService();
