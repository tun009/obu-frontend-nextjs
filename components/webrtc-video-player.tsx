import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, RotateCcw, Loader2, AlertCircle, Video } from 'lucide-react';
import { useWebRTCStream } from '@/hooks/use-webrtc-stream';
import type { StreamState } from '@/lib/types/webrtc';

interface WebRTCVideoPlayerProps {
  deviceId: string;
  deviceName?: string;
  className?: string;
  autoStart?: boolean;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
}

const getStateColor = (state: StreamState): string => {
  switch (state) {
    case 'streaming': return 'bg-green-500';
    case 'connecting': return 'bg-yellow-500';
    case 'error': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getStateText = (state: StreamState): string => {
  switch (state) {
    case 'idle': return 'Sẵn sàng';
    case 'connecting': return 'Đang kết nối...';
    case 'connected': return 'Đã kết nối';
    case 'streaming': return 'Đang phát';
    case 'error': return 'Lỗi';
    default: return 'Không xác định';
  }
};

export function WebRTCVideoPlayer({
  deviceId,
  deviceName,
  className = '',
  autoStart = false,
  onStreamStart,
  onStreamStop
}: WebRTCVideoPlayerProps) {
  const {
    streamState,
    streamInfo,
    isStreaming,
    isConnecting,
    error,
    startStream,
    stopStream,
    retry,
    videoRef,
    getStreamDuration
  } = useWebRTCStream();
  // Auto start if requested
  React.useEffect(() => {
    if (autoStart && streamState === 'idle') {
      handleStartStream();
    }
  }, [autoStart, streamState]);

  // Track previous streaming state to detect when stream stops
  const prevStreamingRef = React.useRef(false);

  // Handle callbacks
  React.useEffect(() => {
    if (isStreaming && onStreamStart && !prevStreamingRef.current) {
      onStreamStart();
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming, onStreamStart]);

  React.useEffect(() => {
    // Only call onStreamStop if we were previously streaming and now we're not
    if (!isStreaming && prevStreamingRef.current && onStreamStop) {
      onStreamStop();
    }
  }, [isStreaming, onStreamStop]);

  // Error handling is now done via toast notifications in the service

  const handleStartStream = async () => {
    try {
      await startStream(deviceId);
    } catch (error) {
      console.error('Failed to start stream:', error);
    }
  };

  const handleStopStream = () => {
    stopStream();
  };

  const handleRetry = () => {
    retry();
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
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

      {/* Status Bar */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
        {/* Status Badge */}
        <Badge className={`${getStateColor(streamState)} text-white text-xs`}>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            {getStateText(streamState)}
          </div>
        </Badge>

        {/* Duration */}
        {isStreaming && (
          <Badge variant="secondary" className="text-xs">
            {formatDuration(getStreamDuration())}
          </Badge>
        )}
      </div>

      {/* Controls */}
      {isStreaming && (
        <div className="absolute bottom-2 right-2">
          <Button 
            onClick={handleStopStream} 
            size="sm" 
            variant="destructive"
            className="opacity-80 hover:opacity-100"
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Device Info */}
      <div className="absolute bottom-2 left-2">
        {streamInfo && (
          <div className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
            {deviceName || `Device ${deviceId.slice(-8)}`}
          </div>
        )}
      </div>
    </div>
  );
}
