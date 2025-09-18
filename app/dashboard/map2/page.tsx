"use client"
import Image from "next/image"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api"
import { useGoogleMaps } from "@/components/providers/google-maps-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, User, Phone, RefreshCw, Mic, MicOff, Video } from "lucide-react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { useMapData, MapDevice } from "@/hooks/use-map-data"
import { usePocCall } from "@/hooks/use-poc-call"
import { WebRTCVideoPlayer } from "@/components/webrtc-video-player"
import { WebRTCProvider } from "@/contexts/webrtc-provider"




const defaultCenter = {
  lat: 21.0285, // Default center - Hanoi
  lng: 105.8542,
}

const getCarIcon = (status: string) => {
  const carSvg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(16,16)">
        <g transform="rotate(0)">
          <circle cx="0" cy="0" r="8"
                fill="${status === "online" ? "#22c55e" : status === "no_gps" ? "#f59e0b" : "#ef4444"}"
                stroke="#ffffff"
                strokeWidth="2"/>
          <circle cx="0" cy="0" r="4" fill="#ffffff"/>
          <text x="0" y="2" text-anchor="middle" fill="${status === "online" ? "#22c55e" : status === "no_gps" ? "#f59e0b" : "#ef4444"}" font-size="8" font-weight="bold">GPS</text>
        </g>
      </g>
    </svg>
  `

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(carSvg)}`,
    scaledSize: new window.google.maps.Size(32, 32),
    anchor: new window.google.maps.Point(16, 16),
  }
}

