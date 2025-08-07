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

  // Get paginated list of vehicles
  async getVehicles(params: VehicleListParams = {}): Promise<PaginatedResponse<Vehicle>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.items_per_page) searchParams.append('items_per_page', params.items_per_page.toString());
    if (params.search) searchParams.append('search', params.search);

    const url = `${this.basePath}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiService.get<PaginatedResponse<Vehicle>>(url);
  }

  // Get single vehicle by ID
  async getVehicle(id: string): Promise<Vehicle> {
    return apiService.get<Vehicle>(`${this.basePath}/${id}`);
  }

  // Get vehicle by plate number
  async getVehicleByPlate(plateNumber: string): Promise<Vehicle> {
    return apiService.get<Vehicle>(`${this.basePath}/plate/${plateNumber}`);
  }

  // Get unassigned vehicles (vehicles without devices)
  async getUnassignedVehicles(): Promise<Vehicle[]> {
    return apiService.get<Vehicle[]>(`${this.basePath}/unassigned`);
  }

  // Create new vehicle
  async createVehicle(data: CreateVehicleRequest): Promise<Vehicle> {
    return apiService.post<Vehicle>(this.basePath, data);
  }

  // Update vehicle (partial update)
  async updateVehicle(id: string, data: UpdateVehicleRequest): Promise<any> {
    return apiService.patch<any>(`${this.basePath}/${id}`, data);
  }

  // Delete vehicle
  async deleteVehicle(id: string): Promise<void> {
    return apiService.delete<void>(`${this.basePath}/${id}`);
  }
}

// Export singleton instance
const vehiclesAPI = new VehiclesAPI();
export default vehiclesAPI;
