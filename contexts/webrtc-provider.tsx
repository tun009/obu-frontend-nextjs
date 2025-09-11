import React, { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect, useMemo } from 'react';
import { WebRTCStreamService } from '@/lib/services/webrtc-service';
import { mqttManager } from '@/lib/services/mqtt-manager';
import type { StreamState, StreamInfo } from '@/lib/types/webrtc';
import { generateSessionId } from '@/lib/constants/webrtc';

interface ManagedStream {
  state: StreamState;
  info: StreamInfo | null;
  error: string | null;
}

interface WebRTCManagerActions {
  startStream: (deviceId: string, videoRef: React.RefObject<HTMLVideoElement>) => Promise<void>;
  stopStream: (deviceId: string) => void;
}

// Separate contexts for state and actions to prevent unnecessary re-renders
const WebRTCStateContext = createContext<Map<string, ManagedStream> | null>(null);
const WebRTCActionsContext = createContext<WebRTCManagerActions | null>(null);

export const useWebRTCState = (deviceId: string) => {
  const stateMap = useContext(WebRTCStateContext);
  if (!stateMap) {
    throw new Error('useWebRTCState must be used within a WebRTCProvider');
  }
  return stateMap.get(deviceId);
};

export const useWebRTCActions = () => {
  const actions = useContext(WebRTCActionsContext);
  if (!actions) {
    throw new Error('useWebRTCActions must be used within a WebRTCProvider');
  }
  return actions;
};

export const WebRTCProvider = ({ children }: { children: ReactNode }) => {
  const [streamStates, setStreamStates] = useState(() => new Map<string, ManagedStream>());
  const streamServices = useRef(new Map<string, WebRTCStreamService>());

  useEffect(() => {
    mqttManager.connect().catch(err => {
      console.error("Initial MQTT connection failed", err);
    });
    return () => {
      // Disconnect all active streams on unmount
      streamServices.current.forEach(service => service.disconnect());
      mqttManager.disconnect();
    };
  }, []);

  const startStream = useCallback(async (deviceId: string, videoRef: React.RefObject<HTMLVideoElement>) => {
    if (streamServices.current.has(deviceId)) return;

    const service = new WebRTCStreamService();
    streamServices.current.set(deviceId, service);
    service.setVideoElement(videoRef.current);

    const updateState = (updates: Partial<ManagedStream>) => {
      setStreamStates(prev => {
        const newStates = new Map(prev);
        const existing = newStates.get(deviceId) || {};
        newStates.set(deviceId, { ...existing, ...updates } as ManagedStream);
        return newStates;
      });
    };

    service.onStateChange((state) => {
      updateState({ state: state as StreamState });
      if (state === 'stopped' || state === 'error') {
        streamServices.current.delete(deviceId);
        // The state will remain in the map to show the final error/stopped state
      }
    });

    try {
      updateState({ state: 'connecting' });
      await mqttManager.connect();
      const sessionId = generateSessionId();
      await service.connect(deviceId, sessionId);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      updateState({ state: 'error', error });
      streamServices.current.delete(deviceId);
    }
  }, []);

  const stopStream = useCallback((deviceId: string) => {
    const service = streamServices.current.get(deviceId);
    service?.disconnect();
  }, []);

  const actions = useMemo(() => ({ startStream, stopStream }), [startStream, stopStream]);

  return (
    <WebRTCStateContext.Provider value={streamStates}>
      <WebRTCActionsContext.Provider value={actions}>
        {children}
      </WebRTCActionsContext.Provider>
    </WebRTCStateContext.Provider>
  );
};
