import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { RoomCode } from '../components/room/RoomCode';
import { RoomExpiredModal } from '../components/room/RoomExpiredModal';
import { ConnectionStatus } from '../components/room/ConnectionStatus';
import { FileList } from '../components/file/FileList';
import type { ConnectionState } from '../hooks/useDropCode';
import type { FileItemState } from '../types/transfer';
import type { DeviceInfo } from '../types/signaling';
import type { ServerWarmupStatus } from '../services/signaling';
import { XCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface SendProps {
  roomId: string | null;
  expiresAt: number | null;
  connectionState: ConnectionState;
  remoteDevice: DeviceInfo | null;
  files: FileItemState[];
  onCancel: () => void;
  isExpired?: boolean;
  serverStatus?: ServerWarmupStatus;
}

export const Send: React.FC<SendProps> = ({
  roomId,
  expiresAt,
  connectionState,
  remoteDevice,
  files,
  onCancel,
  isExpired = false,
  serverStatus,
}) => {
  const [internalExpired, setInternalExpired] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(0);

  useEffect(() => {
    if (roomId) return;
    const interval = setInterval(() => {
      setWaitingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    if (!expiresAt) return;
    if (Date.now() >= expiresAt) {
      setInternalExpired(true);
    }
  }, [expiresAt]);

  const handleExpire = () => {
    setInternalExpired(true);
  };

  const showModal = isExpired || internalExpired;

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 py-6 px-4">
      {/* Back button */}
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Cancel Transfer Room
      </button>

      <Card>
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-white">Your Transfer Room</h2>
            <p className="text-xs text-gray-400">
              Share this code or QR with the receiving device
            </p>
          </div>

          {roomId ? (
            <RoomCode roomId={roomId} expiresAt={expiresAt} onExpire={handleExpire} />
          ) : (
            <div className="text-center py-8 px-4 rounded-2xl bg-surface-subtle/50 border border-white/5 space-y-3">
              <div className="relative mx-auto w-10 h-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-white block">
                  {serverStatus === 'waking' || waitingSeconds >= 3
                    ? 'กำลังปลุกเซิร์ฟเวอร์ (Render Cold Start)...'
                    : 'Generating secure room code...'}
                </span>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  {serverStatus === 'waking' || waitingSeconds >= 3
                    ? `Render backend กำลังบูตระบบจากโหมดประหยัดพลังงาน (~30-50 วินาทีในครั้งแรก) ผ่านไปแล้ว: ${waitingSeconds}s`
                    : 'Connecting to signaling server and reserving peer session...'}
                </p>
              </div>
              {(serverStatus === 'waking' || waitingSeconds >= 3) && (
                <div className="w-48 h-1.5 bg-surface-base rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-500 to-accent-cyan rounded-full animate-pulse w-full" />
                </div>
              )}
            </div>
          )}

          <ConnectionStatus
            state={connectionState}
            remoteDevice={remoteDevice}
            role="sender"
          />

          <div className="pt-2">
            <FileList
              files={files}
              title="Files Ready to Transfer"
              listClassName="max-h-[200px] overflow-y-auto"
            />
          </div>

          <div className="pt-2 flex justify-center">
            <Button
              variant="outline"
              size="md"
              onClick={onCancel}
              className="w-full text-rose-400 hover:text-rose-300 hover:border-rose-500/30"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Room
            </Button>
          </div>
        </div>
      </Card>

      <RoomExpiredModal
        isOpen={showModal}
        onReturnHome={onCancel}
        autoRedirectSeconds={5}
      />
    </div>
  );
};
