import {
  FileText,
  FileArchive,
  Image as ImageIcon,
  Video,
  Music,
  Code2,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import type { FileItemState } from '../../types/transfer';
import { formatBytes } from '../../utils/format';

interface FileItemProps {
  item: FileItemState;
  showProgress?: boolean;
  onRemove?: () => void;
}

export const FileItem: React.FC<FileItemProps> = ({ item, showProgress = true, onRemove }) => {
  const getFileIcon = (name: string, type: string) => {
    const ext = name.split('.').pop()?.toLowerCase();

    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext || '')) {
      return <FileArchive className="w-5 h-5 text-amber-400" />;
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '') || type.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '') || type.startsWith('video/')) {
      return <Video className="w-5 h-5 text-cyan-400" />;
    }
    if (['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext || '') || type.startsWith('audio/')) {
      return <Music className="w-5 h-5 text-pink-400" />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css', 'go', 'rs', 'cpp'].includes(ext || '')) {
      return <Code2 className="w-5 h-5 text-indigo-400" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) {
      return <FileText className="w-5 h-5 text-rose-400" />;
    }
    return <File className="w-5 h-5 text-gray-400" />;
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-xs text-brand-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Done
          </span>
        );
      case 'transferring':
        return (
          <span className="flex items-center gap-1 text-xs text-accent-cyan font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            {item.progress}%
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-xs text-rose-400 font-medium">
            <AlertCircle className="w-4 h-4" />
            Failed
          </span>
        );
      default:
        return (
          <span className="text-xs text-gray-500 font-medium font-mono">
            Ready
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col p-2.5 sm:p-3 rounded-xl bg-surface-subtle/50 border border-white/5 hover:border-white/10 transition-colors shrink-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-surface/80 border border-white/5 shrink-0">
            {getFileIcon(item.meta.name, item.meta.type)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">
              {item.meta.name}
            </p>
            <p className="text-xs text-gray-500 font-mono">
              {formatBytes(item.meta.size)}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {getStatusBadge()}
          {onRemove && item.status !== 'transferring' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 rounded-md text-gray-500 hover:text-rose-400 hover:bg-white/5 transition-colors"
              title="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {showProgress && item.status === 'transferring' && (
        <div className="mt-2.5 w-full bg-surface rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-brand-500 h-full transition-all duration-150"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
