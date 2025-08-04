import mqtt, { MqttClient } from 'mqtt';
import { WEBRTC_CONFIG, generateSessionId, generateMessageId } from '@/lib/constants/webrtc';
import type { 
  WebRTCMessage, 
  WebRTCConnectionData, 
  WebRTCService,
  PongMessage,
  SDPMessage,
  CandidateMessage
} from '@/lib/types/webrtc';

export class WebRTCStreamService implements WebRTCService {
  private mqttClient: MqttClient | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private connectionData: WebRTCConnectionData | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  // Event handlers
  private onStreamHandler: ((stream: MediaStream) => void) | null = null;
  private onStateChangeHandler: ((state: string) => void) | null = null;
  private onErrorHandler: ((error: string) => void) | null = null;

  constructor() {
    this.setupEventHandlers();
  }

  // Public Methods
  async connect(deviceId: string): Promise<void> {
    if (this.mqttClient) {
      await this.disconnect();
    }

    try {
      this.onStateChangeHandler?.('connecting');
      this.retryCount = 0; // Reset retry count

      // Setup connection data (use fixed sessionId like in original example)
      const sessionId = WEBRTC_CONFIG.MQTT.SESSION_ID;
      const messageId = generateMessageId(WEBRTC_CONFIG.MQTT.USERNAME);
      const deviceTopic = WEBRTC_CONFIG.TOPICS.DEVICE(deviceId);
      const replyTopic = WEBRTC_CONFIG.TOPICS.USER_REPLY(WEBRTC_CONFIG.MQTT.USERNAME, sessionId);

      this.connectionData = {
        deviceId,
        sessionId,
        messageId,
        deviceTopic,
        replyTopic
      };

      // Connect MQTT (ping will be sent automatically in connect handler)
      await this.connectMQTT();
      
    } catch (error) {
      this.onErrorHandler?.(`Connection failed: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Send bye message if connected
      if (this.mqttClient && this.connectionData) {
        this.sendBye();
      }

      // Close peer connection
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      // Disconnect MQTT
      if (this.mqttClient) {
        this.mqttClient.end();
        this.mqttClient = null;
      }

      // Clear video
      if (this.videoElement) {
        this.videoElement.srcObject = null;
      }

      this.connectionData = null;
      // Don't set to 'disconnected' - let the hook handle state reset
      
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  sendMessage(message: WebRTCMessage): void {
    if (!this.mqttClient) {
      console.error('❌ Cannot send message: MQTT client not available');
      throw new Error('MQTT client not available');
    }

    if (!this.connectionData) {
      console.error('❌ Cannot send message: No connection data');
      throw new Error('No connection data');
    }

    if (!this.mqttClient.connected) {
      console.error('❌ Cannot send message: MQTT not connected');
      throw new Error('MQTT not connected');
    }

    const payload = JSON.stringify(message);
    console.log('📤 Publishing message to:', this.connectionData.deviceTopic);
    console.log('📄 Message payload:', payload);

    this.mqttClient.publish(this.connectionData.deviceTopic, payload, (error) => {
      if (error) {
        console.error('❌ Failed to publish message:', error);
      } else {
        console.log('✅ Message published successfully');
      }
    });
  }

  isConnected(): boolean {
    return this.mqttClient?.connected === true;
  }

  getConnectionInfo(): WebRTCConnectionData | null {
    return this.connectionData;
  }

  setVideoElement(element: HTMLVideoElement | null): void {
    console.log('📺 Setting video element:', !!element);
    this.videoElement = element;

    if (element) {
      console.log('✅ Video element set successfully');
      console.log('   - Width:', element.clientWidth);
      console.log('   - Height:', element.clientHeight);
    }
  }

  // Event Handlers Setup
  onStream(handler: (stream: MediaStream) => void): void {
    this.onStreamHandler = handler;
  }

  onStateChange(handler: (state: string) => void): void {
    this.onStateChangeHandler = handler;
  }

  onError(handler: (error: string) => void): void {
    this.onErrorHandler = handler;
  }

  // Private Methods
  private async connectMQTT(): Promise<void> {
    return new Promise((resolve, reject) => {
      let isResolved = false;

      const options = {
        username: WEBRTC_CONFIG.MQTT.USERNAME,
        password: WEBRTC_CONFIG.MQTT.PASSWORD,
        keepalive: 60,
        connectTimeout: 30 * 1000, // 30 seconds
        reconnectPeriod: 1000, // 1 second
      };

      console.log('🔌 Connecting to MQTT:', WEBRTC_CONFIG.MQTT.HOST);
      this.mqttClient = mqtt.connect(WEBRTC_CONFIG.MQTT.HOST, options);

      this.mqttClient.on('connect', () => {
        if (isResolved) return;
        isResolved = true;

        console.log('✅ MQTT connected successfully');
        if (this.connectionData) {
          console.log('📡 Subscribing to topic:', this.connectionData.replyTopic);
          this.mqttClient!.subscribe(this.connectionData.replyTopic);
          console.log('🏓 Sending initial ping...');
          this.sendPing();
          resolve();
        }
      });

      this.mqttClient.on('error', (error) => {
        if (isResolved) return;
        isResolved = true;

        console.error('❌ MQTT connection error:', error);
        reject(error);
      });

      this.mqttClient.on('offline', () => {
        console.log('📴 MQTT client went offline');
      });

      this.mqttClient.on('reconnect', () => {
        console.log('🔄 MQTT client reconnecting...');
      });

      this.mqttClient.on('message', this.handleMQTTMessage.bind(this));

      // Timeout with proper cleanup
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          console.error('⏰ MQTT connection timeout after', WEBRTC_CONFIG.TIMEOUTS.CONNECTION, 'ms');

          if (this.mqttClient) {
            this.mqttClient.end(true);
            this.mqttClient = null;
          }

          reject(new Error('MQTT connection timeout'));
        }
      }, WEBRTC_CONFIG.TIMEOUTS.CONNECTION);

      // Clear timeout if resolved
      this.mqttClient.on('connect', () => {
        clearTimeout(timeoutId);
      });
    });
  }

  private async handleMQTTMessage(topic: string, message: Buffer): Promise<void> {
    try {
      const payload: WebRTCMessage = JSON.parse(message.toString());
      console.log('📥 Received MQTT message from topic:', topic);
      console.log('📄 Message payload:', payload);

      switch (payload.sub) {
        case WEBRTC_CONFIG.MESSAGE_TYPES.PONG:
          console.log('🏓 Handling PONG message');
          await this.handlePong(payload as PongMessage);
          break;
        case WEBRTC_CONFIG.MESSAGE_TYPES.SDP:
          console.log('📺 Handling SDP message');
          await this.handleSDP(payload as SDPMessage);
          break;
        case WEBRTC_CONFIG.MESSAGE_TYPES.CANDIDATE:
          console.log('🧊 Handling ICE candidate message');
          await this.handleCandidate(payload as CandidateMessage);
          break;
        default:
          console.log('❓ Unhandled message type:', payload.sub);
      }
    } catch (error) {
      console.error('❌ Error handling MQTT message:', error);
      this.onErrorHandler?.(`Message handling error: ${error}`);
    }
  }

  private async handlePong(payload: PongMessage): Promise<void> {
    console.log('🏓 Received PONG with status:', payload.data.status);

    if (payload.data.status === WEBRTC_CONFIG.DEVICE_STATUS.IDLE) {
      console.log('✅ Device is IDLE, sending CALL...');
      this.retryCount = 0; // Reset retry count on success
      this.sendCall();
    } else if (payload.data.status === WEBRTC_CONFIG.DEVICE_STATUS.P2P) {
      console.log(`⚠️ Device is busy (retry ${this.retryCount + 1}/${this.maxRetries})`);

      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log('🔄 Sending BYE to cleanup and retry...');
        this.sendBye();

        // Retry ping after cleanup
        setTimeout(() => {
          this.sendPing();
        }, 2000);
      } else {
        console.log('❌ Max retries reached, device is permanently busy');
        this.onErrorHandler?.('Device is busy and cannot be freed after multiple attempts');
      }
    } else {
      console.log('❓ Unknown device status:', payload.data.status);
      this.onErrorHandler?.(`Unknown device status: ${payload.data.status}`);
    }
  }

  private async handleSDP(payload: SDPMessage): Promise<void> {
    const offer = payload.data || payload.params;
    if (offer?.type === 'offer') {
      await this.handleOffer(offer);
    }
  }

  private async handleCandidate(payload: CandidateMessage): Promise<void> {
    const candidate = payload.data || payload.params;
    if (this.peerConnection && candidate) {
      try {
        await this.peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Failed to add ICE candidate:', error);
      }
    }
  }

  private sendPing(): void {
    if (!this.connectionData) {
      console.error('❌ Cannot send ping: no connection data');
      return;
    }

    if (!this.mqttClient?.connected) {
      console.error('❌ Cannot send ping: MQTT not connected');
      return;
    }

    const message: WebRTCMessage = {
      sub: WEBRTC_CONFIG.MESSAGE_TYPES.PING,
      id: this.connectionData.messageId,
      reply: this.connectionData.replyTopic,
    };

    console.log('🏓 Sending ping message:', message);
    console.log('📤 To device topic:', this.connectionData.deviceTopic);
    this.sendMessage(message);
  }

  private sendCall(): void {
    if (!this.connectionData) {
      console.error('❌ Cannot send call: no connection data');
      return;
    }

    const message: WebRTCMessage = {
      sub: WEBRTC_CONFIG.MESSAGE_TYPES.CALL,
      id: this.connectionData.messageId,
      reply: this.connectionData.replyTopic,
    };

    console.log('📞 Sending CALL message:', message);
    this.sendMessage(message);
  }

  private sendBye(): void {
    if (!this.connectionData) return;

    const message: WebRTCMessage = {
      sub: WEBRTC_CONFIG.MESSAGE_TYPES.BYE,
      id: this.connectionData.messageId,
      reply: this.connectionData.replyTopic,
    };

    this.sendMessage(message);
  }

  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: WEBRTC_CONFIG.ICE_SERVERS,
      });

      this.setupPeerConnectionHandlers();

      // Set remote description
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      // Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Send answer
      if (this.connectionData) {
        const sdpMessage: WebRTCMessage = {
          sub: WEBRTC_CONFIG.MESSAGE_TYPES.SDP,
          id: this.connectionData.messageId,
          reply: this.connectionData.replyTopic,
          params: answer,
        };

        this.sendMessage(sdpMessage);
      }

      this.onStateChangeHandler?.('connected');
      
    } catch (error) {
      console.error('Error handling offer:', error);
      this.onErrorHandler?.(`WebRTC setup failed: ${error}`);
    }
  }

  private setupPeerConnectionHandlers(): void {
    if (!this.peerConnection) return;

    this.peerConnection.ontrack = (event) => {
      console.log('🎥 Received remote stream');
      console.log('📺 Video element available:', !!this.videoElement);
      console.log('🎬 Stream tracks:', event.streams[0]?.getTracks().length);

      if (this.videoElement && event.streams[0]) {
        console.log('✅ Setting video srcObject...');
        this.videoElement.srcObject = event.streams[0];
        this.onStreamHandler?.(event.streams[0]);
        this.onStateChangeHandler?.('streaming');

        // Force video to play
        this.videoElement.play().catch(e => {
          console.log('⚠️ Video autoplay blocked:', e);
        });
      } else {
        console.error('❌ Cannot display stream:');
        console.error('   - Video element:', !!this.videoElement);
        console.error('   - Stream available:', !!event.streams[0]);
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.connectionData) {
        const candidateMessage: WebRTCMessage = {
          sub: WEBRTC_CONFIG.MESSAGE_TYPES.CANDIDATE,
          id: this.connectionData.messageId,
          reply: this.connectionData.replyTopic,
          params: event.candidate,
        };

        this.sendMessage(candidateMessage);
      }
    };

    // this.peerConnection.onconnectionstatechange = () => {
    //   const state = this.peerConnection?.connectionState;
    //   console.log('Peer connection state:', state);
      
    //   if (state === 'failed' || state === 'disconnected') {
    //     this.onErrorHandler?.('Peer connection failed');
    //   }
    // };
  }

  private setupEventHandlers(): void {
    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });
    }
  }
}
