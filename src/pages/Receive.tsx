import React from 'react';
import { Loader2, X } from 'lucide-react';
import type { ConnectionState } from '../hooks/useDropCode';
import type { DeviceInfo } from '../types/signaling';

interface ReceiveProps {
  roomId: string | null;
  connectionState: ConnectionState;
  remoteDevice: DeviceInfo | null;
  onCancel: () => void;
}

export const Receive: React.FC<ReceiveProps> = ({
  roomId,
  connectionState,
  remoteDevice,
  onCancel,
}) => {
  const isConnected = connectionState === 'webrtc_connected';
  const isConnecting = connectionState === 'webrtc_connecting';

  let statusTitle = 'CONNECTING TO SENDER...';
  let pulseDotClass = 'w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping';

  if (isConnected) {
    statusTitle = remoteDevice ? `PAIRED WITH ${remoteDevice.name.toUpperCase()}` : 'CONNECTED • STREAMING VIA WEBRTC';
    pulseDotClass = 'w-2.5 h-2.5 rounded-full bg-emerald-500';
  } else if (isConnecting) {
    statusTitle = 'NEGOTIATING STUN CANDIDATES...';
    pulseDotClass = 'w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse';
  }

  const formattedCode = roomId
    ? `${roomId.slice(0, 3)}-${roomId.slice(3)}`
    : '------';

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
          <span className="text-[11px] font-mono text-slate-400 bg-surface-subtle px-2 py-0.5 rounded border border-surface-border">
            Receiver Link
          </span>
        </div>

        {/* Code Block */}
        <div className="my-6 text-center">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-2">
            Target Room
          </div>
          <div className="text-4xl sm:text-5xl font-mono font-bold tracking-wider text-white inline-block bg-surface-base px-6 py-3 rounded-lg border border-surface-border">
            {formattedCode}
          </div>
          <p className="text-xs text-slate-400 mt-3 max-w-sm mx-auto leading-relaxed">
            {remoteDevice
              ? `Connected to ${remoteDevice.name} (${remoteDevice.type}). Establishing end-to-end data pipe...`
              : 'Direct peer-to-peer WebRTC DataChannel connection initializing...'}
          </p>
        </div>

        {/* Streaming Progress Box */}
        <div className="p-4 rounded-lg bg-surface-subtle/70 border border-surface-border mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-300 font-medium flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
              <span>SCTP over DTLS Handshake in progress...</span>
            </span>
            <span className="font-mono text-sky-400 font-semibold">0%</span>
          </div>
          <div className="w-full h-2 bg-surface-base rounded-full overflow-hidden border border-surface-border">
            <div className="h-full bg-sky-500 rounded-full animate-pulse w-1/4" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-center text-[11px] font-mono">
            <div className="p-1.5 rounded bg-surface-base border border-surface-border">
              <span className="block text-slate-500 text-[10px]">SECURITY</span>
              <span className="text-slate-300 font-medium">DTLS 1.3 / AES-256</span>
            </div>
            <div className="p-1.5 rounded bg-surface-base border border-surface-border">
              <span className="block text-slate-500 text-[10px]">STORAGE</span>
              <span className="text-slate-300 font-medium">Memory Stream (0 Cloud)</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="pt-3 border-t border-surface-border flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel Connection</span>
          </button>
          <span className="text-[11px] font-mono text-slate-500">
            RFC 8831 WebRTC DataChannel
          </span>
        </div>
      </div>
    </div>
  );
};
