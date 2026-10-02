import React, { useState, useEffect } from 'react';
import { Copy, Check, QrCode as QrIcon, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { QRCodeModal } from './QRCodeModal';
import { formatCountdown } from '../../utils/format';

interface RoomCodeProps {
  roomId: string;
  expiresAt: number | null;
  onExpire?: () => void;
}

export const RoomCode: React.FC<RoomCodeProps> = ({ roomId, expiresAt, onExpire }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0 && onExpire) {
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Room Code expires in</span>
          <span className="font-mono text-amber-300 font-semibold">
            {formatCountdown(timeLeft)}
          </span>
        </div>

        {/* 6-character Code Display */}
        <div className="flex items-center justify-center px-6 py-4 rounded-2xl bg-surface-subtle/80 border border-brand-500/30 shadow-glow-sm select-all">
          <div className="pl-[0.25em] text-center text-3xl sm:text-4xl md:text-5xl font-mono font-bold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-emerald-300 to-green-400">
            {roomId}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full justify-center">
          <Button
            variant="secondary"
            size="md"
            onClick={handleCopy}
            className="flex-1 max-w-[150px] sm:max-w-[160px] h-11 whitespace-nowrap text-xs sm:text-sm font-semibold px-3 sm:px-4"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1.5 sm:mr-2 text-brand-400 shrink-0" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1.5 sm:mr-2 text-gray-400 shrink-0" />
                <span>Copy Code</span>
              </>
            )}
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowQR(true)}
            className="flex-1 max-w-[150px] sm:max-w-[160px] h-11 whitespace-nowrap text-xs sm:text-sm font-semibold px-3 sm:px-4"
          >
            <QrIcon className="w-4 h-4 mr-1.5 sm:mr-2 text-accent-cyan shrink-0" />
            <span>Show QR</span>
          </Button>
        </div>
      </div>

      <QRCodeModal isOpen={showQR} onClose={() => setShowQR(false)} roomId={roomId} />
    </>
  );
};
