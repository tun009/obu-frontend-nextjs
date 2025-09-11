import mqtt, { MqttClient } from 'mqtt';
import { WEBRTC_CONFIG } from '@/lib/constants/webrtc';

type MessageHandler = (topic: string, message: Buffer) => void;

class MqttManager {
  private static instance: MqttManager;
  private client: MqttClient | null = null;
  private connectionPromise: Promise<void> | null = null;
  private subscribers: Set<MessageHandler> = new Set();

  private constructor() {}

  public static getInstance(): MqttManager {
    if (!MqttManager.instance) {
      MqttManager.instance = new MqttManager();
    }
    return MqttManager.instance;
  }

  connect(): Promise<void> {
    if (this.client && this.client.connected) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const options = {
        username: WEBRTC_CONFIG.MQTT.USERNAME,
        password: WEBRTC_CONFIG.MQTT.PASSWORD,
        keepalive: 60,
        connectTimeout: 10 * 1000, // 10 seconds
        reconnectPeriod: 1000,
      };

      console.log('🔌 Connecting to MQTT Broker...');
      this.client = mqtt.connect(WEBRTC_CONFIG.MQTT.HOST, options);

      this.client.on('connect', () => {
        console.log('✅ MQTT Manager connected successfully.');
        this.connectionPromise = null;
        resolve();
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT Manager connection error:', error);
        this.connectionPromise = null;
        this.client?.end(true);
        reject(error);
      });

      this.client.on('message', (topic, message) => {
        this.subscribers.forEach(handler => handler(topic, message));
      });
    });

    return this.connectionPromise;
  }

  disconnect(): void {
    if (this.client) {
      console.log('🔌 Disconnecting MQTT Manager...');
      this.client.end();
      this.client = null;
    }
  }

  subscribe(topic: string): void {
    this.client?.subscribe(topic, (err) => {
      if (err) {
        console.error(`Failed to subscribe to ${topic}`, err);
      }
    });
  }

  publish(topic: string, message: string): void {
    this.client?.publish(topic, message);
  }

  onMessage(handler: MessageHandler): () => void {
    this.subscribers.add(handler);
    return () => {
      this.subscribers.delete(handler);
    };
  }
}

export const mqttManager = MqttManager.getInstance();

