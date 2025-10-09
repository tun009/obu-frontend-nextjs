import apiService from './api';
import type { 
  Driver, 
  CreateDriverRequest, 
  UpdateDriverRequest,
  PaginatedResponse 
} from '@/lib/types/api';

export interface DriverListParams {
  page?: number;
  items_per_page?: number;
  search?: string;
}

class DriversAPI {
  private readonly basePath = '/drivers';

  async getDrivers(params: DriverListParams = {}): Promise<PaginatedResponse<Driver>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.items_per_page) searchParams.append('items_per_page', params.items_per_page.toString());
    if (params.search) searchParams.append('search', params.search);
    const url = `${this.basePath}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiService.get<PaginatedResponse<Driver>>(url);
  }

  async getDriver(id: string): Promise<Driver> {
    return apiService.get<Driver>(`${this.basePath}/${id}`);
  }

  async createDriver(data: CreateDriverRequest): Promise<Driver> {
    return apiService.post<Driver>(this.basePath, data);
  }

  async updateDriver(id: string, data: UpdateDriverRequest): Promise<Driver> {
    return apiService.patch<Driver>(`${this.basePath}/${id}`, data);
  }

  async deleteDriver(id: string): Promise<void> {
    return apiService.delete<void>(`${this.basePath}/${id}`);
  }
}

const driversAPI = new DriversAPI();
export default driversAPI;

