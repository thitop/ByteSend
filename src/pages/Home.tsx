import React, { useState, useRef } from 'react';
import {
  Send,
  Download,
  ArrowRight,
  Sparkles,
  Lock,
  FolderPlus,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { FileDropzone } from '../components/file/FileDropzone';
import { FileList } from '../components/file/FileList';
import type { FileItemState } from '../types/transfer';

interface HomeProps {
  onStartSend: (files: File[]) => void;
  onStartReceive: (code: string) => void;
  initialCode?: string;
}

export const Home: React.FC<HomeProps> = ({
  onStartSend,
  onStartReceive,
  initialCode = '',
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [receiveCode, setReceiveCode] = useState(initialCode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesChosen = (newFiles: File[]) => {
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleAdditionalFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      e.target.value = '';
    }
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphanumeric characters, uppercase, max length 6
    const clean = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    setReceiveCode(clean);
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (receiveCode.length === 6) {
      onStartReceive(receiveCode);
    }
  };

  const fileItemStates: FileItemState[] = selectedFiles.map((file, idx) => ({
    meta: {
      id: `f-${idx}`,
      name: file.name,
      size: file.size,
      type: file.type,
      totalChunks: Math.ceil(file.size / 65536),
    },
    status: 'pending',
    progress: 0,
    transferredBytes: 0,
  }));

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col justify-center space-y-6 md:space-y-8 my-auto px-4 py-2">
      {/* Hero Header */}
      <div className="text-center space-y-2.5 max-w-3xl mx-auto px-4">
        <Badge variant="brand" className="mb-1 py-1 px-3 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-400 mr-1.5" />
          WebRTC P2P Technology
        </Badge>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-white leading-tight">
          <div>Send files directly.</div>
          <div className="mt-1">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-emerald-300 to-accent-cyan">
              No upload.
            </span>{' '}
            <span>No cloud.</span>
          </div>
        </h1>

        <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto font-normal leading-relaxed">
          Transfer any size file between devices with an unambiguous 6-character code.
          Direct peer-to-peer connection with end-to-end memory transmission.
        </p>
      </div>

      {/* Main Dual Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Send Section (Col 7) */}
        <div className="lg:col-span-7 flex flex-col">
          <Card
            className="h-[480px] min-h-[480px] max-h-[480px] overflow-hidden"
            innerClassName="h-full flex flex-col justify-between min-h-0 overflow-hidden p-5 sm:p-6 md:p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 md:pb-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white leading-tight">Send Files</h2>
                  <p className="text-xs text-gray-400">Select or drop files to generate a transfer room</p>
                </div>
              </div>
            </div>

            {/* Content area: Dropzone or FileList */}
            {selectedFiles.length === 0 ? (
              <div className="flex-1 min-h-0 flex flex-col justify-center py-2">
                <FileDropzone onFilesSelected={handleFilesChosen} />
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col justify-between gap-3 py-2 overflow-hidden">
                <FileList
                  files={fileItemStates}
                  onClear={handleClearFiles}
                  onRemoveFile={handleRemoveFile}
                  title="Selected Files"
                  className="flex-1 min-h-0 overflow-hidden"
                  listClassName="flex-1 min-h-0 overflow-y-auto max-h-[220px]"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleAdditionalFiles}
                  className="hidden"
                  id="home-additional-file-input"
                />

                <div className="flex items-center gap-2 sm:gap-3 pt-3 shrink-0 border-t border-white/5">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-h-[44px] md:min-h-[46px] text-xs sm:text-sm md:text-base font-semibold"
                    id="add-more-files-btn"
                  >
                    <FolderPlus className="w-4 h-4 mr-1.5 sm:mr-2 text-brand-400 shrink-0" />
                    <span>Add More Files</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => onStartSend(selectedFiles)}
                    className="flex-1 min-h-[44px] md:min-h-[46px] text-xs sm:text-sm md:text-base font-semibold"
                  >
                    <span>Create Transfer</span>
                    <ArrowRight className="w-4 h-4 ml-1.5 sm:ml-2 shrink-0" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Receive Section (Col 5) */}
        <div className="lg:col-span-5 flex flex-col">
          <Card
            className="h-[480px] min-h-[480px] max-h-[480px] overflow-hidden"
            innerClassName="h-full flex flex-col justify-between min-h-0 overflow-hidden p-5 sm:p-6 md:p-8"
          >
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-white/5 shrink-0">
                <div className="p-2.5 rounded-xl bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white leading-tight">Receive Files</h2>
                  <p className="text-xs text-gray-400">Enter a 6-character room code from the sender</p>
                </div>
              </div>

              <form onSubmit={handleReceiveSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="room-code-input" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Transfer Code
                  </label>
                  <div className="relative">
                    <input
                      id="room-code-input"
                      type="text"
                      maxLength={6}
                      value={receiveCode}
                      onChange={handleCodeChange}
                      placeholder="e.g. 8K4P2M"
                      className="w-full h-14 md:h-16 px-4 bg-surface-subtle/80 border border-white/10 rounded-2xl text-center font-mono text-2xl md:text-3xl font-bold tracking-[0.25em] text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-all uppercase"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {receiveCode && (
                      <button
                        type="button"
                        onClick={() => setReceiveCode('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-200"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    6 alphanumeric uppercase characters without O/0 and I/1
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={receiveCode.length !== 6}
                  className="w-full h-12 md:h-14 min-h-[48px] bg-accent-cyan hover:bg-cyan-400 border-cyan-400/30 text-gray-950 font-bold shadow-glow-cyan text-base"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Connect & Receive
                </Button>
              </form>
            </div>

            {/* Quick Info Box */}
            <div className="mt-5 p-4 rounded-2xl bg-surface-subtle/40 border border-white/5 space-y-2 shrink-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                <Lock className="w-3.5 h-3.5 text-brand-400" />
                <span>How ByteSend Works</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Both devices connect directly through your browser. Files stream straight from sender RAM/Disk to receiver storage.
              </p>
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
};
