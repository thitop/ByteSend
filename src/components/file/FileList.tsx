import React from 'react';
import { FileItem } from './FileItem';
import type { FileItemState } from '../../types/transfer';
import { formatBytes } from '../../utils/format';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface FileListProps {
  files: FileItemState[];
  onClear?: () => void;
  onRemoveFile?: (index: number) => void;
  title?: string;
  showProgress?: boolean;
  className?: string;
  listClassName?: string;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onClear,
  onRemoveFile,
  title = 'Selected Files',
  showProgress = false,
  className,
  listClassName,
}) => {
  if (files.length === 0) return null;

  const totalBytes = files.reduce((acc, f) => acc + f.meta.size, 0);

  return (
    <div className={twMerge(clsx('w-full flex flex-col min-h-0 overflow-hidden', className))}>
      <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-white/5 shrink-0">
        <span className="font-semibold uppercase tracking-wider text-gray-300">
          {title} ({files.length})
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-gray-300">{formatBytes(totalBytes)}</span>
          {onClear && (
            <button
              onClick={onClear}
              className="text-rose-400 hover:text-rose-300 transition-colors font-medium hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div
        className={twMerge(
          clsx('flex-1 min-h-0 space-y-2 overflow-y-auto pr-1.5 pt-2 custom-scrollbar touch-pan-y', listClassName)
        )}
      >
        {files.map((item, idx) => (
          <FileItem
            key={item.meta.id}
            item={item}
            showProgress={showProgress}
            onRemove={onRemoveFile ? () => onRemoveFile(idx) : undefined}
          />
        ))}
      </div>
    </div>
  );
};
