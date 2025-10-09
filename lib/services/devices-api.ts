import apiService from './api';
import type {
  Device,
  CreateDeviceRequest,
  UpdateDeviceRequest,
  PaginatedResponse
} from '@/lib/types/api';

export interface DeviceListParams {
  page?: number;
  items_per_page?: number;
  search?: string;
  include_realtime?: boolean;
}



class DevicesAPI {
  private readonly basePath = '/devices';

  // Get paginated list of devices (always set include_realtime=false)
  async getDevices(params: DeviceListParams = {}): Promise<PaginatedResponse<Device>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.items_per_page) searchParams.append('items_per_page', params.items_per_page.toString());
    if (params.search) searchParams.append('search', params.search);
    // Always set include_realtime=false to avoid MQTT service calls
    searchParams.append('include_realtime', 'false');

    const url = `${this.basePath}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiService.get<PaginatedResponse<Device>>(url);
  }

  // Get single device by ID
  async getDevice(id: string): Promise<Device> {
    return apiService.get<Device>(`${this.basePath}/${id}`);
  }



  // Create new device
  async createDevice(data: CreateDeviceRequest): Promise<Device> {
    return apiService.post<Device>(this.basePath, data);
  }

  // Update device (partial update)
  async updateDevice(id: string, data: UpdateDeviceRequest): Promise<Device> {
    return apiService.patch<Device>(`${this.basePath}/${id}`, data);
  }

  // Delete device
  async deleteDevice(id: string): Promise<void> {
    return apiService.delete<void>(`${this.basePath}/${id}`);
  }



  // Get device realtime info
  async getDeviceRealtimeInfo(deviceId: string): Promise<any> {
    return apiService.get<any>(`${this.basePath}/${deviceId}/realtime`);
  }
}

// Export singleton instance
const devicesAPI = new DevicesAPI();
export default devicesAPI;
