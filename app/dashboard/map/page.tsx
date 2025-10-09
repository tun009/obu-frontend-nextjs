"use client"
import Image from "next/image"

import { useState, useRef, useEffect, useMemo } from "react"
import DynamicMap from "@/components/map/dynamic-map"
import L from 'leaflet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, RefreshCw, Mic, MicOff, Video, Phone, WifiOff } from "lucide-react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { useMapData, MapDevice } from "@/hooks/use-map-data"
import { usePocCall } from "@/hooks/use-poc-call"
import { WebRTCVideoPlayer } from "@/components/webrtc-video-player"
import { WebRTCProvider } from "@/contexts/webrtc-provider"
import { PrivateCallOverlay } from "@/components/ui/private-call-overlay"
import { getMediaUrl } from "@/lib/proxy-service"

const defaultCenter = {
  lat: 21.0285, // Default center - Hanoi
  lng: 105.8542,
}


function DeviceGrid({
  devices,
  selectedDevice,
  onDeviceSelect,
  onInitiatePrivateCall,
  isCallActive,
  talkingUser,
}: {
  devices: (MapDevice & { online: boolean; ms_code: string })[]
  selectedDevice: (MapDevice & { online: boolean; ms_code: string }) | null
  onDeviceSelect: (device: MapDevice & { online: boolean; ms_code: string }) => void
  onInitiatePrivateCall: (device: any) => void;
  isCallActive: boolean;
  talkingUser: { ms_code: string; };
}) {
  const [playingDeviceIds, setPlayingDeviceIds] = useState(new Set<string | number>())

  return (
    <div className="grid gap-4 mt-1 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
      {devices.map((device) => {
        const isTalking = talkingUser?.ms_code && talkingUser.ms_code === device.ms_code;
        return (
          <Card
            key={device.id}
            onClick={() => onDeviceSelect(device)}
            className={`transition-all hover:shadow-md cursor-pointer ${selectedDevice?.id === device.id ? "ring-2 ring-blue-500" : ""
              } ${isTalking ? "ring-2 ring-red-500 animate-talk-shake" : ""}`}
          >

            <CardHeader className="pb-2 !p-4 !pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${device.online
                      ? "bg-green-500"
                      : device.status === "no_gps"
                        ? "bg-orange-500"
                        : "bg-red-500"
                      }`}
                  />
                  <CardTitle className="text-sm">{device.driver_name}</CardTitle>
                  {device.hasGpsData ? (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">GPS</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">No GPS</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInitiatePrivateCall(device);
                  }}
                  disabled={!device.online || isCallActive}
                  title={isCallActive ? "Đang có cuộc gọi khác" : device.online ? "Bắt đầu gọi riêng" : "Thiết bị offline"}
                >
                  <Phone className={`h-4 w-4 ${device.online ? 'text-blue-500' : 'text-gray-400'}`} />
                </Button>
              </div>
              <CardDescription className="text-xs font-medium">{device?.imei}
                {/* <span className="text-xs"> ({device?.imei})</span> */}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 !p-4">
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3 group">
                {playingDeviceIds.has(device.id) ? (
                  <WebRTCVideoPlayer
                    deviceId={device.imei}
                    deviceName={device.device_name || device.imei}
                    onStreamStop={() => {
                      setPlayingDeviceIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(device.id);
                        return newSet;
                      });
                    }}
                  />
                ) : (
                  <>
                    {device.online ? (
                      <div onClick={() => setPlayingDeviceIds(prev => new Set(prev).add(device.id))} className="cursor-pointer w-full h-full">
                        {device.thumbnail_url ? (
                          <img
                            src={getMediaUrl(device.thumbnail_url)}
                            alt={`Thumbnail for ${device.imei}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <Video className="h-8 w-8 text-gray-500" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Image
                            src="/images/video-play.png"
                            alt="Play Video"
                            width={48}
                            height={48}
                            className="transform transition-transform duration-300 ease-in-out group-hover:scale-110"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <div className="text-center text-gray-400">
                          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <div className="text-xs">Device Offline
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              {/* 
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IMEI:</span>
                  <span className="font-medium font-mono">{device.imei}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tốc độ:</span>
                  <span className="font-medium">{device.speed || 0} km/h</span>
                </div>
                {device.battery_percent !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pin:</span>
                    <span className="font-medium">{device.battery_percent}%</span>
                  </div>
                )}
                {device.temperature !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nhiệt độ:</span>
                    <span className="font-medium">{device.temperature}°C</span>
                  </div>
                )}
              </div> */}
            </CardContent>
          </Card>
        )
      })}

    </div>
  )
}

