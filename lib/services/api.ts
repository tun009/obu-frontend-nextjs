import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  ApiResponse,
  ApiError,
  LoginRequest,
  Driver,
  CreateDriverRequest,
  UpdateDriverRequest,
  Device,
  CreateDeviceRequest,
  UpdateDeviceRequest,
  PaginationParams,
  PaginatedResponse,
  DeviceRealtimeResponse,
} from '../types/api';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_BASE_URL || '/api/v1';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token to requests
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle responses and errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
          // Only redirect if not already on login page
          if (typeof window !== 'undefined' && window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || error.response.data?.error || 'Đã xảy ra lỗi',
        status: error.response.status,
        code: error.response.data?.code,
        details: error.response.data,
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Không thể kết nối đến server',
        status: 0,
        code: 'NETWORK_ERROR',
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'Đã xảy ra lỗi không xác định',
        status: 0,
        code: 'UNKNOWN_ERROR',
      };
    }
  }

  // Token management
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<any> {
    try {
      const response = await this.api.post('/auth/login', credentials);

      // Assuming response structure: { access_token: "...", refresh_token: "..." }
      if (response.data && response.data.access_token) {
        this.setToken(response.data.access_token);

        if (typeof window !== 'undefined' && response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    } finally {
      this.clearToken();
    }
  }

  async refreshToken(): Promise<{ access_token: string }> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.api.post<{ access_token: string }>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      if (response.data && response.data.access_token) {
        this.setToken(response.data.access_token);
      }

      return response.data;
    } catch (error) {
      this.clearToken();
      throw error;
    }
  }



  // Generic CRUD methods - FastAPI returns data directly, no wrapper
  public async get<T>(url: string, params?: any): Promise<T> {
    try {
      const response = await this.api.get<T>(url, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  public async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.post<T>(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  public async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.put<T>(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  public async patch<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.patch<T>(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  public async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.api.delete<T>(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  }



  // Driver methods
  async getDrivers(params?: PaginationParams): Promise<PaginatedResponse<Driver>> {
    return this.get<PaginatedResponse<Driver>>('/drivers', params);
  }

  async getDriver(id: string): Promise<Driver> {
    return this.get<Driver>(`/drivers/${id}`);
  }

  async createDriver(data: CreateDriverRequest): Promise<Driver> {
    return this.post<Driver>('/drivers', data);
  }

  async updateDriver(id: string, data: UpdateDriverRequest): Promise<Driver> {
    return this.put<Driver>(`/drivers/${id}`, data);
  }

  async deleteDriver(id: string): Promise<void> {
    return this.delete<void>(`/drivers/${id}`);
  }

  // Device methods
  async getDevices(params?: PaginationParams): Promise<PaginatedResponse<Device>> {
    return this.get<PaginatedResponse<Device>>('/journey-sessions/active/realtime', params);
  }

  async getDevice(id: string): Promise<Device> {
    return this.get<Device>(`/devices/${id}`);
  }

  async createDevice(data: CreateDeviceRequest): Promise<Device> {
    return this.post<Device>('/devices', data);
  }

  async updateDevice(id: string, data: UpdateDeviceRequest): Promise<Device> {
    return this.put<Device>(`/devices/${id}`, data);
  }

  async deleteDevice(id: string): Promise<void> {
    return this.delete<void>(`/devices/${id}`);
  }

  // Device realtime methods
  async getDeviceRealtime(deviceId: string): Promise<DeviceRealtimeResponse> {
    return this.get<DeviceRealtimeResponse>(`/devices/${deviceId}/realtime`);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.getToken();
  }


}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
