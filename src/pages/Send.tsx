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
import { XCircle, ArrowLeft } from 'lucide-react';

interface SendProps {
  roomId: string | null;
  expiresAt: number | null;
  connectionState: ConnectionState;
  remoteDevice: DeviceInfo | null;
  files: FileItemState[];
  onCancel: () => void;
  isExpired?: boolean;
}

export const Send: React.FC<SendProps> = ({
  roomId,
  expiresAt,
  connectionState,
  remoteDevice,
  files,
  onCancel,
  isExpired = false,
}) => {
  const [internalExpired, setInternalExpired] = useState(false);

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
            <div className="text-center py-6">
              <span className="text-sm text-gray-400">Generating secure room code...</span>
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
