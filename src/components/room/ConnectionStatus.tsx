import React from 'react';
import { Radio, CheckCircle2, AlertTriangle, Loader2, Laptop, Smartphone, Tablet } from 'lucide-react';
import type { ConnectionState } from '../../hooks/useDropCode';
import type { DeviceInfo } from '../../types/signaling';

interface ConnectionStatusProps {
  state: ConnectionState;
  remoteDevice?: DeviceInfo | null;
  role?: 'sender' | 'receiver' | null;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  state,
  remoteDevice,
  role,
}) => {
  const getDeviceIcon = (device?: DeviceInfo | null) => {
    if (!device) return <Laptop className="w-4 h-4" />;
    if (device.type === 'mobile') return <Smartphone className="w-4 h-4" />;
    if (device.type === 'tablet') return <Tablet className="w-4 h-4" />;
    return <Laptop className="w-4 h-4" />;
  };

  const getStatusContent = () => {
    switch (state) {
      case 'waiting_peer':
        return {
          icon: <Radio className="w-4 h-4 text-amber-400 animate-pulse" />,
          title: 'Waiting for receiver...',
          desc: 'Share code or QR to begin transfer',
          color: 'text-amber-400',
          dot: 'bg-amber-400 animate-ping',
        };
      case 'connecting_signal':
        return {
          icon: <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />,
          title: 'Connecting to signaling...',
          desc: 'Negotiating room session',
          color: 'text-cyan-400',
          dot: 'bg-cyan-400 animate-pulse',
        };
      case 'webrtc_connecting':
        return {
          icon: <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />,
          title: 'Establishing direct P2P link...',
          desc: remoteDevice ? `Pairing with ${remoteDevice.name}` : 'Exchanging WebRTC candidates',
          color: 'text-brand-400',
          dot: 'bg-brand-400 animate-ping',
        };
      case 'webrtc_connected':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-brand-400" />,
          title: 'Direct P2P Link Established',
          desc: remoteDevice ? `Connected to ${remoteDevice.name}` : 'Zero-server transmission active',
          color: 'text-brand-400',
          dot: 'bg-brand-500',
        };
      case 'failed':
      case 'disconnected':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
          title: 'Connection Lost',
          desc: 'Peer disconnected or handshake failed',
          color: 'text-rose-400',
          dot: 'bg-rose-500',
        };
      default:
        return {
          icon: <Radio className="w-4 h-4 text-gray-400" />,
          title: 'Ready',
          desc: 'Awaiting connection',
          color: 'text-gray-400',
          dot: 'bg-gray-500',
        };
    }
  };

  const info = getStatusContent();

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-subtle/40 border border-white/5 w-full">
      <div className="relative flex items-center justify-center p-2 rounded-xl bg-surface border border-white/5 shrink-0">
        {info.icon}
        <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${info.dot}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-200 truncate">{info.title}</p>
          {remoteDevice && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-gray-300 font-mono">
              {getDeviceIcon(remoteDevice)}
              {remoteDevice.name}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{info.desc}</p>
      </div>

      {role && (
        <span className="shrink-0 text-[10px] font-mono uppercase px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/5">
          {role}
        </span>
      )}
    </div>
  );
};
