// WebRTC Configuration Constants
export const WEBRTC_CONFIG = {
  // MQTT Configuration
  MQTT: {
    HOST: "ws://zxs-cs.netbodycamera.com:8083/mqtt",
    USERNAME: "dev1",
    PASSWORD: "dev1",
    SESSION_ID: "abcdefg", // Fixed sessionId like in original example
  },

  // ICE Servers Configuration
  ICE_SERVERS: [
    { urls: "stun:120.26.124.232:3478" },
    {
      urls: 'turn:120.26.124.232:3478',
      username: 's3j5bt4m',
      credential: '0cqocukblg7zo76h',
      credentialType: 'password'
    }
  ],

  // Topic Templates
  TOPICS: {
    DEVICE: (deviceId: string) => `device/${deviceId}/webrtc/v1`,
    USER_REPLY: (username: string, sessionId: string) => `user/${username}/${sessionId}/webrtc/v1`,
  },

  // Message Types
  MESSAGE_TYPES: {
    PING: "ping",
    PONG: "pong",
    CALL: "call",
    SDP: "sdp",
    CANDIDATE: "candidate",
    MEDIA: "media",
    BYE: "bye",
  },

  // Device Status
  DEVICE_STATUS: {
    IDLE: "idle",
    P2P: "p2p",
  },


  // Timeouts (in milliseconds)
  TIMEOUTS: {
    CONNECTION: 10000, // 10 seconds
    PING: 5000, // 5 seconds
    ICE_GATHERING: 5000, // 5 seconds
  },
} as const;

// Generate unique session ID
export const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

// Generate unique message ID
export const generateMessageId = (username: string): string => {
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `user,${username},web,${randomStr}`;
};
