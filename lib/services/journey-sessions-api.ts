import apiService from './api';
import type {
  JourneySession,
  JourneySessionWithDetails,
  CreateJourneySessionRequest,
  UpdateJourneySessionRequest,
  PaginatedResponse,
  JourneySessionHistoryResponse
} from '@/lib/types/api';

export interface JourneySessionsListParams {
  page?: number;
  items_per_page?: number;
  status_filter?: 'pending' | 'active' | 'completed';
}

export interface JourneySessionStatusResponse {
  session_id: number;
  status: 'pending' | 'active' | 'completed';
  activated_at?: string;
  start_time: string;
  end_time?: string;
}

class JourneySessionsAPI {
  private readonly basePath = '/journey-sessions';

  // Get paginated list of journey sessions
  async getJourneySessions(params: JourneySessionsListParams = {}): Promise<PaginatedResponse<JourneySessionWithDetails>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.items_per_page) searchParams.append('items_per_page', params.items_per_page.toString());
    if (params.status_filter) searchParams.append('status_filter', params.status_filter);

    const url = `${this.basePath}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiService.get<PaginatedResponse<JourneySessionWithDetails>>(url);
  }

  // Get active journey sessions
  async getActiveJourneySessions(): Promise<JourneySessionWithDetails[]> {
    return apiService.get<JourneySessionWithDetails[]>(`${this.basePath}/active`);
  }

  // Get journey session by ID
  async getJourneySession(id: number): Promise<JourneySessionWithDetails> {
    return apiService.get<JourneySessionWithDetails>(`${this.basePath}/${id}`);
  }

  // Create new journey session
  async createJourneySession(data: CreateJourneySessionRequest): Promise<JourneySession> {
    return apiService.post<JourneySession>(this.basePath, data);
  }

  // Update journey session
  async updateJourneySession(id: number, data: UpdateJourneySessionRequest): Promise<JourneySession> {
    return apiService.put<JourneySession>(`${this.basePath}/${id}`, data);
  }

  // Delete journey session
  async deleteJourneySession(id: number): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`${this.basePath}/${id}`);
  }

  // Start journey session (pending -> active)
  async startJourneySession(id: number): Promise<JourneySession> {
    return apiService.post<JourneySession>(`${this.basePath}/${id}/start`);
  }

  // End journey session (active -> completed)
  async endJourneySession(id: number): Promise<JourneySession> {
    return apiService.post<JourneySession>(`${this.basePath}/${id}/end`);
  }

  // Get journey session status
  async getJourneySessionStatus(id: number): Promise<JourneySessionStatusResponse> {
    return apiService.get<JourneySessionStatusResponse>(`${this.basePath}/${id}/status`);
  }

  // Get journey session history
  async getJourneySessionHistory(id: number): Promise<JourneySessionHistoryResponse> {
    return apiService.get<JourneySessionHistoryResponse>(`${this.basePath}/${id}/history`);
  }
}

export const journeySessionsAPI = new JourneySessionsAPI();
export default journeySessionsAPI;
