import React from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ConnectionStatus } from '../components/room/ConnectionStatus';
import type { ConnectionState } from '../hooks/useDropCode';
import type { DeviceInfo } from '../types/signaling';
import { ArrowLeft, XCircle, Loader2 } from 'lucide-react';

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
  return (
    <div className="w-full max-w-md mx-auto space-y-6 py-6 px-4">
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Cancel Receive
      </button>

      <Card>
        <div className="space-y-6 text-center">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Connecting to Sender</h2>
            <p className="text-xs text-gray-400">
              Establishing direct peer-to-peer data channel
            </p>
          </div>

          {roomId && (
            <div className="p-4 rounded-2xl bg-surface-subtle border border-white/10 font-mono text-3xl font-bold tracking-[0.25em] text-accent-cyan">
              {roomId}
            </div>
          )}

          <ConnectionStatus
            state={connectionState}
            remoteDevice={remoteDevice}
            role="receiver"
          />

          <div className="p-4 rounded-2xl bg-surface-subtle/40 border border-white/5 text-xs text-gray-400 leading-relaxed text-left flex items-start gap-2.5">
            <Loader2 className="w-4 h-4 text-accent-cyan animate-spin shrink-0 mt-0.5" />
            <span>
              Negotiating STUN candidates and WebRTC DataChannel. Once connected, file transfer will start automatically.
            </span>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={onCancel}
            className="w-full text-rose-400 hover:text-rose-300 hover:border-rose-500/30"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel Connection
          </Button>
        </div>
      </Card>
    </div>
  );
};
