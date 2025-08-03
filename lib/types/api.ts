// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
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
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Vehicle Types
export interface Vehicle {
  id: number;
  plate: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  driver_id?: number;
  device_id?: number;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
  driver?: Driver;
  device?: Device;
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
  plate: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  driver_id?: number;
  device_id?: number;
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {}

// Driver Types
export interface Driver {
  id: number;
  name: string;
  phone: string;
  email?: string;
  license_number: string;
  license_expiry: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  vehicles?: Vehicle[];
}

export interface CreateDriverRequest {
  name: string;
  phone: string;
  email?: string;
  license_number: string;
  license_expiry: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UpdateDriverRequest extends Partial<CreateDriverRequest> {}

// Device Types
export interface Device {
  id: number;
  serial_number: string;
  model: string;
  firmware_version: string;
  status: 'active' | 'inactive' | 'maintenance';
  vehicle_id?: number;
  last_ping?: string;
  created_at: string;
  updated_at: string;
  vehicle?: Vehicle;
}

export interface CreateDeviceRequest {
  serial_number: string;
  model: string;
  firmware_version: string;
  status?: 'active' | 'inactive' | 'maintenance';
  vehicle_id?: number;
}

export interface UpdateDeviceRequest extends Partial<CreateDeviceRequest> {}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Error Types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}
