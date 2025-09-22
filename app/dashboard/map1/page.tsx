"use client"
import Image from "next/image"

import { useState, useRef, useEffect } from "react"
import DynamicMap from "@/components/map/dynamic-map"
import L from 'leaflet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { MapPin, Phone, Maximize2, Video, Play, Pause, Volume2, VolumeX, RefreshCw, AlertCircle } from "lucide-react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { useMapData, MapDevice } from "@/hooks/use-map-data"
import { WebRTCVideoPlayer } from "@/components/webrtc-video-player"
import { WebRTCProvider } from "@/contexts/webrtc-provider"
import { toast } from "sonner"

const mapContainerStyle = {
  width: "100%",
  height: "600px",
}

const defaultCenter = {
  lat: 21.0285, // Default center - Hanoi
  lng: 105.8542,
}



function DeviceGrid({
  devices,
  selectedDevice,
  onDeviceSelect,
}: {
  devices: MapDevice[]
  selectedDevice: MapDevice | null
  onDeviceSelect: (device: MapDevice) => void
}) {
  const [playingDeviceIds, setPlayingDeviceIds] = useState(new Set<string | number>())

  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
      {devices.map((device) => (
        <Card
          key={device.id}
          className={`transition-all hover:shadow-md ${selectedDevice?.id === device.id ? "ring-2 ring-blue-500" : ""
            }`}
        >
          <CardHeader className="pb-2 cursor-pointer" onClick={() => onDeviceSelect(device)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${device.status === "online"
                      ? "bg-green-500"
                      : device.status === "no_gps"
                        ? "bg-orange-500"
                        : "bg-red-500"
                    }`}
                />
                <CardTitle className="text-sm">{device.imei}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Phone className="h-4 w-4 text-green-500" />
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
                  {device.status === "online" && device.latitude && device.longitude ? (
                    <div onClick={() => setPlayingDeviceIds(prev => new Set(prev).add(device.id))} className="cursor-pointer w-full h-full">
                      {device.thumbnail_url ? (
                        <img
                          src={device.thumbnail_url}
                          alt={`Thumbnail for ${device.imei}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-900 via-blue-900 to-gray-900 flex items-center justify-center">
                          <div className="text-center text-white">
                            <MapPin className="h-8 w-8 mx-auto mb-2" />
                            <div className="text-xs font-mono bg-black/50 px-2 py-1 rounded mb-1">
                              📍 GPS ACTIVE
                            </div>
                          </div>
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
                        <div className="text-xs">
                          {device.error ? device.error :
                            device.status === "no_gps" ? 'No GPS Signal' :
                              'Device Offline'}
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
  const { devices, loading, error, selectedDevice, setSelectedDevice } = useMapData()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [map, setMap] = useState<L.Map | null>(null)

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

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device?.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device?.plate_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || device.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Sử dụng mapCenter cố định đã được set 1 lần, fallback to default
  const mapCenter = fixedMapCenterRef.current || defaultCenter;

  const handleMarkerClick = (device: MapDevice) => {
    setSelectedDevice(device)
  }

  const handleDeviceClick = (device: MapDevice) => {
    setSelectedDevice(device)

    if (map && device.latitude && device.longitude) {
      map.panTo([device.latitude, device.longitude])
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
                <CardTitle className="text-lg">Danh sách thiết bị</CardTitle>
                <CardDescription>
                  {selectedDevice ? `Đang xem: ${selectedDevice.imei}` : "Click vào thiết bị hoặc marker để xem chi tiết"}
                </CardDescription>
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
                    selectedDevice={selectedDevice}
                    onDeviceSelect={handleDeviceClick}
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
                  {selectedDevice
                    ? `Đang xem: ${selectedDevice.imei} - ${selectedDevice?.plate_number || 'Chưa gắn xe'}`
                    : "Click vào thiết bị để xem vị trí GPS"}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)]">
                <DynamicMap
                  devices={filteredDevices}
                  selectedDevice={selectedDevice}
                  onMarkerClick={handleMarkerClick}
                  center={mapCenter}
                  mapRef={setMap}
                />

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
