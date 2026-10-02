import React from 'react';
import {
  Laptop,
  Smartphone,
  Tablet,
  ShieldCheck,
  Pause,
  Play,
  XCircle,
  FileCode,
  ArrowRight,
  Zap,
  Clock,
  HardDrive,
  Files,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Card } from '../ui/card';
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
  const sourceDevice = isSender ? localDevice : remoteDevice;
  const destDevice = isSender ? remoteDevice : localDevice;

  const activeFile = files[activeFileIndex] || files[0];
  const isPaused = status === 'paused';

  const renderDevice = (device?: DeviceInfo | null, label = 'Device') => {
    const isMobile = device?.type === 'mobile';
    const isTablet = device?.type === 'tablet';

    return (
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="relative p-4 rounded-2xl bg-surface-subtle border border-white/10 shadow-lg">
          {isMobile ? (
            <Smartphone className="w-8 h-8 text-brand-400" />
          ) : isTablet ? (
            <Tablet className="w-8 h-8 text-brand-400" />
          ) : (
            <Laptop className="w-8 h-8 text-brand-400" />
          )}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-brand-500 border-2 border-surface" />
        </div>
        <div className="space-y-0.5 max-w-[120px]">
          <p className="text-xs font-semibold text-gray-200 truncate">
            {device?.name || label}
          </p>
          <p className="text-[10px] text-gray-400 font-mono">
            {device?.os || 'Direct Peer'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-5 border-b border-white/5">
        <div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>File Transfer</span>
            {isPaused && (
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Paused
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400">
            {isSender ? 'Sending to peer device' : 'Receiving from peer device'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-brand-400" />
          <span className="hidden sm:inline">Direct P2P Encrypted</span>
        </div>
      </div>

      {/* Device-to-Device Animated Beam */}
      <div className="py-6 px-2 flex items-center justify-between gap-4">
        {renderDevice(sourceDevice, 'Sender')}

        {/* Animated Transfer Wave */}
        <div className="flex-1 flex flex-col items-center px-2">
          <div className="relative w-full flex items-center justify-center">
            {/* Base line */}
            <div className="w-full h-1 bg-surface-subtle rounded-full border border-white/5 overflow-hidden relative">
              {/* Animated active beam */}
              {!isPaused && (
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500 via-accent-cyan to-brand-500 animate-shimmer" />
              )}
            </div>

            {/* Center icon */}
            <div className="absolute -top-3 p-1.5 rounded-full bg-surface border border-white/10 shadow-md">
              <ArrowRight className="w-4 h-4 text-brand-400" />
            </div>
          </div>
          <span className="text-[11px] font-mono text-gray-400 mt-3">
            WebRTC DataChannel
          </span>
        </div>

        {renderDevice(destDevice, 'Receiver')}
      </div>

      {/* Active File Details & Main Progress */}
      <div className="space-y-4 pt-2 pb-6">
        {activeFile && (
          <div className="p-3.5 rounded-2xl bg-surface-subtle/50 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate pr-2">
                <FileCode className="w-4 h-4 text-brand-400 shrink-0" />
                <span className="font-medium text-gray-200 truncate">
                  {activeFile.meta.name}
                </span>
              </div>
              <span className="font-mono text-gray-400 shrink-0">
                {formatBytes(activeFile.transferredBytes)} / {formatBytes(activeFile.meta.size)}
              </span>
            </div>

            <Progress value={activeFile.progress} barClassName="bg-brand-500" />
          </div>
        )}

        {/* Overall Transfer Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">Total Progress ({files.length} files)</span>
            <span className="text-brand-400 font-bold text-sm">{stats.percent}%</span>
          </div>
          <Progress value={stats.percent} className="h-4" />
        </div>
      </div>

      {/* Transfer Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4 border-y border-white/5">
        <div className="p-3 rounded-xl bg-surface-subtle/40 border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Speed</span>
          </div>
          <p className="font-mono text-sm font-semibold text-gray-100 truncate">
            {stats.formattedSpeed}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-surface-subtle/40 border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Remaining</span>
          </div>
          <p className="font-mono text-sm font-semibold text-gray-100 truncate">
            {stats.formattedEta}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-surface-subtle/40 border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Transferred</span>
          </div>
          <p className="font-mono text-sm font-semibold text-gray-100 truncate">
            {formatBytes(stats.transferredBytes)}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-surface-subtle/40 border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Files className="w-3.5 h-3.5 text-indigo-400" />
            <span>Files</span>
          </div>
          <p className="font-mono text-sm font-semibold text-gray-100 truncate">
            {activeFileIndex + 1} of {files.length}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6">
        <Button
          variant="outline"
          size="md"
          onClick={onCancel}
          className="w-full sm:w-auto text-rose-400 hover:text-rose-300 hover:border-rose-500/30"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Cancel Transfer
        </Button>

        {isSender && (
          <Button
            variant="secondary"
            size="md"
            onClick={isPaused ? onResume : onPause}
            className="w-full sm:w-auto"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 mr-2 text-brand-400" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-2 text-amber-400" />
                Pause
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};
