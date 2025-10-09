// API Response Types - Direct response from FastAPI (no wrapper)
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// Authentication Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string; // UUID
  username: string;
  email: string;
  full_name?: string;
  role?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Vehicle Types - REMOVED as part of backend refactor

// Driver Types
export interface Driver {
  id: string; // UUID
  full_name: string;
  phone_number?: string;
  created_at: string;
}

export interface CreateDriverRequest {
  full_name: string;
  phone_number?: string;
}

export interface UpdateDriverRequest extends Partial<CreateDriverRequest> {}

// Device Types
export interface Device {
  id: string; // UUID
  imei: string;
  serial_number?: string;
  firmware_version?: string;
  installed_at: string;
  vehicle_id: string | null;
  plate_number: string | null;
}

export interface CreateDeviceRequest {
  imei: string;
  serial_number?: string;
  firmware_version?: string;
}

export interface UpdateDeviceRequest extends Partial<CreateDeviceRequest> {}

// Pagination Types
export interface PaginationParams {
  page?: number;
  items_per_page?: number; // Changed from 'limit' to match backend
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// FastCRUD PaginatedListResponse structure
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  items_per_page: number;
  pages: number;
  total_count: number,
  has_more: boolean
}

// Device Realtime Types
export interface GPSInfo {
  enable: number;
  power_save: number;
  hardware_status: number;
  valid: number;
  longitude: number;
  latitude: number;
  speed: number;
  direction: number;
  height_ground: number;
  height_sea: number;
  time_year: number;
  time_month: number;
  time_day: number;
  time_hour: number;
  time_minute: number;
  time_second: number;
  mode: number;
  satellite_used: number[];
  satellite_visible: number[];
  satellite_number: number[];
  satellite_signal: number[];
  server_enable: number;
  report_time: number;
  server_port: number;
  server_ip: string;
  device_no: string;
  pass: string;
  ns: string;
  ew: string;
  longitude_str: string;
  latitude_str: string;
}

// Vehicle
export interface Vehicle {
  id: string
  plate_number: string
  load_capacity_kg: number | null
  type: string | null
  created_at: string
}

export interface CreateVehicleRequest {
  plate_number: string
  load_capacity_kg?: number | null
  type?: string | null
}

export interface UpdateVehicleRequest {
  plate_number?: string
  load_capacity_kg?: number | null
  type?: string | null
}

export interface BatteryInfo {
  full_value: number;
  alarm_value: number;
  power_off_value: number;
  bat_value: number;
  bat_percent: number;
  bat_status: number;
  bat_health: number;
  bat_current: number;
  bat_mah: number;
}

export interface SystemInfo {
  cpu_speed: number;
  cpu_usage: number;
  memory_capacity: number;
  memory_usage: number;
  device_uptime: number;
  system_uptime: number;
  sleep_status: number;
  temperature: number;
  id_type: number;
  time: string;
  route_type: number;
  route_name: string;
  net_connect_status: number;
  gateway: string;
  dns0: string;
  dns1: string;
  language: number;
  time_sync: number;
  timezone: string;
}

export interface DeviceInfo {
  sn: string;
  device_name: string;
  app_name: string;
  manufacture: string;
  hardware: string;
  hardware_version: string;
  product_id: string;
  id_type: number;
  vendor_id: string;
  device_id: string;
  extend_id: string;
  software_version: string;
  mcu_version: string;
  cpu_type: number;
  pcb_version: string;
  mqtt_version: string;
  with_mobile: number;
  with_wifi: number;
}

export interface UserInfo {
  serialNo: string;
  userId: string;
  userName: string;
  unitNo: string;
  unitName: string;
  collected: number;
}

export interface DeviceRealtimeData {
  DEVICE_INFO: DeviceInfo;
  SYSTEM_INFO: SystemInfo;
  USER_INFO: UserInfo;
  BATTERY_INFO: BatteryInfo;
  GPS_INFO: GPSInfo;
}

export interface DeviceRealtimeResponse {
  typeCode: string;
  typeNo: string;
  version: string;
  dataEncryptionMode: string;
  timestamp: number;
  data: DeviceRealtimeData;
}

// Map Vehicle Types - REMOVED

// Journey Session Types
export interface JourneySession {
  id: number;
  device_id: string;
  driver_id: string;
  start_time: string;
  end_time: string;
  total_distance_km?: number;
  notes?: string;
  status: 'pending' | 'active' | 'completed';
  activated_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface JourneySessionWithDetails extends JourneySession {
  device_name: string; // Formerly vehicle_plate_number
  driver_name: string;
  device_imei?: string;
  driver_phone_number?: string
  plate_number?: string
}

export interface CreateJourneySessionRequest {
  device_id: string;
  driver_id: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface UpdateJourneySessionRequest extends Partial<CreateJourneySessionRequest> {}

// Journey Session History Types
export interface JourneySessionHistoryPoint {
  id: number;
  collected_at: string;
  latitude: number;
  latitude_degree: number;
  longitude: number;
  longitude_degree: number;
  gps_speed: number;
  gps_valid: number;
  gps_enable: number;
  bat_percent: number;
  direction: number
}

export interface JourneySessionHistoryResponse {
  data: JourneySessionHistoryPoint[];
  plate_number: string;
  driver_name: string;
  imei: string;
  id: number;
  start_time: string;
  end_time: string;
}

// Error Types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}
