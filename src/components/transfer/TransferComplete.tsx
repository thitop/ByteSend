import React from 'react';
import {
  CheckCircle2,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import type { FileItemState, TransferRole } from '../../types/transfer';
import { formatBytes } from '../../utils/format';

interface TransferCompleteProps {
  role: TransferRole | null;
  files: FileItemState[];
  totalBytes: number;
  onDownloadFile: (fileId: string) => void;
  onDownloadAll: () => void;
  onNewTransfer: () => void;
}

export const TransferComplete: React.FC<TransferCompleteProps> = ({
  role,
  files,
  totalBytes,
  onDownloadFile,
  onDownloadAll,
  onNewTransfer,
}) => {
  const isReceiver = role === 'receiver';

  return (
    <Card className="w-full max-w-xl mx-auto text-center">
      <div className="flex flex-col items-center space-y-6">
        {/* Glow Success Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-glow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="absolute -top-1 -right-1 p-1 rounded-full bg-surface border border-brand-400 text-brand-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Transfer Complete!
          </h2>
          <p className="text-sm text-gray-400">
            {isReceiver
              ? 'All files received directly to your browser memory'
              : 'All files sent successfully to receiver'}
          </p>
        </div>

        {/* Transfer Metrics Summary */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          <div className="p-3.5 rounded-2xl bg-surface-subtle/50 border border-white/5">
            <span className="text-xs text-gray-400 block mb-1">Total Files</span>
            <span className="text-lg font-bold font-mono text-gray-100">
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-subtle/50 border border-white/5">
            <span className="text-xs text-gray-400 block mb-1">Total Size</span>
            <span className="text-lg font-bold font-mono text-brand-400">
              {formatBytes(totalBytes)}
            </span>
          </div>
        </div>

        {/* Received Files List (Receiver View) */}
        {isReceiver && (
          <div className="w-full space-y-2 text-left pt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
              Received Files
            </p>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {files.map((file) => (
                <div
                  key={file.meta.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle/40 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {file.meta.name}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {formatBytes(file.meta.size)}
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onDownloadFile(file.meta.id)}
                    className="shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5 text-brand-400" />
                    Save
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="w-full pt-4 space-y-3">
          {isReceiver && (
            <Button
              variant="primary"
              size="lg"
              onClick={onDownloadAll}
              className="w-full"
            >
              <Download className="w-5 h-5 mr-2" />
              Download All Files
            </Button>
          )}

          <Button
            variant="secondary"
            size="lg"
            onClick={onNewTransfer}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2 text-gray-400" />
            Start New Transfer
          </Button>
        </div>
      </div>
    </Card>
  );
};
