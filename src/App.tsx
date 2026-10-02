import { useEffect, useState, useRef } from 'react';
import { useDropCode } from './hooks/useDropCode';
import { Home } from './pages/Home';
import { Send } from './pages/Send';
import { Receive } from './pages/Receive';
import { FileTransferCard } from './components/transfer/FileTransferCard';
import { TransferComplete } from './components/transfer/TransferComplete';
import {
  Share2,
  Laptop,
  Smartphone,
  Tablet,
  AlertCircle,
  X,
  ShieldCheck,
} from 'lucide-react';

export function App() {
  const {
    view,
    role,
    roomId,
    expiresAt,
    localDevice,
    remoteDevice,
    connectionState,
    transferStatus,
    files,
    activeFileIndex,
    stats,
    errorMessage,
    isRoomExpired,
    startSendFlow,
    startReceiveFlow,
    pauseTransfer,
    resumeTransfer,
    cancelTransfer,
    resetToHome,
    downloadFile,
    downloadAllFiles,
  } = useDropCode();

  const [urlCode, setUrlCode] = useState('');
  const hasAutoJoinedRef = useRef(false);

  // Auto-connect and start receiving when scanning QR code (?code=XXXXXX)
  useEffect(() => {
    if (hasAutoJoinedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam && codeParam.trim().length === 6) {
      hasAutoJoinedRef.current = true;
      const cleanCode = codeParam.trim().toUpperCase();
      setUrlCode(cleanCode);
      // Clean query parameter from URL so refresh won't re-trigger after cancel
      window.history.replaceState({}, '', window.location.pathname);
      // Automatically join room and receive files immediately
      startReceiveFlow(cleanCode);
    }
  }, [startReceiveFlow]);

  const getDeviceIcon = (type: string) => {
    if (type === 'mobile') return <Smartphone className="w-4 h-4 text-brand-400" />;
    if (type === 'tablet') return <Tablet className="w-4 h-4 text-brand-400" />;
    return <Laptop className="w-4 h-4 text-brand-400" />;
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between selection:bg-brand-500/20 selection:text-brand-300">
      {/* Floating Navbar */}
      <header className="shrink-0 pt-3 sm:pt-4 px-4 max-w-6xl mx-auto w-full z-10">
        <nav className="bezel-inner rounded-2xl px-5 py-2.5 flex items-center justify-between shadow-xl">
          <div
            onClick={resetToHome}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-accent-cyan flex items-center justify-center text-gray-950 font-black shadow-glow-sm group-hover:scale-105 transition-transform">
              <Share2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base md:text-lg tracking-tight text-white">
                  ByteSend
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold">
                  P2P
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Device Identity Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-subtle/80 border border-white/5 text-xs text-gray-300">
              {getDeviceIcon(localDevice.type)}
              <span className="font-medium">{localDevice.name}</span>
            </div>

            {/* Security Indicator */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-subtle/80 border border-white/5 text-xs text-gray-300">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span className="hidden md:inline text-xs font-medium text-gray-300">Zero Cloud Storage</span>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 w-full">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="w-full max-w-xl mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-2.5 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => resetToHome()}
              className="text-rose-400 hover:text-rose-200 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* View Router */}
        {view === 'home' && (
          <Home
            onStartSend={startSendFlow}
            onStartReceive={startReceiveFlow}
            initialCode={urlCode}
          />
        )}

        {view === 'send' && (
          <Send
            roomId={roomId}
            expiresAt={expiresAt}
            connectionState={connectionState}
            remoteDevice={remoteDevice}
            files={files}
            onCancel={resetToHome}
            isExpired={isRoomExpired}
          />
        )}

        {view === 'receive' && (
          <Receive
            roomId={roomId}
            connectionState={connectionState}
            remoteDevice={remoteDevice}
            onCancel={resetToHome}
          />
        )}

        {view === 'transfer' && (
          <div className="w-full max-w-xl py-6 px-4">
            <FileTransferCard
              status={transferStatus}
              role={role}
              localDevice={localDevice}
              remoteDevice={remoteDevice}
              files={files}
              activeFileIndex={activeFileIndex}
              stats={stats}
              onPause={pauseTransfer}
              onResume={resumeTransfer}
              onCancel={cancelTransfer}
            />
          </div>
        )}

        {view === 'complete' && (
          <div className="w-full max-w-xl py-6 px-4">
            <TransferComplete
              role={role}
              files={files}
              totalBytes={stats.totalBytes}
              onDownloadFile={downloadFile}
              onDownloadAll={downloadAllFiles}
              onNewTransfer={resetToHome}
            />
          </div>
        )}
      </main>
    </div>
  );
}
export default App;
