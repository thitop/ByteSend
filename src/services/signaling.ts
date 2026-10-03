import type {
  ClientSignalingMessage,
  ServerSignalingMessage,
  SignalType,
  DeviceInfo,
} from '../types/signaling';

export type ServerWarmupStatus = 'idle' | 'checking' | 'waking' | 'ready' | 'error';
type WarmupCallback = (status: ServerWarmupStatus) => void;
type SignalingCallback = (msg: ServerSignalingMessage) => void;

export class SignalingService {
  private ws: WebSocket | null = null;
  private listeners: Set<SignalingCallback> = new Set();
  private pingTimer: number | null = null;
  private isExplicitlyClosed = false;

  private warmupStatus: ServerWarmupStatus = 'idle';
  private warmupListeners: Set<WarmupCallback> = new Set();
  private keepAliveTimer: number | null = null;
  private warmupPromise: Promise<boolean> | null = null;

  constructor() {}

  /**
   * Determine HTTP health check URL for pre-warming backend
   */
  public getHealthUrl(): string {
    const isHttps = window.location.protocol === 'https:';
    const httpProto = isHttps ? 'https:' : 'http:';

    // In production or when hosted behind reverse proxy
    if (import.meta.env.VITE_WS_URL) {
      let url = import.meta.env.VITE_WS_URL.trim();
      if (url.startsWith('wss://')) {
        url = url.replace(/^wss:\/\//, 'https://');
      } else if (url.startsWith('ws://')) {
        url = url.replace(/^ws:\/\//, 'http://');
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `${httpProto}//${url}`;
      }
      url = url.replace(/\/ws\/?$/, '');
      return `${url.replace(/\/+$/, '')}/health`;
    }

    // If port is 5173 (Vite dev server), use proxy /ws or direct 3001
    const host = window.location.hostname || 'localhost';
    if (window.location.port === '5173') {
      return `${httpProto}//${host}:3001/health`;
    }

    // Default to relative /health on same host
    return `${httpProto}//${window.location.host}/health`;
  }

  public getWarmupStatus(): ServerWarmupStatus {
    return this.warmupStatus;
  }

  public subscribeWarmup(callback: WarmupCallback): () => void {
    this.warmupListeners.add(callback);
    callback(this.warmupStatus);
    return () => this.warmupListeners.delete(callback);
  }

  private setWarmupStatus(status: ServerWarmupStatus): void {
    this.warmupStatus = status;
    this.warmupListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (err) {
        console.error('[Signaling] Warmup listener error', err);
      }
    });
  }

  /**
   * Pre-warm Render / Backend server on initial page load
   */
  public warmUpServer(): Promise<boolean> {
    if (this.warmupPromise && this.warmupStatus !== 'error') {
      return this.warmupPromise;
    }

    this.setWarmupStatus('checking');

    // If it hasn't responded within 2.5 seconds, it's likely a Cold Start
    const coldStartTimer = window.setTimeout(() => {
      if (this.warmupStatus === 'checking') {
        this.setWarmupStatus('waking');
      }
    }, 2500);

    this.warmupPromise = (async () => {
      try {
        const url = this.getHealthUrl();
        console.log('[Signaling] Pre-warming server via:', url);
        const res = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });

        clearTimeout(coldStartTimer);
        if (res.ok) {
          console.log('[Signaling] Server is warm and ready');
          this.setWarmupStatus('ready');
          this.startKeepAlive();
          return true;
        } else {
          this.setWarmupStatus('error');
          return false;
        }
      } catch (err) {
        clearTimeout(coldStartTimer);
        console.warn('[Signaling] Server warm-up ping failed (may still be booting):', err);
        setTimeout(() => {
          if (this.warmupStatus !== 'ready') {
            this.warmupPromise = null;
            this.warmUpServer();
          }
        }, 6000);
        return false;
      }
    })();

    return this.warmupPromise;
  }

  /**
   * Periodic keep-alive ping while user has the browser tab open
   * (every 10 minutes to prevent Render from going to sleep after 15 minutes of inactivity)
   */
  private startKeepAlive(): void {
    if (this.keepAliveTimer) return;
    this.keepAliveTimer = window.setInterval(async () => {
      try {
        const url = this.getHealthUrl();
        await fetch(url, { method: 'GET', cache: 'no-store' });
        console.log('[Signaling] Keep-alive ping sent to backend');
      } catch {
        // silent fail
      }
    }, 10 * 60 * 1000);
  }

  /**
   * Determine optimal WebSocket URL
   */
  private getWebSocketUrl(): string {
    const isHttps = window.location.protocol === 'https:';
    const wsProto = isHttps ? 'wss:' : 'ws:';
    
    // In production or when hosted behind reverse proxy
    if (import.meta.env.VITE_WS_URL) {
      let url = import.meta.env.VITE_WS_URL.trim();
      if (url.startsWith('https://')) {
        url = url.replace(/^https:\/\//, 'wss://');
      } else if (url.startsWith('http://')) {
        url = url.replace(/^http:\/\//, 'ws://');
      } else if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        url = `${wsProto}//${url}`;
      }
      if (!url.endsWith('/ws')) {
        url = url.replace(/\/+$/, '') + '/ws';
      }
      return url;
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
          this.setWarmupStatus('ready');
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
