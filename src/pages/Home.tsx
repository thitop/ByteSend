import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  FolderPlus,
  File as FileIcon,
  X,
  Radio,
  ArrowDownToLine,
  Check,
} from 'lucide-react';
import { formatBytes } from '../utils/format';
import { useToast } from '../context/ToastContext';

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
  const { showToast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [codeChars, setCodeChars] = useState<string[]>(['', '', '', '', '', '']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize code chars if initialCode provided
  useEffect(() => {
    if (initialCode) {
      const clean = initialCode.toUpperCase().replace(/[^2-9A-HJ-NP-Z]/g, '').slice(0, 6);
      const chars = clean.split('');
      setCodeChars([
        chars[0] || '',
        chars[1] || '',
        chars[2] || '',
        chars[3] || '',
        chars[4] || '',
        chars[5] || '',
      ]);
    }
  }, [initialCode]);

  const addFiles = (files: File[]) => {
    if (files.length === 0) return;
    setSelectedFiles((prev) => [...prev, ...files]);
    showToast(`Staged ${files.length} file(s) for transfer`, 'info');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
  };

  const totalFileSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  // Segmented Code Inputs Handler
  const handleCharInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.toUpperCase();
    // Allow unambiguous dictionary
    const sanitized = rawVal.replace(/[^2-9A-HJ-NP-Z]/g, '');

    if (sanitized.length > 1) {
      // Handles pasting or typing multi-chars
      fillChars(sanitized);
      return;
    }

    const nextChars = [...codeChars];
    nextChars[index] = sanitized;
    setCodeChars(nextChars);

    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeChars[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fillChars = (str: string) => {
    const clean = str.toUpperCase().replace(/[^2-9A-HJ-NP-Z]/g, '').slice(0, 6);
    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      updated[i] = clean[i] || '';
    }
    setCodeChars(updated);

    const targetIndex = Math.min(clean.length, 5);
    inputRefs.current[targetIndex]?.focus();
  };

  const handlePasteCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          fillChars(text);
          showToast('Pasted room code from clipboard', 'info');
          return;
        }
      }
    } catch {
      // fallback
    }

    const promptVal = prompt('Paste 6-character room code:');
    if (promptVal) {
      fillChars(promptVal);
    }
  };

  const fullCode = codeChars.join('');

  const handleStartSend = () => {
    if (selectedFiles.length === 0) {
      showToast('Stage at least one file before generating a code', 'error');
      return;
    }
    onStartSend(selectedFiles);
  };

  const handleStartReceive = () => {
    if (fullCode.length < 6) {
      showToast('Please enter a complete 6-character room code', 'error');
      return;
    }
    onStartReceive(fullCode);
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-center">
      {/* Hero Title & Credibility Statement */}
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
          Send files directly. <br />
          <span className="text-slate-300">No upload. No cloud.</span>
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed font-normal">
          Exchange files of any size directly between browsers using an unambiguous 6-character room code. 
          Zero intermediary storage. Data streams strictly from device RAM to device storage.
        </p>
      </div>

      {/* MAIN WORKSPACE: SEND & RECEIVE DUAL PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full items-start">
        
        {/* ==================== LEFT: SEND FILES ==================== */}
        <section className="pro-card rounded-xl p-5 sm:p-6 flex flex-col justify-between md:h-[480px]">
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-surface-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Send Files</h2>
                <p className="text-xs text-slate-400">Stage files for direct peer stream</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-surface-subtle px-2 py-0.5 rounded border border-surface-border">
              Sender
            </span>
          </div>

          {/* Middle Body */}
          <div className="flex-1 min-h-0 flex flex-col my-3 overflow-hidden">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileInputChange}
            />

            {selectedFiles.length === 0 ? (
              /* Full-size Drag & Drop Box when empty */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 min-h-0 border border-dashed rounded-lg p-6 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-sky-500 bg-surface-subtle/80'
                    : 'border-slate-700 hover:border-sky-500/80 bg-surface-subtle/40 hover:bg-surface-subtle/80'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-surface-base border border-surface-border flex items-center justify-center text-slate-400 mb-2.5">
                  <FolderPlus className="w-5 h-5 text-sky-400" />
                </div>
                <p className="text-xs font-medium text-slate-200 mb-1">
                  Click to select files, or drag them here
                </p>
                <p className="text-[11px] text-slate-400">
                  Any file type • No size limits • Streams in memory
                </p>
              </div>
            ) : (
              /* Compact Drop Strip + Scrollable File List */
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* Compact Add More Strip */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`shrink-0 border border-dashed rounded-lg p-2.5 text-center cursor-pointer transition flex items-center justify-center gap-2 mb-2.5 ${
                    isDragging
                      ? 'border-sky-500 bg-surface-subtle/80'
                      : 'border-slate-700 hover:border-sky-500/80 bg-surface-subtle/40 hover:bg-surface-subtle/80'
                  }`}
                >
                  <FolderPlus className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-xs font-medium text-slate-300">
                    Click or drag to add more files
                  </span>
                </div>

                {/* Staged List Header */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 px-1 shrink-0">
                  <span>
                    Staged (<strong className="text-slate-200 font-semibold font-mono">{selectedFiles.length}</strong>)
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-300">{formatBytes(totalFileSize)}</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-slate-400 hover:text-red-400 text-[11px] transition"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                {/* Staged List Items (Scrollable) */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {selectedFiles.map((f, idx) => (
                    <div
                      key={`${f.name}-${idx}`}
                      className="flex items-center justify-between p-2 rounded bg-surface-base border border-surface-border text-xs"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <FileIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-200 font-medium">{f.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-slate-400">{formatBytes(f.size)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(idx);
                          }}
                          className="text-slate-500 hover:text-red-400 p-0.5 transition"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-surface-border shrink-0">
            <button
              onClick={handleStartSend}
              disabled={selectedFiles.length === 0}
              className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Generate Transfer Code</span>
            </button>
          </div>
        </section>

        {/* ==================== RIGHT: RECEIVE FILES ==================== */}
        <section className="pro-card rounded-xl p-5 sm:p-6 flex flex-col justify-between md:h-[480px]">
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-surface-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Receive Files</h2>
                <p className="text-xs text-slate-400">Join room via unambiguous 6-character code</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-surface-subtle px-2 py-0.5 rounded border border-surface-border">
              Receiver
            </span>
          </div>

          {/* Middle Body */}
          <div className="flex-1 min-h-0 flex flex-col justify-between my-3">
            <div className="p-4 rounded-lg bg-surface-subtle/50 border border-surface-border">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Room Code
              </label>

              {/* 6-character Segmented Clean Input Boxes */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2">
                {[0, 1, 2].map((idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={codeChars[idx]}
                    onChange={(e) => handleCharInput(idx, e)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    placeholder="·"
                    className="code-input-char w-10 h-12 sm:w-11 sm:h-12 text-center text-lg font-mono font-bold uppercase rounded-md bg-surface-base border border-surface-border text-white transition-all"
                  />
                ))}
                <span className="text-slate-600 font-bold select-none">-</span>
                {[3, 4, 5].map((idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={codeChars[idx]}
                    onChange={(e) => handleCharInput(idx, e)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    placeholder="·"
                    className="code-input-char w-10 h-12 sm:w-11 sm:h-12 text-center text-lg font-mono font-bold uppercase rounded-md bg-surface-base border border-surface-border text-white transition-all"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-2">
                <span>Dictionary excludes ambiguous 0/O, 1/I</span>
                <button
                  type="button"
                  onClick={handlePasteCode}
                  className="text-sky-400 hover:text-sky-300 font-sans hover:underline"
                >
                  Paste Code
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-400 mt-3">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Direct connection established without file staging on cloud.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>High speed local LAN fallback if peers share the same Wi-Fi.</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-surface-border shrink-0">
            <button
              onClick={handleStartReceive}
              disabled={fullCode.length < 6}
              className="w-full py-2.5 px-4 rounded-lg bg-surface-subtle hover:bg-slate-800 border border-surface-border text-white font-medium text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-sky-400" />
              <span>Connect & Download</span>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};
