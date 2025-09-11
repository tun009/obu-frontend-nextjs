import { useRef, useCallback, useEffect } from 'react';
import { useWebRTCState, useWebRTCActions } from '@/contexts/webrtc-provider';
import type { UseWebRTCStreamReturn } from '@/lib/types/webrtc';

export function useWebRTCStream(deviceId: string): UseWebRTCStreamReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamData = useWebRTCState(deviceId);
  const { startStream, stopStream } = useWebRTCActions();

  const handleStartStream = useCallback(async () => {
    if (videoRef.current) {
      await startStream(deviceId, videoRef);
    }
  }, [startStream, deviceId]);

  const handleStopStream = useCallback(() => {
    stopStream(deviceId);
  }, [stopStream, deviceId]);

  const retry = useCallback(() => {
    handleStopStream();
    setTimeout(() => {
      handleStartStream();
    }, 500);
  }, [handleStartStream, handleStopStream]);

  useEffect(() => {
    handleStartStream();
    return () => {
      handleStopStream();
    };
  }, [handleStartStream, handleStopStream]);

  const streamState = streamData?.state ?? 'idle';
  const streamInfo = streamData?.info ?? null;
  const error = streamData?.error ?? null;

  const isStreaming = streamState === 'streaming' || streamState === 'connected';
  const isConnecting = streamState === 'connecting';

  const getStreamDuration = useCallback(() => 0, []);

  return {
    streamState,
    streamInfo,
    isStreaming,
    isConnecting,
    error,
    startStream: handleStartStream,
    stopStream: handleStopStream,
    retry,
    videoRef,
    getStreamDuration,
  };
}
