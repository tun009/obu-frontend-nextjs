import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '@/lib/services/api';
import { Device, DeviceRealtimeResponse } from '@/lib/types/api';
import { toast } from 'sonner';

// Map Device with GPS data
export interface MapDevice extends Device {
  // GPS data from realtime
  latitude?: number;
  longitude?: number;
  speed?: number;
  direction?: number;
  // Status derived from GPS and system data
  status: 'online' | 'offline' | 'no_gps';
  // Additional info from realtime
  battery_percent?: number;
  temperature?: number;
  last_update?: string;
  // Error state
  error?: string;
  // Realtime data (full response)
  realtimeData?: DeviceRealtimeResponse;
  plate_number?: string;
  thumbnail_url?: string;
  driver_name?: string;
  driver_phone_number?: string;
  hasGpsData?: boolean; // To specifically track if GPS data is active
}

interface UseMapDataReturn {
  devices: MapDevice[];
  loading: boolean;
  error: string | null;
  selectedDevice: MapDevice | null;
  setSelectedDevice: (device: MapDevice | null) => void
}

export function useMapData(): UseMapDataReturn {
  const [devices, setDevices] = useState<MapDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<MapDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const determineDeviceStatus = (gpsInfo: any): 'online' | 'offline' | 'no_gps' => {
    if (!gpsInfo) {
      return 'offline';
    }

    if (gpsInfo.enable !== 1) {
      return 'no_gps';
    }

    return 'online';
  };

  

  // Convert device with realtime data to MapDevice
  const convertToMapDevice = (
    device: any, // Device with realtime field from new API
    realtimeData?: DeviceRealtimeResponse,
    error?: string
  ): MapDevice => {
    // Use realtime data from device.realtime if available, otherwise use realtimeData parameter
    const realtime = device.realtime || realtimeData?.data;
    const gpsInfo = realtime?.GPS_INFO;
    const batteryInfo = realtime?.BATTERY_INFO;
    const systemInfo = realtime?.SYSTEM_INFO;

    // Convert GPS coordinates from DDMM.MMMM format to decimal degrees
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (gpsInfo && gpsInfo.enable === 1) {
      // Convert latitude: DDMM.MMMM to DD.DDDDDD
      if (gpsInfo.latitude && gpsInfo.latitude_degree !== undefined) {
        const latDegrees = gpsInfo.latitude_degree;
        const latMinutes = gpsInfo.latitude - (latDegrees * 100);
        latitude = latDegrees + (latMinutes / 60);
      }

      // Convert longitude: DDDMM.MMMM to DDD.DDDDDD
      if (gpsInfo.longitude && gpsInfo.longitude_degree !== undefined) {
        const lngDegrees = gpsInfo.longitude_degree;
        const lngMinutes = gpsInfo.longitude - (lngDegrees * 100);
        longitude = lngDegrees + (lngMinutes / 60);
      }
    }
    const hasGps = !!(realtime && Object.keys(realtime).length > 0 && gpsInfo && gpsInfo.enable === 1 && gpsInfo.valid === 1);
    return {
      ...device,
      // GPS coordinates (converted to decimal degrees)
      latitude: latitude,
      longitude: longitude,
      speed: gpsInfo?.speed,
      direction: gpsInfo?.direction,
      status: error ? 'offline' : determineDeviceStatus(gpsInfo),
      battery_percent: batteryInfo?.bat_percent,
      temperature: systemInfo?.temperature,
      last_update: device?.last_update,
      error: error,
      realtimeData: realtimeData || { data: realtime } as any,
      thumbnail_url: device.thumbnail_url,
      hasGpsData: hasGps, // Set the GPS status flag
    };
  };

  // Fetch all devices
  const fetchDevices = useCallback(async (): Promise<Device[]> => {
    try {
      const response = await apiService.getDevices({page:1, items_per_page: 100 }); // Get all devices
      if (response && response.data) {
        return response.data;
      }
      throw new Error('Failed to fetch devices - no data in response');
    } catch (error: any) {
      console.error('Error fetching devices:', error);
      throw error;
    }
  }, []);


  const silentRefreshData = useCallback(async (): Promise<void> => {
    if (isPollingRef.current) {
      return;
    }

    isPollingRef.current = true;

    try {
      const devicesData = await fetchDevices();

      const mapDevices = devicesData.map(device => convertToMapDevice(device));
      setDevices(mapDevices);

    } catch (error: any) {
      console.warn('Silent polling error (ignored):', error.message || error);
    } finally {
      isPollingRef.current = false;
    }
  }, [fetchDevices]);

  const refreshData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const devicesData = await fetchDevices();
      console.log('Fetched devices:', devicesData.length);

      const mapDevices = devicesData.map(device => convertToMapDevice(device));

      setDevices(mapDevices);

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load devices';
      console.error('refreshData error:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchDevices]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;

      refreshData().then(() => {
        pollingIntervalRef.current = setInterval(() => {
          silentRefreshData();
        }, 5000); // Poll every 10 seconds
      }).catch((error) => {
        console.error('Initial data load failed:', error);
        // Still start polling even if initial load fails
        pollingIntervalRef.current = setInterval(() => {
          silentRefreshData();
        }, 5000);
      });
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        console.log('Polling stopped - component unmounted');
      }
    };
  }, [refreshData, silentRefreshData]);

  // Optional: Pause polling when tab is not active (performance optimization)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is not active - pause polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          console.log('Polling paused - tab not active');
        }
      } else {
        // Tab is active - resume polling if not already running
        if (!pollingIntervalRef.current && initializedRef.current) {
          pollingIntervalRef.current = setInterval(() => {
            silentRefreshData();
          }, 5000);
          console.log('Polling resumed - tab active');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [silentRefreshData]);

  return {
    devices,
    loading,
    error,
    selectedDevice,
    setSelectedDevice  };
}
