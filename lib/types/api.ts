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
  user: User;
}

export interface User {
  id: string; // UUID
  username: string;
  email: string;
  full_name?: string;
  role?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Vehicle Types
export interface Vehicle {
  id: string; // UUID from backend
  plate_number: string; // Changed from 'plate' to match backend
  type?: string; // Changed from model/brand/year/color to match backend schema
  load_capacity_kg?: number;
  registration_expiry?: string;
  created_at: string;
  driver?: Driver; // Populated via relationship
  device?: Device; // Populated via relationship
  location?: VehicleLocation;
}

export interface VehicleLocation {
  id: number;
  vehicle_id: number;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export interface CreateVehicleRequest {
  plate_number: string;
  type?: string;
  load_capacity_kg?: number;
  registration_expiry?: string;
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {}

// Driver Types
export interface Driver {
  id: string; // UUID
  full_name: string; // Changed from 'name' to match backend
  phone_number?: string; // Changed from 'phone' to match backend
  license_number: string;
  card_id?: string;
  created_at: string;
  vehicles?: Vehicle[];
}

export interface CreateDriverRequest {
  full_name: string;
  phone_number?: string;
  license_number: string;
  card_id?: string;
}

export interface UpdateDriverRequest extends Partial<CreateDriverRequest> {}

// Device Types
export interface Device {
  id: string; // UUID
  imei: string;
  serial_number?: string;
  firmware_version?: string;
  vehicle_id?: string; // UUID
  installed_at: string;
  vehicle?: Vehicle;
  vehicle_plate_number?: string;
}

export interface CreateDeviceRequest {
  imei: string;
  serial_number?: string;
  firmware_version?: string;
  vehicle_id?: string;
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

// Map Vehicle Types - Combined data for map display
export interface MapVehicle {
  id: string;
  plate_number: string;
  type?: string;
  device?: Device;
  driver?: Driver;
  // GPS data from realtime
  latitude?: number;
  longitude?: number;
  speed?: number;
  direction?: number;
  // Status derived from GPS and system data
  status: 'moving' | 'stopped' | 'parked' | 'offline';
  // Additional info from realtime
  battery_percent?: number;
  temperature?: number;
  fuel_level?: number;
  last_update?: string;
  camera_status?: 'online' | 'offline';
  // Error state
  error?: string;
}

// Journey Session Types
export interface JourneySession {
  id: number;
  vehicle_id: string;
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
  vehicle_plate_number: string;
  driver_name: string;
  device_imei?: string;
}

export interface CreateJourneySessionRequest {
  vehicle_id: string;
  driver_id: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface UpdateJourneySessionRequest extends Partial<CreateJourneySessionRequest> {}

// Error Types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}
