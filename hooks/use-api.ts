import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import i18n from '@/i18n';
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
    successMessage = i18n.t('common.operationSuccess'),
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
          toast.error(apiError.message || i18n.t('common.genericError'));
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
    successMessage: i18n.t('common.loginSuccess'),
  });

  const logoutApi = useApi({
    showSuccessToast: true,
    successMessage: i18n.t('common.logoutSuccess'),
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

export function useDrivers() {
  const listApi = useApi();
  const createApi = useApi({
    showSuccessToast: true,
    successMessage: i18n.t('usersPage.toasts.create_success'),
  });
  const updateApi = useApi({
    showSuccessToast: true,
    successMessage: i18n.t('usersPage.toasts.update_success'),
  });
  const deleteApi = useApi({
    showSuccessToast: true,
    successMessage: i18n.t('usersPage.toasts.delete_success'),
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
      return updateApi.execute(() => apiService.updateDriver(id.toString(), data));
    },
    [updateApi]
  );

  const deleteDriver = useCallback(
    async (id: number) => {
      return deleteApi.execute(() => apiService.deleteDriver(id.toString()));
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
    successMessage: i18n.t('devicesPage.toasts.create_success'),
  });
  const updateApi = useApi({
    showSuccessToast: true,
    successMessage: i18n.t('devicesPage.toasts.update_success'),
  });
  const deleteApi = useApi({
    showSuccessToast: true,
    successMessage: i18n.t('devicesPage.toasts.delete_success'),
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
      return updateApi.execute(() => apiService.updateDevice(id.toString(), data));
    },
    [updateApi]
  );

  const deleteDevice = useCallback(
    async (id: number) => {
      return deleteApi.execute(() => apiService.deleteDevice(id.toString()));
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

// export function useJourneySessions() {
//   const listApi = useApi();
//   const createApi = useApi({
//     showSuccessToast: true,
//     successMessage: i18n.t('journeySessionForm.toasts.createSuccess'),
//   });
//   const updateApi = useApi({
//     showSuccessToast: true,
//     successMessage: i18n.t('journeySessionForm.toasts.updateSuccess'),
//   });
//   const deleteApi = useApi({
//     showSuccessToast: true,
//     successMessage: i18n.t('journeySessionsPage.toasts.delete_success'),
//   });
//   const activateApi = useApi({
//     showSuccessToast: true,
//     successMessage: i18n.t('common.activateShiftSuccess'),
//   });
//   const completeApi = useApi({
//     showSuccessToast: true,
//     successMessage: i18n.t('common.completeShiftSuccess'),
//   });

//   const getJourneySessions = useCallback(
//     async (params?: any) => {
//       return listApi.execute(() => apiService.getJourneySessions(params));
//     },
//     [listApi]
//   );

//   const createJourneySession = useCallback(
//     async (data: any) => {
//       return createApi.execute(() => apiService.createJourneySession(data));
//     },
//     [createApi]
//   );

//   const updateJourneySession = useCallback(
//     async (id: number, data: any) => {
//       return updateApi.execute(() => apiService.updateJourneySession(id.toString(), data));
//     },
//     [updateApi]
//   );

//   const deleteJourneySession = useCallback(
//     async (id: number) => {
//       return deleteApi.execute(() => apiService.deleteJourneySession(id.toString()));
//     },
//     [deleteApi]
//   );

//   const activateJourneySession = useCallback(
//     async (id: number) => {
//       return activateApi.execute(() => apiService.activateJourneySession(id.toString()));
//     },
//     [activateApi]
//   );

//   const completeJourneySession = useCallback(
//     async (id: number) => {
//       return completeApi.execute(() => apiService.completeJourneySession(id.toString()));
//     },
//     [completeApi]
//   );

//   return {
//     journeySessions: listApi.data,
//     getJourneySessions,
//     createJourneySession,
//     updateJourneySession,
//     deleteJourneySession,
//     activateJourneySession,
//     completeJourneySession,
//     loading: listApi.loading || createApi.loading || updateApi.loading || deleteApi.loading || activateApi.loading || completeApi.loading,
//     error: listApi.error || createApi.error || updateApi.error || deleteApi.error || activateApi.error || completeApi.error,
//   };
// }
