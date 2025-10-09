import apiService from './api';
import type {
  Vehicle,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  PaginatedResponse
} from '@/lib/types/api';

export interface VehicleListParams {
  page?: number;
  items_per_page?: number;
  search?: string;
}

class VehiclesAPI {
  private readonly basePath = '/vehicles';

  async getVehicles(params: VehicleListParams = {}): Promise<PaginatedResponse<Vehicle>> {
      const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.items_per_page) searchParams.append('items_per_page', params.items_per_page.toString());
        if (params.search) searchParams.append('search', params.search);
        const url = `${this.basePath}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return apiService.get<PaginatedResponse<Vehicle>>(url);
  }

  async getVehicle(id: string): Promise<Vehicle> {
    return apiService.get<Vehicle>(`${this.basePath}/${id}`);
  }

  async getUnassignedVehicles(): Promise<Vehicle[]> {
    return apiService.get<Vehicle[]>(`${this.basePath}/unassigned`);
  }

  async createVehicle(data: CreateVehicleRequest): Promise<Vehicle> {
    return apiService.post<Vehicle>(this.basePath, data);
  }

  async updateVehicle(id: string, data: UpdateVehicleRequest): Promise<any> {
    return apiService.patch<any>(`${this.basePath}/${id}`, data);
  }

  async deleteVehicle(id: string): Promise<void> {
    return apiService.delete<void>(`${this.basePath}/${id}`);
  }
}

const vehiclesAPI = new VehiclesAPI();
export default vehiclesAPI;


