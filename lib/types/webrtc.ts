// WebRTC Message Types
export interface WebRTCMessage {
  sub: string;
  id: string;
  reply: string;
  params?: any;
  data?: any;
}

export interface PingMessage extends WebRTCMessage {
  sub: 'ping';
}

export interface PongMessage extends WebRTCMessage {
  sub: 'pong';
  data: {
    status: 'idle' | 'p2p';
    id?: string;
  };
}

export interface CallMessage extends WebRTCMessage {
  sub: 'call';
}

export interface SDPMessage extends WebRTCMessage {
  sub: 'sdp';
  params: RTCSessionDescriptionInit;
  data?: RTCSessionDescriptionInit;
}

export interface CandidateMessage extends WebRTCMessage {
  sub: 'candidate';
  params: RTCIceCandidateInit;
  data?: RTCIceCandidateInit;
}

export interface MediaMessage extends WebRTCMessage {
  sub: 'media';
  params: {
    audio: {
      speaker: number;
      mic: number;
    };
    video: {
      encode: string;
    };
  };
}

export interface ByeMessage extends WebRTCMessage {
  sub: 'bye';
}

// WebRTC Stream States (matching original example logic)
export type StreamState = 'idle' | 'connecting' | 'connected' | 'streaming' | 'error';

// WebRTC Connection Data
export interface WebRTCConnectionData {
  deviceId: string;
  sessionId: string;
  messageId: string;
  deviceTopic: string;
  replyTopic: string;
}

// WebRTC Stream Info
export interface StreamInfo {
  deviceId: string;
  state: StreamState;
  error?: string;
  connectionTime?: number;
  lastActivity?: number;
}

// Hook Return Type
export interface UseWebRTCStreamReturn {
  // State
  streamState: StreamState;
  streamInfo: StreamInfo | null;
  isStreaming: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Actions
  startStream: (deviceId: string) => Promise<void>;
  stopStream: () => void;
  
  // Video Element
  videoRef: React.RefObject<HTMLVideoElement>;
  
  // Utils
  getStreamDuration: () => number;
  retry: () => void;
}

// WebRTC Service Interface
export interface WebRTCService {
  connect: (deviceId: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: WebRTCMessage) => void;
  isConnected: () => boolean;
  getConnectionInfo: () => WebRTCConnectionData | null;
}