export default function MapPage() {
  const { devices, loading, selectedDevice, setSelectedDevice } = useMapData();
  const {
    members: callMembers,
    isReady: isCallReady,
    handleStartTalk,
    handleStopTalk,
    talkingUser,
    profile,
    initiatePrivateTalk,
    terminatePrivateTalk,
    isInTempGroup,
    isOnline
  } = usePocCall();
  const [searchTerm] = useState("") // We don't have a search input yet
  const [statusFilter] = useState("all") // We don't have a status filter UI yet
  const [map, setMap] = useState<L.Map | null>(null)
  const [privateCallTarget, setPrivateCallTarget] = useState<(MapDevice & { online: boolean; ms_code: string }) | null>(null);

  // Ref để lưu mapCenter cố định - chỉ set 1 lần duy nhất
  const fixedMapCenterRef = useRef<{ lat: number, lng: number } | null>(null)

  // Function tính toán center bao quát tất cả thiết bị
  const calculateBoundsCenter = (devicesWithGPS: MapDevice[]) => {
    if (devicesWithGPS.length === 0) {
      return defaultCenter;
    }

    if (devicesWithGPS.length === 1) {
      return {
        lat: devicesWithGPS[0].latitude!,
        lng: devicesWithGPS[0].longitude!
      };
    }

    // Tính toán bounds của tất cả thiết bị
    const latitudes = devicesWithGPS.map(d => d.latitude!);
    const longitudes = devicesWithGPS.map(d => d.longitude!);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    // Center của bounds
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    console.log('📍 Calculated bounds center:', {
      center: { lat: centerLat, lng: centerLng },
      bounds: { minLat, maxLat, minLng, maxLng },
      devicesCount: devicesWithGPS.length
    });

    return { lat: centerLat, lng: centerLng };
  };

  // Set mapCenter cố định chỉ 1 lần khi có thiết bị với GPS
  useEffect(() => {
    if (!fixedMapCenterRef.current && devices.length > 0) {
      const devicesWithGPS = devices.filter(device =>
        device.latitude !== undefined && device.longitude !== undefined
      );

      if (devicesWithGPS.length > 0) {
        const boundsCenter = calculateBoundsCenter(devicesWithGPS);
        fixedMapCenterRef.current = boundsCenter;
        console.log('🎯 Fixed map center set:', boundsCenter);
      }
    }
  }, [devices]);

  const combinedDevices = useMemo(() => {
    if (!devices.length) return [];

    const callMembersMap = new Map(callMembers.map(m => [m.ms_code, m]));

    return devices.map(device => {
      const callMember = callMembersMap.get(device.imei);

      let newStatus = device.status;
      if (callMember !== undefined) {
        // Prioritize call server's online status
        newStatus = callMember.online ? 'online' : 'offline';
      }

      // If device is online but has no GPS, set status to 'no_gps'
      if (newStatus === 'online' && (!device.latitude || !device.longitude)) {
        newStatus = 'no_gps';
      }

      return {
        ...device,
        ms_code: device.imei, // Explicitly map imei to ms_code for clarity
        online: callMember?.online ?? false, // Add true online status from call server
        status: newStatus, // Overwrite status with more reliable data
      };
    });
  }, [devices, callMembers]);

  const filteredDevices = combinedDevices.filter((device) => {
    const matchesSearch =
      device?.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device?.device_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || device.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Sử dụng mapCenter cố định đã được set 1 lần, fallback to default
  const mapCenter = fixedMapCenterRef.current || defaultCenter;

  // Find the combined device that matches the selected device from the map data hook
  const selectedCombinedDevice = useMemo(() => {
    if (!selectedDevice) return null;
    return combinedDevices.find(d => d.id === selectedDevice.id) || null;
  }, [selectedDevice, combinedDevices]);

  const handleMarkerClick = (device: MapDevice) => {
    // Find the original device from the full list to set in state
    setSelectedDevice(devices.find(d => d.id === device.id) || null);
  }

  const handleDeviceClick = (device: MapDevice) => {
    setSelectedDevice(devices.find(d => d.id === device.id) || null);

    if (map && device.latitude && device.longitude) {
      map.flyTo([device.latitude, device.longitude], 15)
      // map.flyTo([device.latitude, device.longitude])
      // map.setZoom(15)
    }
  }

  const handleInitiatePrivateCall = (device: MapDevice & { online: boolean; ms_code: string }) => {
    initiatePrivateTalk(device);
    setPrivateCallTarget(device);
  };

  const handleTerminatePrivateCall = () => {
    terminatePrivateTalk();
    setPrivateCallTarget(null);
  };

  if (loading && devices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải thiết bị và dữ liệu GPS...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {privateCallTarget && isInTempGroup && (
        <PrivateCallOverlay
          deviceName={privateCallTarget.device_name || privateCallTarget.imei}
          onStopCall={handleTerminatePrivateCall}
        />
      )}

      {/* Main Content with Resizable Layout */}
      <WebRTCProvider>
        <ResizablePanelGroup id="main-content" direction="horizontal" className="rounded-lg border !h-[calc(100vh-113px)]">
          {/* Live Camera Grid - Left Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <Card className="h-full border-0 rounded-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Danh sách các thiết bị trong ca làm việc</CardTitle>
                    {filteredDevices.length > 0 && <CardDescription className="text-xs mt-1 h-4">
                      {talkingUser.ms_code && !isInTempGroup
                        ? <Badge variant="destructive" className="animate-pulse">
                          {(!profile || talkingUser.ms_code === profile.ms_code) ? "Bạn đang nói..." : `${talkingUser.ms_name} đang nói...`}
                        </Badge>
                        : <span>Nhấn để nói vào nhóm hiện tại</span>
                      }
                    </CardDescription>
                    }
                  </div>
                  {filteredDevices.length > 0 && <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleStartTalk}
                      disabled={!isCallReady || !!talkingUser.ms_code || !isOnline || isInTempGroup}
                      className="bg-green-500 hover:bg-green-600"
                      title="Bắt đầu nói"
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Nói
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleStopTalk}
                      disabled={!isCallReady || !profile || talkingUser.ms_code !== profile.ms_code || !isOnline || isInTempGroup}
                      title="Dừng nói"
                    >
                      <MicOff className="h-4 w-4 mr-2" />
                      Dừng
                    </Button>
                  </div>
                  }
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100vh-120px)] overflow-y-auto">
                {filteredDevices.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Không có thiết bị nào đang trong ca làm việc</p>
                    </div>
                  </div>
                ) : (
                  <DeviceGrid
                    devices={filteredDevices}
                    selectedDevice={selectedCombinedDevice}
                    onDeviceSelect={handleDeviceClick}
                    onInitiatePrivateCall={handleInitiatePrivateCall}
                    isCallActive={!!privateCallTarget || (!!talkingUser.ms_code)}
                    talkingUser={talkingUser}
                  />
                )}
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Map - Right Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <Card className="h-full border-0 rounded-none">
              <CardHeader>
                {/* <CardTitle className="text-lg">Bản đồ thời gian thực</CardTitle> */}
                <CardTitle className="text-lg">
                  {selectedCombinedDevice
                    ? `Đang xem: ${selectedCombinedDevice.driver_name} (Phone: ${selectedCombinedDevice?.driver_phone_number})`
                    : "Click vào thiết bị để xem vị trí hiện tại"}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)]">
                <DynamicMap
                  devices={filteredDevices}
                  selectedDevice={selectedDevice}
                  onMarkerClick={handleMarkerClick}
                  center={mapCenter}
                  mapRef={setMap}
                />
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </WebRTCProvider>
    </div>
  )
}
