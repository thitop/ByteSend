import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode as QrIcon, Smartphone } from 'lucide-react';
import { Button } from '../ui/button';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, roomId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const joinUrl = `${window.location.origin}/?code=${roomId}`;

  useEffect(() => {
    if (isOpen && canvasRef.current && roomId) {
      QRCode.toCanvas(
        canvasRef.current,
        joinUrl,
        {
          width: 280,
          margin: 1.5,
          color: {
            dark: '#090a0f',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) {
            console.error('[QRCode] Error rendering QR code', error);
          } else if (canvasRef.current) {
            canvasRef.current.style.width = '100%';
            canvasRef.current.style.height = '100%';
            canvasRef.current.style.maxWidth = '100%';
          }
        }
      );
    }
  }, [isOpen, roomId, joinUrl]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bezel-outer rounded-3xl p-1 sm:p-1.5 w-full max-w-[340px] sm:max-w-sm shadow-2xl relative mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bezel-inner rounded-[calc(1.5rem-0.25rem)] p-4 sm:p-6 text-center space-y-4 sm:space-y-5">
          <div className="flex items-center justify-center gap-2 text-brand-400">
            <QrIcon className="w-5 h-5" />
            <span className="text-sm font-semibold tracking-wide uppercase">Scan to Connect</span>
          </div>

          {/* QR Code Container: strictly centered and responsive */}
          <div className="w-full flex items-center justify-center py-1">
            <div className="p-2.5 sm:p-3 bg-white rounded-2xl shadow-inner border-4 border-white w-[200px] sm:w-[230px] aspect-square flex items-center justify-center mx-auto">
              <canvas ref={canvasRef} className="w-full h-full rounded-lg block !max-w-full" />
            </div>
          </div>

          <div className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-300 font-medium">
              <Smartphone className="w-4 h-4 text-accent-cyan" />
              <span>Point phone camera at QR code</span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono break-all pt-1">
              Code: <strong className="text-brand-400 text-sm">{roomId}</strong>
            </p>
          </div>

          <Button variant="secondary" size="md" className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
