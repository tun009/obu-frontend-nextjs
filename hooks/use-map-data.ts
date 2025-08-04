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
}

interface UseMapDataReturn {
  devices: MapDevice[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  selectedDevice: MapDevice | null;
  setSelectedDevice: (device: MapDevice | null) => void;
}

export function useMapData(): UseMapDataReturn {
  const [devices, setDevices] = useState<MapDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<MapDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Helper function to determine device status based on GPS data
  const determineDeviceStatus = (gpsInfo: any): 'online' | 'offline' | 'no_gps' => {
    if (!gpsInfo) {
      return 'offline';
    }

    if (gpsInfo.enable !== 1) {
      return 'no_gps';
    }

    return 'online';
  };

  // Helper function to format timestamp
  const formatLastUpdate = (timestamp: number): string => {
    try {
      const now = Date.now();
      const diff = now - (timestamp * 1000);
      const minutes = Math.floor(diff / (1000 * 60));

      if (minutes < 1) {
        return 'Vừa xong';
      } else if (minutes < 60) {
        return `${minutes} phút trước`;
      } else {
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
          return `${hours} giờ trước`;
        } else {
          const days = Math.floor(hours / 24);
          return `${days} ngày trước`;
        }
      }
    } catch (error) {
      return 'Không xác định';
    }
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

    return {
      ...device,
      // GPS coordinates (converted to decimal degrees)
      latitude: latitude,
      longitude: longitude,
      speed: gpsInfo?.speed ? Math.round(gpsInfo.speed * 3.6) : 0, // Convert m/s to km/h
      direction: gpsInfo?.direction,
      status: error ? 'offline' : determineDeviceStatus(gpsInfo),
      battery_percent: batteryInfo?.bat_percent,
      temperature: systemInfo?.temperature,
      last_update: realtimeData?.timestamp ? formatLastUpdate(realtimeData.timestamp) : undefined,
      error: error,
      realtimeData: realtimeData || { data: realtime } as any
    };
  };

  // Fetch all devices
  const fetchDevices = useCallback(async (): Promise<Device[]> => {
    try {
      const response = await apiService.getDevices({ items_per_page: 100 }); // Get all devices
      console.log('getDevices response:', response);

      if (response && response.data) {
        return response.data;
      }
      throw new Error('Failed to fetch devices - no data in response');
    } catch (error: any) {
      console.error('Error fetching devices:', error);
      throw error;
    }
  }, []);

  // No longer need fetchDeviceRealtime - GPS data comes with devices API

  // No longer need loadDeviceRealtime - GPS data comes with initial API call

  // Main data refresh function - load devices with realtime data
  const refreshData = useCallback(async (): Promise<void> => {
    console.log('refreshData called - loading devices with realtime data');
    setLoading(true);
    setError(null);

    try {
      // Fetch all devices (now includes realtime data from API)
      const devicesData = await fetchDevices();
      console.log('Fetched devices:', devicesData.length);

      // Convert to MapDevice using realtime data from API response
      const mapDevices = devicesData.map(device => convertToMapDevice(device));

      // Filter devices that have GPS data
      const devicesWithGPS = mapDevices.filter(device =>
        device.latitude !== undefined && device.longitude !== undefined
      );

      console.log('Processed map devices:', mapDevices.length);
      console.log('Devices with GPS data:', devicesWithGPS.length);

      setDevices(mapDevices);

      // Auto-focus map to first device with GPS data (but don't select it)
      if (devicesWithGPS.length > 0) {
        // Set first device as map center reference (not selected)
        const firstDevice = devicesWithGPS[0];
        // We'll use this in the map component to set initial center
        console.log('First device with GPS for map center:', firstDevice.imei, firstDevice.latitude, firstDevice.longitude);
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load devices';
      console.error('refreshData error:', error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchDevices]);

  // Initial data load - prevent double call in React StrictMode
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      refreshData();
    }
  }, [refreshData]);

  // No auto-refresh - user manually clicks on devices to load realtime data

  return {
    devices,
    loading,
    error,
    refreshData,
    selectedDevice,
    setSelectedDevice
  };
}
