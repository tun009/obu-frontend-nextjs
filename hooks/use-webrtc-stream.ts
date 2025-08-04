import { useRef, useState, useCallback, useEffect } from 'react';
import { WebRTCStreamService } from '@/lib/services/webrtc-service';
import type { UseWebRTCStreamReturn, StreamState, StreamInfo } from '@/lib/types/webrtc';

export function useWebRTCStream(): UseWebRTCStreamReturn {
  const serviceRef = useRef<WebRTCStreamService | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const connectionStartTime = useRef<number>(0);

  // Initialize service
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new WebRTCStreamService();
      
      // Setup event handlers
      serviceRef.current.onStateChange((state) => {
        setStreamState(state as StreamState);
        
        if (state === 'connecting') {
          connectionStartTime.current = Date.now();
        }
        
        if (streamInfo) {
          setStreamInfo(prev => prev ? {
            ...prev,
            state: state as StreamState,
            lastActivity: Date.now(),
            connectionTime: state === 'streaming' ? Date.now() - connectionStartTime.current : prev.connectionTime
          } : null);
        }
      });

      serviceRef.current.onError((errorMessage) => {
        setError(errorMessage);
        setStreamState('error');
        
        if (streamInfo) {
          setStreamInfo(prev => prev ? {
            ...prev,
            state: 'error',
            error: errorMessage,
            lastActivity: Date.now()
          } : null);
        }
      });

      serviceRef.current.onStream((stream) => {
        console.log('Stream received in hook:', stream);
        // Video element is handled by the service
      });
    }

    return () => {
      // Cleanup on unmount
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
  }, [streamInfo]);

  // Update video element reference
  useEffect(() => {
    if (serviceRef.current && videoRef.current) {
      serviceRef.current.setVideoElement(videoRef.current);
    }
  }, []);

  const startStream = useCallback(async (deviceId: string): Promise<void> => {
    if (!serviceRef.current) {
      throw new Error('WebRTC service not initialized');
    }
    try {
      setError(null);
      setStreamState('connecting');
      
      // Create stream info
      const newStreamInfo: StreamInfo = {
        deviceId,
        state: 'connecting',
        lastActivity: Date.now()
      };
      setStreamInfo(newStreamInfo);

      await serviceRef.current.connect(deviceId);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setStreamState('error');
      
      if (streamInfo) {
        setStreamInfo(prev => prev ? {
          ...prev,
          state: 'error',
          error: errorMessage,
          lastActivity: Date.now()
        } : null);
      }
      
      throw error;
    }
  }, [streamInfo]);

  const stopStream = useCallback((): void => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
    }

    // Reset to idle state (not disconnected)
    setStreamState('idle');
    setStreamInfo(null);
    setError(null);
    connectionStartTime.current = 0;
  }, []);

  const retry = useCallback((): void => {
    if (streamInfo?.deviceId) {
      stopStream();
      setTimeout(() => {
        startStream(streamInfo.deviceId);
      }, 1000);
    }
  }, [streamInfo?.deviceId, startStream, stopStream]);

  const getStreamDuration = useCallback((): number => {
    if (!streamInfo?.connectionTime) return 0;
    return Date.now() - (connectionStartTime.current || 0);
  }, [streamInfo?.connectionTime]);

  // Computed states
  const isStreaming = streamState === 'streaming' || streamState === 'connected';
  const isConnecting = streamState === 'connecting';

  return {
    // State
    streamState,
    streamInfo,
    isStreaming,
    isConnecting,
    error,
    
    // Actions
    startStream,
    stopStream,
    retry,
    
    // Video Element
    videoRef,
    
    // Utils
    getStreamDuration,
  };
}
