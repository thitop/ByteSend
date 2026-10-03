import React from 'react';
import { Terminal, X } from 'lucide-react';

interface ProtocolDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProtocolDrawer: React.FC<ProtocolDrawerProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-surface-card border-l border-surface-border p-6 transform transition-transform duration-200 ease-in-out flex flex-col justify-between shadow-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-border">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              Protocol Specification
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs font-mono text-slate-300">
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Signaling Server</span>
              <span className="text-slate-200">Ephemeral WebSocket (No disk persistence)</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">NAT Traversal</span>
              <span className="text-slate-200">STUN (RFC 5389) Direct Binding</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Data Protocol</span>
              <span className="text-slate-200">SCTP over DTLS (RFC 8261)</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Chunk Window Size</span>
              <span className="text-slate-200">16,384 bytes per packet buffer</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Dictionary</span>
              <span className="text-slate-200">32-character unambiguous base glyphs</span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono pt-4 border-t border-surface-border text-center">
          ByteSend • Open Peer-to-Peer Standard
        </div>
      </aside>
    </>
  );
};
