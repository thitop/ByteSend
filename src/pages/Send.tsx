import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Clock,
  Copy,
  Link as LinkIcon,
  QrCode,
  X,
  Loader2,
} from 'lucide-react';
import type { ConnectionState } from '../hooks/useDropCode';
import type { FileItemState } from '../types/transfer';
import type { DeviceInfo } from '../types/signaling';
import type { ServerWarmupStatus } from '../services/signaling';
import { formatBytes, formatCountdown } from '../utils/format';
import { useToast } from '../context/ToastContext';

interface SendProps {
  roomId: string | null;
  expiresAt: number | null;
  connectionState: ConnectionState;
  remoteDevice: DeviceInfo | null;
  files: FileItemState[];
  onCancel: () => void;
  isExpired?: boolean;
  serverStatus?: ServerWarmupStatus;
}

export const Send: React.FC<SendProps> = ({
  roomId,
  expiresAt,
  connectionState,
  remoteDevice,
  files,
  onCancel,
  isExpired = false,
  serverStatus,
}) => {
  const { showToast } = useToast();
  const [showQR, setShowQR] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [countdownText, setCountdownText] = useState('15:00');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Waiting elapsed timer during cold start
  useEffect(() => {
    if (roomId) return;
    const interval = setInterval(() => {
      setWaitingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [roomId]);

  // Expiration countdown
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setCountdownText('00:00');
        clearInterval(interval);
      } else {
        setCountdownText(formatCountdown(remaining));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // QR Code generation
  const directLink = roomId ? `${window.location.origin}/?code=${roomId}` : '';
  useEffect(() => {
    if (showQR && canvasRef.current && roomId) {
      QRCode.toCanvas(
        canvasRef.current,
        directLink,
        {
          width: 140,
          margin: 1,
          color: {
            dark: '#0B0F19',
            light: '#FFFFFF',
          },
        },
        (err) => {
          if (err) console.error('QR code render error', err);
        }
      );
    }
  }, [showQR, roomId, directLink]);

  const copyCode = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      showToast(`Copied code: ${roomId}`, 'info');
    } catch {
      showToast(`Room code: ${roomId}`, 'info');
    }
  };

  const copyLink = async () => {
    if (!directLink) return;
    try {
      await navigator.clipboard.writeText(directLink);
      showToast('Copied direct transfer link', 'info');
    } catch {
      showToast('Could not copy link', 'error');
    }
  };

  const formattedCode = roomId
    ? `${roomId.slice(0, 3)}-${roomId.slice(3)}`
    : '------';

  const isConnected = connectionState === 'webrtc_connected';
  const isConnecting = connectionState === 'webrtc_connecting';

  let statusTitle = 'WAITING FOR PEER TO CONNECT...';
  let pulseDotClass = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse';

  if (isConnected) {
    statusTitle = remoteDevice ? `PAIRED WITH ${remoteDevice.name.toUpperCase()}` : 'CONNECTED • STREAMING VIA WEBRTC';
    pulseDotClass = 'w-2.5 h-2.5 rounded-full bg-emerald-500';
  } else if (isConnecting) {
    statusTitle = 'NEGOTIATING WEBRTC DATAPIPE...';
    pulseDotClass = 'w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping';
  } else if (isExpired) {
    statusTitle = 'SESSION EXPIRED';
    pulseDotClass = 'w-2.5 h-2.5 rounded-full bg-red-400';
  }

  const totalBytes = files.reduce((acc, f) => acc + f.meta.size, 0);

  return (
    <div className="max-w-xl mx-auto w-full py-4 px-2 sm:px-0">
      <div className="pro-card rounded-xl p-6 sm:p-7 shadow-lg">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className={pulseDotClass} />
            <span className="text-xs font-mono font-semibold text-slate-200">
              {statusTitle}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Expires in <strong className="text-slate-200 font-semibold">{countdownText}</strong></span>
          </div>
        </div>

        {/* Code Block */}
        <div className="my-6 text-center">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-2">
            Room Code
          </div>

          {roomId ? (
            <div className="text-4xl sm:text-5xl font-mono font-bold tracking-wider text-white inline-block bg-surface-base px-6 py-3 rounded-lg border border-surface-border">
              {formattedCode}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-surface-subtle/50 border border-surface-border space-y-2 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 text-sky-400 text-sm font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {serverStatus === 'waking' || waitingSeconds >= 3
                    ? 'Waking up server (Render Cold Start)...'
                    : 'Generating secure room code...'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {serverStatus === 'waking' || waitingSeconds >= 3
                  ? `Render free container is starting up (~30-50s). Elapsed: ${waitingSeconds}s`
                  : 'Connecting to signaling server...'}
              </p>
            </div>
          )}

          {roomId && (
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={copyCode}
                className="px-3 py-1.5 rounded-md bg-surface-subtle hover:bg-slate-800 border border-surface-border text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Code</span>
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="px-3 py-1.5 rounded-md bg-surface-subtle hover:bg-slate-800 border border-surface-border text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
              >
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Link</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQR((prev) => !prev)}
                className="px-3 py-1.5 rounded-md bg-surface-subtle hover:bg-slate-800 border border-surface-border text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-400" />
                <span>{showQR ? 'Hide QR' : 'QR Code'}</span>
              </button>
            </div>
          )}

          {/* Clean Inline QR Code Container */}
          {showQR && roomId && (
            <div className="mt-4 p-4 bg-white rounded-lg inline-block shadow-sm animate-in fade-in zoom-in-95">
              <canvas ref={canvasRef} className="mx-auto" />
              <span className="block mt-1 text-[11px] font-mono text-slate-900 font-bold tracking-wider">
                {roomId}
              </span>
            </div>
          )}
        </div>

        {/* Streaming Progress Bar (Shown during transfer / connection ready) */}
        <div className="p-4 rounded-lg bg-surface-subtle/70 border border-surface-border mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-300 font-medium">
              {isConnected ? 'DataChannel Pipe: Active & Encrypted' : 'DataChannel Pipe: Ready'}
            </span>
            <span className="font-mono text-sky-400 font-semibold">0%</span>
          </div>
          
          <div className="w-full h-2 bg-surface-base rounded-full overflow-hidden border border-surface-border">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-150"
              style={{ width: isConnected ? '10%' : '0%' }}
            />
          </div>

          {/* Transfer Telemetry */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[11px] font-mono">
            <div className="p-1.5 rounded bg-surface-base border border-surface-border">
              <span className="block text-slate-500 text-[10px]">SPEED</span>
              <span className="text-slate-300 font-medium">0.0 MB/s</span>
            </div>
            <div className="p-1.5 rounded bg-surface-base border border-surface-border">
              <span className="block text-slate-500 text-[10px]">TRANSFERRED</span>
              <span className="text-slate-300 font-medium">0 / {formatBytes(totalBytes)}</span>
            </div>
            <div className="p-1.5 rounded bg-surface-base border border-surface-border">
              <span className="block text-slate-500 text-[10px]">TIME REMAINING</span>
              <span className="text-slate-300 font-medium">--</span>
            </div>
          </div>
        </div>

        {/* File Manifest */}
        <div className="mb-5">
          <div className="text-[11px] font-mono text-slate-400 uppercase mb-2">
            Transfer Manifest (<span className="text-slate-200 font-semibold">{files.length}</span>)
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {files.map((item, idx) => (
              <div
                key={item.meta.id || idx}
                className="flex items-center justify-between p-2 rounded bg-surface-base border border-surface-border text-xs"
              >
                <span className="text-slate-300 font-medium truncate pr-2">
                  {item.meta.name}
                </span>
                <span className="font-mono text-slate-400 text-[11px] shrink-0">
                  {formatBytes(item.meta.size)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Room Controls */}
        <div className="pt-3 border-t border-surface-border flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel Transfer</span>
          </button>
          <span className="text-[11px] font-mono text-slate-500">
            RFC 8831 WebRTC DataChannel
          </span>
        </div>

      </div>
    </div>
  );
};
