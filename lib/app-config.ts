
const DEV_MQTT_HOST = 'ws://zxs-cs.netbodycamera.com:8083/mqtt';

// Các tiền tố PROXY cho môi trường PRODUCTION (trên server)
// Các tiền tố này phải khớp với cấu hình trong file nginx/default.conf
const PROD_MEDIA_PROXY_PREFIX = '/proxy-media';
const PROD_MQTT_PROXY_PREFIX = '/proxy-mqtt';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Lấy URL HOST cho MQTT Broker một cách tự động.
 * - Production: Trả về URL WebSocket an toàn (wss) trỏ tới Nginx proxy.
 * - Development: Trả về URL WebSocket (ws) trực tiếp.
 */
export const getMqttHost = (): string => {
  if (isProduction) {
    // Chỉ chạy ở phía trình duyệt để có thể truy cập window.location
    if (typeof window !== 'undefined') {
      const origin = window.location.origin; // e.g., https://202.92.6.85:8444
      // Chuyển http/https thành ws/wss
      const wsProtocol = origin.startsWith('https') ? 'wss://' : 'ws://';
      const host = origin.split('//')[1];
      return `${wsProtocol}${host}${PROD_MQTT_PROXY_PREFIX}`;
    }
    // Trả về chuỗi rỗng nếu chạy ở server-side trong lúc build
    return '';
  }
  // Môi trường dev, trả về URL trực tiếp
  return DEV_MQTT_HOST;
};

/**
 * Chuyển đổi URL media (ảnh, video) một cách tự động.
 * - Production: Chuyển URL gốc thành URL tương đối qua Nginx proxy.
 * - Development: Giữ nguyên URL gốc.
 * @param originalUrl URL đầy đủ từ backend (e.g., http://103.56.160.96/media/file.mp4)
 */
export const getMediaUrl = (originalUrl: string | null | undefined): string => {
  if (!originalUrl) {
    return '';
  }

  if (isProduction) {
    try {
      const url = new URL(originalUrl);
      // Trả về đường dẫn tương đối, ví dụ: /proxy-media/media/file.mp4
      return `${PROD_MEDIA_PROXY_PREFIX}${url.pathname}`;
    } catch (error) {
      // Nếu URL không hợp lệ, trả về gốc để tránh crash
      return originalUrl;
    }
  }

  // Môi trường dev, trả về URL trực tiếp
  return originalUrl;
};

