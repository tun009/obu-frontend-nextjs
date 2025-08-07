import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import apiService from '@/lib/services/api';
import { ApiError } from '@/lib/types/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

interface UseApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Thao tác thành công',
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (apiCall: () => Promise<any>) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiCall();
        
        setState({
          data: response.data || response,
          loading: false,
          error: null,
        });

        if (showSuccessToast) {
          toast.success(successMessage);
        }

        if (onSuccess) {
          onSuccess(response.data || response);
        }

        return response;
      } catch (error) {
        const apiError = error as ApiError;
        
        setState({
          data: null,
          loading: false,
          error: apiError,
        });

        if (showErrorToast) {
          toast.error(apiError.message || 'Đã xảy ra lỗi');
        }

        if (onError) {
          onError(apiError);
        }

        throw error;
      }
    },
    [showSuccessToast, showErrorToast, successMessage, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specific hooks for common operations
export function useAuth() {
  const loginApi = useApi({
    showSuccessToast: true,
    successMessage: 'Đăng nhập thành công',
  });

  const logoutApi = useApi({
    showSuccessToast: true,
    successMessage: 'Đăng xuất thành công',
  });

  const login = useCallback(
    async (credentials: { username: string; password: string }) => {
      return loginApi.execute(() => apiService.login(credentials));
    },
    [loginApi]
  );

  const logout = useCallback(async () => {
    return logoutApi.execute(() => apiService.logout());
  }, [logoutApi]);

  const isAuthenticated = useCallback(() => {
    return apiService.isAuthenticated();
  }, []);

  const getCurrentUser = useCallback(() => {
    // Không còn lưu user data, return null
    return null;
  }, []);

  return {
    login,
    logout,
    isAuthenticated,
    getCurrentUser,
    loginLoading: loginApi.loading,
    logoutLoading: logoutApi.loading,
    loginError: loginApi.error,
    logoutError: logoutApi.error,
  };
}

export function useVehicles() {
  const listApi = useApi();
  const createApi = useApi({
    showSuccessToast: true,
    successMessage: 'Tạo xe thành công',
  });
  const updateApi = useApi({
    showSuccessToast: true,
    successMessage: 'Cập nhật xe thành công',
  });
  const deleteApi = useApi({
    showSuccessToast: true,
    successMessage: 'Xóa xe thành công',
  });

  const getVehicles = useCallback(
    async (params?: any) => {
      return listApi.execute(() => apiService.getVehicles(params));
    },
    [listApi]
  );

  const createVehicle = useCallback(
    async (data: any) => {
      return createApi.execute(() => apiService.createVehicle(data));
    },
    [createApi]
  );

  const updateVehicle = useCallback(
    async (id: string, data: any) => {
      return updateApi.execute(() => apiService.updateVehicle(id, data));
    },
    [updateApi]
  );

  const deleteVehicle = useCallback(
    async (id: string) => {
      return deleteApi.execute(() => apiService.deleteVehicle(id));
    },
    [deleteApi]
  );

  return {
    vehicles: listApi.data,
    getVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    loading: listApi.loading || createApi.loading || updateApi.loading || deleteApi.loading,
    error: listApi.error || createApi.error || updateApi.error || deleteApi.error,
  };
}

export function useDrivers() {
  const listApi = useApi();
  const createApi = useApi({
    showSuccessToast: true,
    successMessage: 'Tạo tài xế thành công',
  });
  const updateApi = useApi({
    showSuccessToast: true,
    successMessage: 'Cập nhật tài xế thành công',
  });
  const deleteApi = useApi({
    showSuccessToast: true,
    successMessage: 'Xóa tài xế thành công',
  });

  const getDrivers = useCallback(
    async (params?: any) => {
      return listApi.execute(() => apiService.getDrivers(params));
    },
    [listApi]
  );

  const createDriver = useCallback(
    async (data: any) => {
      return createApi.execute(() => apiService.createDriver(data));
    },
    [createApi]
  );

  const updateDriver = useCallback(
    async (id: number, data: any) => {
      return updateApi.execute(() => apiService.updateDriver(id, data));
    },
    [updateApi]
  );

  const deleteDriver = useCallback(
    async (id: number) => {
      return deleteApi.execute(() => apiService.deleteDriver(id));
    },
    [deleteApi]
  );

  return {
    drivers: listApi.data,
    getDrivers,
    createDriver,
    updateDriver,
    deleteDriver,
    loading: listApi.loading || createApi.loading || updateApi.loading || deleteApi.loading,
    error: listApi.error || createApi.error || updateApi.error || deleteApi.error,
  };
}

export function useDevices() {
  const listApi = useApi();
  const createApi = useApi({
    showSuccessToast: true,
    successMessage: 'Tạo thiết bị thành công',
  });
  const updateApi = useApi({
    showSuccessToast: true,
    successMessage: 'Cập nhật thiết bị thành công',
  });
  const deleteApi = useApi({
    showSuccessToast: true,
    successMessage: 'Xóa thiết bị thành công',
  });

  const getDevices = useCallback(
    async (params?: any) => {
      return listApi.execute(() => apiService.getDevices(params));
    },
    [listApi]
  );

  const createDevice = useCallback(
    async (data: any) => {
      return createApi.execute(() => apiService.createDevice(data));
    },
    [createApi]
  );

  const updateDevice = useCallback(
    async (id: number, data: any) => {
      return updateApi.execute(() => apiService.updateDevice(id, data));
    },
    [updateApi]
  );

  const deleteDevice = useCallback(
    async (id: number) => {
      return deleteApi.execute(() => apiService.deleteDevice(id));
    },
    [deleteApi]
  );

  return {
    devices: listApi.data,
    getDevices,
    createDevice,
    updateDevice,
    deleteDevice,
    loading: listApi.loading || createApi.loading || updateApi.loading || deleteApi.loading,
    error: listApi.error || createApi.error || updateApi.error || deleteApi.error,
  };
}

export function useJourneySessions() {
  const listApi = useApi();
  const createApi = useApi({
    showSuccessToast: true,
    successMessage: 'Tạo ca làm việc thành công',
  });
  const updateApi = useApi({
    showSuccessToast: true,
    successMessage: 'Cập nhật ca làm việc thành công',
  });
  const deleteApi = useApi({
    showSuccessToast: true,
    successMessage: 'Xóa ca làm việc thành công',
  });
  const activateApi = useApi({
    showSuccessToast: true,
    successMessage: 'Kích hoạt ca làm việc thành công',
  });
  const completeApi = useApi({
    showSuccessToast: true,
    successMessage: 'Hoàn thành ca làm việc thành công',
  });

  const getJourneySessions = useCallback(
    async (params?: any) => {
      return listApi.execute(() => apiService.getJourneySessions(params));
    },
    [listApi]
  );

  const createJourneySession = useCallback(
    async (data: any) => {
      return createApi.execute(() => apiService.createJourneySession(data));
    },
    [createApi]
  );

  const updateJourneySession = useCallback(
    async (id: number, data: any) => {
      return updateApi.execute(() => apiService.updateJourneySession(id, data));
    },
    [updateApi]
  );

  const deleteJourneySession = useCallback(
    async (id: number) => {
      return deleteApi.execute(() => apiService.deleteJourneySession(id));
    },
    [deleteApi]
  );

  const activateJourneySession = useCallback(
    async (id: number) => {
      return activateApi.execute(() => apiService.activateJourneySession(id));
    },
    [activateApi]
  );

  const completeJourneySession = useCallback(
    async (id: number) => {
      return completeApi.execute(() => apiService.completeJourneySession(id));
    },
    [completeApi]
  );

  return {
    journeySessions: listApi.data,
    getJourneySessions,
    createJourneySession,
    updateJourneySession,
    deleteJourneySession,
    activateJourneySession,
    completeJourneySession,
    loading: listApi.loading || createApi.loading || updateApi.loading || deleteApi.loading || activateApi.loading || completeApi.loading,
    error: listApi.error || createApi.error || updateApi.error || deleteApi.error || activateApi.error || completeApi.error,
  };
}
