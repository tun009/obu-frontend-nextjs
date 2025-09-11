// WebRTC Configuration Constants
export const WEBRTC_CONFIG = {
  // MQTT Configuration
  // MQTT: {
  //   HOST: "ws://zxs-cs.netbodycamera.com:8083/mqtt",
  //   USERNAME: "dev1",
  //   PASSWORD: "dev1",
  //   SESSION_ID: "abcdefg23", // Fixed sessionId like in original example
  // },
  MQTT: {
    HOST: "ws://103.21.151.183:9001/mqtt",
    USERNAME: "admin",
    PASSWORD: "Elcom@123",
    SESSION_ID: "abcdefg23", // Fixed sessionId like in original example
  },

  // ICE Servers Configuration
  ICE_SERVERS: [
    { urls: "stun:34.124.183.8:3478" },
    {
      urls: 'turn:34.124.183.8:3478',
      username: 'dev1',
      credential: 'dev1',
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
