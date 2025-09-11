import { toast } from 'sonner';
import { WEBRTC_CONFIG, generateMessageId } from '@/lib/constants/webrtc';
import type {
  WebRTCMessage,
  WebRTCConnectionData,
  PongMessage,
  SDPMessage,
  CandidateMessage
} from '@/lib/types/webrtc';
import { mqttManager } from './mqtt-manager';

export class WebRTCStreamService {
  private peerConnection: RTCPeerConnection | null = null;
  private connectionData: WebRTCConnectionData | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private unsubscribeMqtt: (() => void) | null = null;

  private onStreamHandler: ((stream: MediaStream) => void) | null = null;
  private onStateChangeHandler: ((state: string) => void) | null = null;

  constructor() {
    this.setupEventHandlers();
  }

  async connect(deviceId: string, sessionId: string): Promise<void> {
    try {
      this.onStateChangeHandler?.('connecting');
      this.retryCount = 0;

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

      // Subscribe to MQTT messages for this specific stream
      this.unsubscribeMqtt = mqttManager.onMessage(this.handleMQTTMessage.bind(this));
      mqttManager.subscribe(replyTopic);

      this.sendPing();

    } catch (error) {
      toast.error(`Connection failed: ${error}`);
      throw error;
    }
  }

  disconnect(): void {
    try {
      if (this.connectionData) {
        this.sendBye();
      }

      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      if (this.videoElement) {
        this.videoElement.srcObject = null;
      }

      this.unsubscribeMqtt?.();
      this.connectionData = null;
      this.onStateChangeHandler?.('stopped');

    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  setVideoElement(element: HTMLVideoElement | null): void {
    this.videoElement = element;
  }

  onStream(handler: (stream: MediaStream) => void): void {
    this.onStreamHandler = handler;
  }

  onStateChange(handler: (state: string) => void): void {
    this.onStateChangeHandler = handler;
  }

  private async handleMQTTMessage(topic: string, message: Buffer): Promise<void> {
    if (topic !== this.connectionData?.replyTopic) return;

    try {
      const payload: WebRTCMessage = JSON.parse(message.toString());

      switch (payload.sub) {
        case WEBRTC_CONFIG.MESSAGE_TYPES.PONG:
          await this.handlePong(payload as PongMessage);
          break;
        case WEBRTC_CONFIG.MESSAGE_TYPES.SDP:
          await this.handleSDP(payload as SDPMessage);
          break;
        case WEBRTC_CONFIG.MESSAGE_TYPES.CANDIDATE:
          await this.handleCandidate(payload as CandidateMessage);
          break;
      }
    } catch (error) {
      console.error('Error handling MQTT message:', error);
    }
  }

  private async handlePong(payload: PongMessage): Promise<void> {
    if (payload.data.status === WEBRTC_CONFIG.DEVICE_STATUS.IDLE) {
      this.retryCount = 0;
      this.sendCall();
    } else if (payload.data.status === WEBRTC_CONFIG.DEVICE_STATUS.P2P) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.sendBye();
        setTimeout(() => this.sendPing(), 2000);
      } else {
        toast.error('Device is busy');
      }
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

  private sendMessage(message: WebRTCMessage): void {
    if (!this.connectionData) return;
    const payload = JSON.stringify(message);
    mqttManager.publish(this.connectionData.deviceTopic, payload);
  }

  private sendPing(): void {
    const message: WebRTCMessage = {
      sub: WEBRTC_CONFIG.MESSAGE_TYPES.PING,
      id: this.connectionData!.messageId,
      reply: this.connectionData!.replyTopic,
    };
    this.sendMessage(message);
  }

  private sendCall(): void {
    const message: WebRTCMessage = {
      sub: WEBRTC_CONFIG.MESSAGE_TYPES.CALL,
      id: this.connectionData!.messageId,
      reply: this.connectionData!.replyTopic,
    };
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
      this.peerConnection = new RTCPeerConnection({
        iceServers: [...WEBRTC_CONFIG.ICE_SERVERS],
      });

      this.setupPeerConnectionHandlers();

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      const sdpMessage: WebRTCMessage = {
        sub: WEBRTC_CONFIG.MESSAGE_TYPES.SDP,
        id: this.connectionData!.messageId,
        reply: this.connectionData!.replyTopic,
        params: answer,
      };
      this.sendMessage(sdpMessage);
      this.onStateChangeHandler?.('connected');
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  private setupPeerConnectionHandlers(): void {
    if (!this.peerConnection) return;

    this.peerConnection.ontrack = (event) => {
      if (this.videoElement && event.streams[0]) {
        this.videoElement.srcObject = event.streams[0];
        this.onStreamHandler?.(event.streams[0]);
        this.onStateChangeHandler?.('streaming');
        this.videoElement.play().catch(e => console.log('Autoplay blocked:', e));
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
  }

  private setupEventHandlers(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });
    }
  }
}
