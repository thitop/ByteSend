import React from 'react';
import {
  Pause,
  Play,
  X,
  FileCode,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import type { FileItemState, TransferStats, TransferStatus } from '../../types/transfer';
import type { DeviceInfo } from '../../types/signaling';
import { formatBytes } from '../../utils/format';

interface FileTransferCardProps {
  status: TransferStatus;
  role: 'sender' | 'receiver' | null;
  localDevice: DeviceInfo;
  remoteDevice: DeviceInfo | null;
  files: FileItemState[];
  activeFileIndex: number;
  stats: TransferStats;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export const FileTransferCard: React.FC<FileTransferCardProps> = ({
  status,
  role,
  localDevice,
  remoteDevice,
  files,
  activeFileIndex,
  stats,
  onPause,
  onResume,
  onCancel,
}) => {
  const isSender = role === 'sender';
  const activeFile = files[activeFileIndex] || files[0];
  const isPaused = status === 'paused';
  const percent = Math.min(100, Math.max(0, Math.round(stats.percent || 0)));

  return (
    <div className="max-w-xl mx-auto w-full py-4 px-2 sm:px-0">
      <div className="pro-card rounded-xl p-6 sm:p-7 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-slate-200">
              CONNECTED • STREAMING VIA WEBRTC
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-surface-subtle px-2 py-0.5 rounded border border-surface-border">
            {isSender ? 'Transmitting' : 'Receiving'}
          </span>
        </div>

        {/* Remote Pairing Device Info */}
        <div className="my-5 p-3 rounded-lg bg-surface-subtle/50 border border-surface-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>
              {isSender ? `${localDevice.name} → ` : 'Receiving on this device from: '}
              <strong className="text-white font-medium">
                {remoteDevice ? `${remoteDevice.name} (${remoteDevice.type})` : 'Remote Peer'}
              </strong>
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            E2E Encrypted
          </span>
        </div>

        {/* Streaming Progress Box */}
        <div className="p-4 rounded-lg bg-surface-subtle/70 border border-surface-border mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-300 font-medium truncate pr-2">
              {isPaused
                ? 'Transmission Paused'
                : `Streaming packets to RAM: ${activeFile?.meta?.name || 'File'}`}
            </span>
            <span className="font-mono text-sky-400 font-semibold">{percent}%</span>
          </div>
          
          <div className="w-full h-2.5 bg-surface-base rounded-full overflow-hidden border border-surface-border">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                isPaused ? 'bg-amber-400' : 'bg-sky-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Transfer Telemetry */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[11px] font-mono">
            <div className="p-1.5 rounded bg-surface-base border border-surface-border">
              <span className="block text-slate-500 text-[10px]">SPEED</span>
              <span className="text-slate-300 font-medium">
                {isPaused ? '0.0 MB/s' : stats.formattedSpeed || '0.0 MB/s'}
              </span>
            </div>
            <div className="p-1.5 rounded bg-surface-base border border-surface-border">
              <span className="block text-slate-500 text-[10px]">TRANSFERRED</span>
              <span className="text-slate-300 font-medium">
                {formatBytes(stats.transferredBytes)} / {formatBytes(stats.totalBytes)}
              </span>
            </div>
            <div className="p-1.5 rounded bg-surface-base border border-surface-border">
              <span className="block text-slate-500 text-[10px]">TIME REMAINING</span>
              <span className="text-slate-300 font-medium">
                {isPaused ? 'Paused' : stats.formattedEta || '--'}
              </span>
            </div>
          </div>
        </div>

        {/* File Manifest with Progress */}
        <div className="mb-5">
          <div className="text-[11px] font-mono text-slate-400 uppercase mb-2">
            Transfer Manifest (<span className="text-slate-200 font-semibold">{files.length}</span>)
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {files.map((file, idx) => {
              const isCompleted = file.status === 'completed';
              const isActive = idx === activeFileIndex;

              return (
                <div
                  key={file.meta.id || idx}
                  className={`flex items-center justify-between p-2 rounded border text-xs ${
                    isActive
                      ? 'bg-surface-subtle border-sky-500/40 text-white'
                      : 'bg-surface-base border-surface-border text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate font-medium">{file.meta.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                    <span className="text-slate-400">{formatBytes(file.meta.size)}</span>
                    <span className={isCompleted ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {isCompleted ? '100%' : `${file.progress}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="pt-3 border-t border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPaused ? (
              <button
                type="button"
                onClick={onResume}
                className="px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onPause}
                className="px-3 py-1.5 rounded-md bg-surface-subtle hover:bg-slate-800 border border-surface-border text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Pause className="w-3 h-3" />
                <span>Pause</span>
              </button>
            )}

            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 px-2.5 py-1.5 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel Transfer</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-500">
            RFC 8831 WebRTC DataChannel
          </span>
        </div>
      </div>
    </div>
  );
};
