import React, { useEffect, useState } from 'react';
import { Clock, Home } from 'lucide-react';
import { Button } from '../ui/button';

interface RoomExpiredModalProps {
  isOpen: boolean;
  onReturnHome: () => void;
  autoRedirectSeconds?: number;
}

export const RoomExpiredModal: React.FC<RoomExpiredModalProps> = ({
  isOpen,
  onReturnHome,
  autoRedirectSeconds = 5,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(autoRedirectSeconds);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(autoRedirectSeconds);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReturnHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, autoRedirectSeconds, onReturnHome]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bezel-outer rounded-3xl p-1.5 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bezel-inner rounded-[calc(1.5rem-0.25rem)] p-6 md:p-8 text-center space-y-5">
          {/* Pulsing clock icon */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-glow-sm">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white tracking-tight">
              Room Code Expired
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              This transfer room has expired for security. Please create a new transfer room to send your files.
            </p>
          </div>

          <div className="text-xs text-gray-500 font-mono">
            Returning to home in <span className="text-amber-400 font-semibold">{secondsLeft}s</span>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full font-semibold shadow-glow-sm text-sm"
            onClick={onReturnHome}
            id="return-home-expired-btn"
          >
            <Home className="w-4 h-4 mr-2" />
            <span>Return to Home</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
