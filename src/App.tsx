import { useEffect, useState, useRef } from 'react';
import { useDropCode } from './hooks/useDropCode';
import { Home } from './pages/Home';
import { Send } from './pages/Send';
import { Receive } from './pages/Receive';
import { FileTransferCard } from './components/transfer/FileTransferCard';
import { TransferComplete } from './components/transfer/TransferComplete';
import { ProtocolDrawer } from './components/layout/ProtocolDrawer';
import { ToastProvider } from './context/ToastContext';
import byteSendLogo from './img/ByteSend_logo.png';
import {
  Info,
  AlertCircle,
  X,
  ShieldAlert,
  Lock,
  Gauge,
} from 'lucide-react';

function AppContent() {
  const {
    view,
    role,
    roomId,
    expiresAt,
    localDevice,
    remoteDevice,
    connectionState,
    serverStatus,
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
  const [isProtocolOpen, setIsProtocolOpen] = useState(false);
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
      window.history.replaceState({}, '', window.location.pathname);
      startReceiveFlow(cleanCode);
    }
  }, [startReceiveFlow]);

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-sky-500/20 selection:text-sky-200">
      {/* Header */}
      <header className="border-b border-surface-border/80 bg-surface-base/90 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div
            onClick={resetToHome}
            className="flex items-center gap-2.5 focus:outline-none group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-surface-borderLight flex items-center justify-center p-0.5 group-hover:border-sky-500/50 transition shrink-0">
              <img
                src={byteSendLogo}
                alt="ByteSend Logo"
                className="w-full h-full object-contain rounded-md"
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold tracking-tight text-white">ByteSend</span>
              <span className="text-[11px] font-mono font-medium text-slate-400 bg-surface-subtle px-1.5 py-0.5 rounded border border-surface-border">
                P2P
              </span>
            </div>
          </div>

          {/* Right Utilities: Signaling Status & Protocol Spec */}
          <div className="flex items-center gap-3">
            {/* Live STUN/Signaling Status */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-subtle border border-surface-border text-xs text-slate-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  serverStatus === 'ready'
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : serverStatus === 'waking'
                    ? 'bg-amber-400 animate-ping'
                    : serverStatus === 'error'
                    ? 'bg-rose-500'
                    : 'bg-slate-400 animate-pulse'
                }`}
              />
              <span className="text-slate-400">Status:</span>
              <span className="text-slate-200 font-medium">
                {serverStatus === 'ready' && 'Connected'}
                {serverStatus === 'waking' && 'Waking Server... (~40s)'}
                {serverStatus === 'error' && 'Offline'}
                {(serverStatus === 'checking' || serverStatus === 'idle') && 'Connecting...'}
              </span>
            </div>

            {/* Protocol Spec button */}
            <button
              type="button"
              onClick={() => setIsProtocolOpen(true)}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-surface-subtle border border-transparent hover:border-surface-border transition flex items-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Protocol Spec</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 flex-1 flex flex-col justify-center">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="w-full max-w-xl mx-auto mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-2.5 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={resetToHome}
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
            serverStatus={serverStatus}
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
        )}

        {view === 'complete' && (
          <TransferComplete
            role={role}
            files={files}
            totalBytes={stats.totalBytes}
            onDownloadFile={downloadFile}
            onDownloadAll={downloadAllFiles}
            onNewTransfer={resetToHome}
          />
        )}

        {/* TRUST & ARCHITECTURAL PILLARS (Clean, honest, no jargon bloat) */}
        <div className="mt-14 max-w-4xl mx-auto w-full">
          <div className="border-t border-surface-border/70 pt-8">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 text-center mb-6">
              Architectural Transparency & Security
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 rounded-lg bg-surface-subtle/30 border border-surface-border">
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs mb-1.5">
                  <ShieldAlert className="w-4 h-4 text-sky-400" />
                  <span>Zero Knowledge Transfer</span>
                </div>
                <p className="text-[12px] text-slate-400 leading-normal">
                  ByteSend servers never receive or store file bytes. The signaling server is only used to exchange STUN connection offers and drops immediately.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-surface-subtle/30 border border-surface-border">
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs mb-1.5">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>DTLS 1.3 / AES-GCM 256</span>
                </div>
                <p className="text-[12px] text-slate-400 leading-normal">
                  Direct P2P sockets are protected by authenticated browser cryptographic primitives, shielding against intermediate packet inspection.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-surface-subtle/30 border border-surface-border">
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs mb-1.5">
                  <Gauge className="w-4 h-4 text-indigo-400" />
                  <span>Line-Rate Memory Stream</span>
                </div>
                <p className="text-[12px] text-slate-400 leading-normal">
                  Files stream chunk-by-chunk directly into memory with zero disk caching on intermediaries. Transfers are capped only by your device and network speed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Protocol Specification Drawer */}
      <ProtocolDrawer
        isOpen={isProtocolOpen}
        onClose={() => setIsProtocolOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-surface-border bg-surface-base py-6 text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Network state: <strong>All signaling clusters operational</strong></span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>No Analytics Cookies</span>
            <span>•</span>
            <span>Zero Logs</span>
            <span>•</span>
            <span>WebRTC 1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
export default App;