function DeviceGrid({
  devices,
  selectedDevice,
  onDeviceSelect,
  onCreateTempGroup,
}: {
  devices: (MapDevice & { online: boolean })[]
  selectedDevice: (MapDevice & { online: boolean }) | null
  onDeviceSelect: (device: MapDevice & { online: boolean }) => void
  onCreateTempGroup: (device: MapDevice & { online: boolean }) => void
}) {
  const [playingDeviceIds, setPlayingDeviceIds] = useState(new Set<string | number>())

  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
      {devices.map((device) => (
        <Card
          key={device.id}
           onClick={() => onDeviceSelect(device)}
          className={`transition-all hover:shadow-md ${
            selectedDevice?.id === device.id ? "ring-2 ring-blue-500" : ""
          }`}
        >
          <CardHeader className="pb-2 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    device.online
                      ? "bg-green-500"
                      : device.status === "no_gps"
                        ? "bg-orange-500"
                        : "bg-red-500"
                  }`}
                />
                <CardTitle className="text-sm">{device.imei}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click event
                  onCreateTempGroup(device);
                }}
                disabled={!device.online}
                title={device.online ? "Tạo nhóm tạm" : "Thiết bị offline"}
              >
                <Phone className={`h-4 w-4 ${device.online ? 'text-green-500' : 'text-gray-400'}`} />
              </Button>
            </div>
            <CardDescription className="text-xs">{device?.plate_number || 'Chưa gắn xe'}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3 group">
              {playingDeviceIds.has(device.id) ? (
                <WebRTCVideoPlayer
                  deviceId={device.imei}
                  deviceName={device.plate_number || device.imei}
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
                          src={device.thumbnail_url}
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function MapPage() {
  const { devices, loading, selectedDevice, setSelectedDevice } = useMapData();
  const { members: callMembers, handleCreateTempGroupForRow, isReady: isCallReady, handleStartTalk, handleStopTalk, talkingUser, profile, isOnline } = usePocCall();
  const { isLoaded } = useGoogleMaps()
  const [mapLoaded, setMapLoaded] = useState(false)
  const [searchTerm] = useState("") // We don't have a search input yet
  const [statusFilter] = useState("all") // We don't have a status filter UI yet
  const [map, setMap] = useState<google.maps.Map | null>(null)

  // Ref để lưu mapCenter cố định - chỉ set 1 lần duy nhất
  const fixedMapCenterRef = useRef<{lat: number, lng: number} | null>(null)

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
      (device?.plate_number || '').toLowerCase().includes(searchTerm.toLowerCase())
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

  const onLoad = useCallback((map: google.maps.Map) => {
    setMapLoaded(true)
    setMap(map)
  }, [])

  const handleMarkerClick = (device: MapDevice & { online: boolean }) => {
    // We still set the original device type in the state
    setSelectedDevice(devices.find(d => d.id === device.id) || null);
  }

  const handleDeviceClick = (device: MapDevice & { online: boolean }) => {
    // We still set the original device type in the state
    setSelectedDevice(devices.find(d => d.id === device.id) || null);

    if (map && device.latitude && device.longitude) {
      map.panTo({ lat: device.latitude, lng: device.longitude })
      map.setZoom(15)
    }
  }

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
      {/* Main Content with Resizable Layout */}
      <WebRTCProvider>
        <ResizablePanelGroup id="main-content" direction="horizontal" className="rounded-lg border min-h-[800px]">
        {/* Live Camera Grid - Left Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <Card className="h-full border-0 rounded-none">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Điều khiển giao tiếp</CardTitle>
                        <CardDescription className="text-xs mt-1 h-4">
                            {talkingUser.ms_code
                                ? <Badge variant="destructive" className="animate-pulse">
                                    {(!profile || talkingUser.ms_code === profile.ms_code) ? "Bạn đang nói..." : `${talkingUser.ms_name} đang nói...`}
                                  </Badge>
                                : <span>Nhấn để nói vào nhóm hiện tại</span>
                            }
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="default"
                            onClick={handleStartTalk}
                            disabled={!isCallReady || !!talkingUser.ms_code || !isOnline}
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
                            disabled={!isCallReady || !profile || talkingUser.ms_code !== profile.ms_code || !isOnline}
                            title="Dừng nói"
                        >
                            <MicOff className="h-4 w-4 mr-2" />
                            Dừng
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[calc(100vh - 120px)] overflow-y-auto">
              {filteredDevices.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Không có thiết bị nào</p>
                  </div>
                </div>
              ) : (
                <DeviceGrid
                  devices={filteredDevices}
                  selectedDevice={selectedCombinedDevice}
                  onDeviceSelect={handleDeviceClick}
                  onCreateTempGroup={handleCreateTempGroupForRow}
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
              <CardTitle className="text-lg">Bản đồ thời gian thực</CardTitle>
              <CardDescription>
                {selectedCombinedDevice
                  ? `Đang xem: ${selectedCombinedDevice.imei} - ${selectedCombinedDevice?.plate_number || 'Chưa gắn xe'}`
                  : "Click vào thiết bị để xem vị trí GPS"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)]">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={mapCenter}
                  zoom={13}
                  onLoad={onLoad}
                  options={{
                    zoomControl: true,
                    streetViewControl: true,
                    mapTypeControl: true,
                    fullscreenControl: true,
                    mapTypeId: "roadmap",
                  }}
                >
                  {/* Hiển thị tất cả devices có GPS data */}
                  {mapLoaded &&
                    filteredDevices
                      .filter((device: MapDevice & { online: boolean }) => device.latitude && device.longitude)
                      .map((device: MapDevice & { online: boolean }) => (
                        <Marker
                          key={device.id}
                          position={{ lat: device.latitude!, lng: device.longitude! }}
                          icon={getCarIcon(device.status)}
                          onClick={() => handleMarkerClick(device)}
                          title={`${device.imei} - ${device?.plate_number || 'Chưa gắn xe'}`}
                        />
                      ))}

                  {/* InfoWindow cho selected device với WebRTC Video */}
                  {selectedCombinedDevice && selectedCombinedDevice.latitude && selectedCombinedDevice.longitude && (
                    <InfoWindow
                      position={{ lat: selectedCombinedDevice.latitude, lng: selectedCombinedDevice.longitude }}
                      onCloseClick={() => setSelectedDevice(null)}
                      options={{
                        maxWidth: 400,
                        pixelOffset: new window.google.maps.Size(0, -10)
                      }}
                    >
                      <div className="p-3 min-w-[350px]">
                        {/* Header */}
                        <div className="font-semibold text-lg mb-3 flex items-center gap-2">
                          {selectedCombinedDevice.imei}
                          <Badge
                            variant={
                              selectedCombinedDevice.status === "online"
                                ? "success"
                                : selectedCombinedDevice.status === "no_gps"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {selectedCombinedDevice.status === "online"
                              ? "Online"
                              : selectedCombinedDevice.status === "no_gps"
                                ? "No GPS"
                                : "Offline"}
                          </Badge>
                        </div>

                        {/* Device Info */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">IMEI: {selectedCombinedDevice.imei}</span>
                          </div>
                          {selectedCombinedDevice?.plate_number && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-green-600" />
                              <span>Xe: {selectedCombinedDevice.plate_number}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-purple-600" />
                            <span>Tốc độ: {selectedCombinedDevice.speed || 0} km/h</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-orange-600" />
                            <span className="font-mono text-xs">
                              {selectedCombinedDevice.latitude?.toFixed(6)}, {selectedCombinedDevice.longitude?.toFixed(6)}
                            </span>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-4 mt-3 pt-2 border-t">
                            {selectedCombinedDevice.battery_percent !== undefined && (
                              <div>
                                <div className="text-xs text-gray-500">Pin</div>
                                <div className="font-semibold">{selectedCombinedDevice.battery_percent}%</div>
                              </div>
                            )}
                            {selectedCombinedDevice.temperature !== undefined && (
                              <div>
                                <div className="text-xs text-gray-500">Nhiệt độ</div>
                                <div className="font-semibold">{selectedCombinedDevice.temperature}°C</div>
                              </div>
                            )}
                          </div>

                          {selectedCombinedDevice.error && (
                            <div className="text-xs text-red-500 mt-2 pt-2 border-t">
                              Lỗi: {selectedCombinedDevice.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                    <p>Loading Google Maps...</p>
                  </div>
                </div>
              )}

              {/* Overlay message khi chưa có GPS data */}
              {/* {filteredDevices.filter(d => d.latitude && d.longitude).length === 0 && (
                <div className="absolute inset-4 flex items-center justify-center bg-white/90 rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Chưa có thiết bị nào có dữ liệu GPS</p>
                    <p className="text-sm mt-2">Click vào thiết bị bên trái để tải dữ liệu GPS</p>
                  </div>
                </div>
              )} */}
            </CardContent>
          </Card>
        </ResizablePanel>
        </ResizablePanelGroup>
      </WebRTCProvider>
    </div>
  )
}
