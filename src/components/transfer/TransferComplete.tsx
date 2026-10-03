import React from 'react';
import {
  CheckCircle2,
  Download,
  RotateCcw,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
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
    <div className="max-w-xl mx-auto w-full py-4 px-2 sm:px-0">
      <div className="pro-card rounded-xl p-6 sm:p-7 shadow-lg text-center">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono font-semibold text-slate-200">
              TRANSFER COMPLETE • INTEGRITY VERIFIED
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            Success
          </span>
        </div>

        {/* Icon & Title */}
        <div className="my-2 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-glow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
            File Transfer Verified & Complete
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {isReceiver
              ? 'Files streamed directly into browser memory. Zero intermediary cloud storage.'
              : 'All files successfully streamed to the remote peer via WebRTC.'}
          </p>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-2 gap-3 my-5 max-w-md mx-auto text-center font-mono text-xs">
          <div className="p-3 rounded-lg bg-surface-subtle/50 border border-surface-border">
            <span className="block text-slate-500 text-[10px]">TOTAL FILES</span>
            <span className="text-slate-200 font-semibold">{files.length}</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-subtle/50 border border-surface-border">
            <span className="block text-slate-500 text-[10px]">TOTAL PAYLOAD</span>
            <span className="text-slate-200 font-semibold">{formatBytes(totalBytes)}</span>
          </div>
        </div>

        {/* Download Action for Receiver */}
        {isReceiver && (
          <div className="mb-5 space-y-3">
            <button
              type="button"
              onClick={onDownloadAll}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download All Files ({files.length})</span>
            </button>

            {/* Individual File Download List */}
            <div className="max-h-36 overflow-y-auto space-y-1.5 text-left text-xs pr-1">
              {files.map((file) => (
                <div
                  key={file.meta.id}
                  className="flex items-center justify-between p-2 rounded bg-surface-base border border-surface-border"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-200 font-medium">{file.meta.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDownloadFile(file.meta.id)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 shrink-0 ml-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start New Transfer Button */}
        <div className="pt-4 border-t border-surface-border flex items-center justify-between">
          <button
            type="button"
            onClick={onNewTransfer}
            className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-md bg-surface-subtle border border-surface-border flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Transfer</span>
          </button>

          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SHA-256 Verified</span>
          </span>
        </div>

      </div>
    </div>
  );
};
