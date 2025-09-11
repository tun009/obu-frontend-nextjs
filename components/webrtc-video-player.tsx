import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, Loader2, AlertCircle, Video } from 'lucide-react';
import { useWebRTCStream } from '@/hooks/use-webrtc-stream';
import type { StreamState } from '@/lib/types/webrtc';

interface WebRTCVideoPlayerProps {
  deviceId: string;
  deviceName?: string;
  className?: string;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
}

export function WebRTCVideoPlayer({
  deviceId,
  deviceName,
  className = '',
  onStreamStart,
  onStreamStop
}: WebRTCVideoPlayerProps) {
  const {
    streamState,
    isStreaming,
    isConnecting,
    error,
    startStream,
    stopStream,
    retry,
    videoRef,
  } = useWebRTCStream(deviceId);

  const prevStreamingRef = React.useRef(false);

  React.useEffect(() => {
    if (isStreaming && onStreamStart && !prevStreamingRef.current) {
      onStreamStart();
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming, onStreamStart]);

  React.useEffect(() => {
    if (!isStreaming && prevStreamingRef.current && onStreamStop) {
      onStreamStop();
    }
  }, [isStreaming, onStreamStop]);  
  const handleStartStream = () => {
    startStream();
  };

  const handleStopStream = () => {
    stopStream();
    if (onStreamStop) {
      onStreamStop();
    }
  };

  const handleRetry = () => {
    retry();
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden group ${className}`}>
      {/* Video Element */}
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: isStreaming ? 'block' : 'none' }}
        />

        {/* Overlay Content */}
        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
            {streamState === 'idle' && (
              <>
                <Video className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-300 text-sm mb-4">
                  {deviceName ? `${deviceName} - Live Stream` : 'Live Stream'}
                </p>
                <Button onClick={handleStartStream} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Play className="h-4 w-4 mr-2" />
                  Bắt đầu phát
                </Button>
              </>
            )}

            {isConnecting && (
              <>
                <Loader2 className="h-12 w-12 text-blue-400 animate-spin mb-4" />
                <p className="text-gray-300 text-sm">Đang kết nối với thiết bị...</p>
                <p className="text-gray-400 text-xs mt-2">Device ID: {deviceId}</p>
              </>
            )}

            {streamState === 'error' && (
              <>
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-red-300 text-sm mb-2">Lỗi kết nối</p>
                {error && (
                  <p className="text-gray-400 text-xs mb-4 text-center px-4">{error}</p>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleRetry} size="sm" variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Thử lại
                  </Button>
                  <Button onClick={handleStopStream} size="sm" variant="destructive">
                    Đóng
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {isStreaming && (
        <div
          onClick={handleStopStream}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
        >
          <Image
            src="/images/stop.png"
            alt="Stop Video"
            width={48}
            height={48}
            className="transform transition-transform duration-300 ease-in-out group-hover:scale-110"
          />
        </div>
      )}
    </div>
  );
}
