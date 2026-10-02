import React, { useRef, useState } from 'react';
import { UploadCloud, FolderPlus, Plus } from 'lucide-react';
import { Button } from '../ui/button';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesSelected,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      // Reset input value so same files can be re-selected if desired
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={`group relative flex flex-col items-center justify-center p-6 sm:p-7 md:p-8 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer text-center ${
        isDragOver
          ? 'border-brand-400 bg-brand-500/10 scale-[1.01] shadow-glow-sm'
          : 'border-white/10 hover:border-brand-500/40 bg-surface-subtle/30 hover:bg-surface-subtle/60'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        className="hidden"
        id="file-dropzone-input"
      />

      <div className="relative mb-2.5 sm:mb-3">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface border border-white/10 flex items-center justify-center text-brand-400 group-hover:scale-105 group-hover:border-brand-500/40 group-hover:shadow-glow-sm transition-all duration-300">
          <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <div className="absolute -bottom-1 -right-1 p-1 bg-brand-500 text-gray-950 rounded-full shadow-md">
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      </div>

      <div className="space-y-1 sm:space-y-1.5 max-w-sm">
        <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-100 group-hover:text-brand-300 transition-colors">
          Drop files here, or <span className="text-brand-400 underline underline-offset-4">browse</span>
        </h3>
        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
          Direct peer-to-peer transmission. No file upload to servers.
        </p>
      </div>

      <div className="mt-4 sm:mt-5 flex items-center justify-center">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="pointer-events-auto"
        >
          <FolderPlus className="w-4 h-4 mr-2 text-brand-400" />
          Choose Files
        </Button>
      </div>
    </div>
  );
};
