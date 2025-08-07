"use client"

import { useState, useCallback } from "react"
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api"
import { useGoogleMaps } from "@/components/providers/google-maps-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, User, Phone, Maximize2, Video, Play, Pause, Volume2, VolumeX, RefreshCw, AlertCircle } from "lucide-react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { useMapData, MapDevice } from "@/hooks/use-map-data"
import { WebRTCVideoPlayer } from "@/components/webrtc-video-player"
import { toast } from "sonner"

const mapContainerStyle = {
  width: "100%",
  height: "600px",
}

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
}: {
  devices: MapDevice[]
  selectedDevice: MapDevice | null
  onDeviceSelect: (device: MapDevice) => void
}) {
  const [mutedStreams, setMutedStreams] = useState<Set<number>>(new Set())
  const [playingStreams, setPlayingStreams] = useState<Set<number>>(new Set([1, 2, 4, 5]))

  const toggleMute = (vehicleId: number) => {
    const newMuted = new Set(mutedStreams)
    if (newMuted.has(vehicleId)) {
      newMuted.delete(vehicleId)
    } else {
      newMuted.add(vehicleId)
    }
    setMutedStreams(newMuted)
  }

  const togglePlay = (vehicleId: number) => {
    const newPlaying = new Set(playingStreams)
    if (newPlaying.has(vehicleId)) {
      newPlaying.delete(vehicleId)
    } else {
      newPlaying.add(vehicleId)
    }
    setPlayingStreams(newPlaying)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {devices.map((device) => (
        <Card
          key={device.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedDevice?.id === device.id ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => onDeviceSelect(device)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    device.status === "online"
                      ? "bg-green-500"
                      : device.status === "no_gps"
                        ? "bg-orange-500"
                        : "bg-red-500"
                  }`}
                />
                <CardTitle className="text-sm">{device.imei}</CardTitle>
              </div>
              <Badge variant={device.status === "online" ? "default" : "secondary"} className="text-xs">
                {device.status === "online" ? "GPS" : device.status === "no_gps" ? "NO GPS" : "OFFLINE"}
              </Badge>
            </div>
            <CardDescription className="text-xs">{device.vehicle?.plate_number || 'Chưa gắn xe'}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3">
              {device.status === "online" && device.latitude && device.longitude ? (
                <>
                  {/* GPS Location Display */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-blue-900 to-gray-900">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <MapPin className="h-8 w-8 mx-auto mb-2" />
                        <div className="text-xs font-mono bg-black/50 px-2 py-1 rounded mb-1">
                          📍 GPS ACTIVE
                        </div>
                        <div className="text-xs">
                          {device.latitude?.toFixed(6)}, {device.longitude?.toFixed(6)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Device info overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <div className="text-white text-xs font-mono bg-black/50 px-1 rounded">
                      {device.speed || 0} km/h
                    </div>
                    <div className="text-white text-xs font-mono bg-black/50 px-1 rounded">
                      {device.battery_percent || 0}%
                    </div>
                  </div>
                </>
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
            </div>

            {/* Device info */}
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
  const { devices, loading, error, refreshData, selectedDevice, setSelectedDevice } = useMapData()
  const { isLoaded } = useGoogleMaps()
  const [mapLoaded, setMapLoaded] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.vehicle?.plate_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || device.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate map center - use first device with GPS, fallback to default
  const mapCenter = (() => {
    const firstDeviceWithGPS = filteredDevices.find(device =>
      device.latitude !== undefined && device.longitude !== undefined
    );

    if (firstDeviceWithGPS) {
      return {
        lat: firstDeviceWithGPS.latitude!,
        lng: firstDeviceWithGPS.longitude!
      };
    }

    return defaultCenter;
  })()

  const onLoad = useCallback((map: google.maps.Map) => {
    setMapLoaded(true)
    setMap(map)
  }, [])

  const handleMarkerClick = (device: MapDevice) => {
    setSelectedDevice(device)
  }

  const handleDeviceClick = (device: MapDevice) => {
    // Select the device to show InfoWindow
    setSelectedDevice(device)

    // Center map to device location
    if (map && device.latitude && device.longitude) {
      map.panTo({ lat: device.latitude, lng: device.longitude })
      map.setZoom(15)
    } 
  }

  const handleRefresh = async () => {
    toast.promise(refreshData(), {
      loading: 'Đang tải danh sách thiết bị...',
      success: 'Danh sách thiết bị đã được cập nhật',
      error: 'Lỗi khi tải danh sách thiết bị'
    })
  }

  // No auto-centering - only center when user clicks device

  const toggleFullscreen = () => {
    window.open("/fullscreen-map", "_blank")
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Theo dõi thiết bị OBU</h1>
          <p className="text-muted-foreground">Click vào thiết bị để tải dữ liệu GPS và hiển thị vị trí trên bản đồ</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button variant="outline" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4 mr-2" />
            Mở toàn màn hình
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thiết bị</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPS Online</CardTitle>
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {devices.filter((d) => d.status === "online").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No GPS</CardTitle>
            <div className="w-3 h-3 bg-orange-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {devices.filter((d) => d.status === "no_gps").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <div className="w-3 h-3 bg-red-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {devices.filter((d) => d.status === "offline").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Có GPS Data</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {devices.filter((d) => d.latitude && d.longitude).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Resizable Layout */}
      <ResizablePanelGroup id="main-content" direction="horizontal" className="rounded-lg border min-h-[600px]">
        {/* Live Camera Grid - Left Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <Card className="h-full border-0 rounded-none">
            <CardHeader>
              <CardTitle className="text-lg">Danh sách thiết bị</CardTitle>
              <CardDescription>
                {selectedDevice ? `Đang xem: ${selectedDevice.imei}` : "Click vào thiết bị hoặc marker để xem chi tiết"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)] overflow-y-auto">
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
                  ? `Đang xem: ${selectedDevice.imei} - ${selectedDevice.vehicle?.plate_number || 'Chưa gắn xe'}`
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
                      .filter(device => device.latitude && device.longitude)
                      .map((device) => (
                        <Marker
                          key={device.id}
                          position={{ lat: device.latitude!, lng: device.longitude! }}
                          icon={getCarIcon(device.status)}
                          onClick={() => handleMarkerClick(device)}
                          title={`${device.imei} - ${device.vehicle?.plate_number || 'Chưa gắn xe'}`}
                        />
                      ))}

                  {/* InfoWindow cho selected device với WebRTC Video */}
                  {selectedDevice && selectedDevice.latitude && selectedDevice.longitude && (
                    <InfoWindow
                      position={{ lat: selectedDevice.latitude, lng: selectedDevice.longitude }}
                      onCloseClick={() => setSelectedDevice(null)}
                      options={{
                        maxWidth: 400,
                        pixelOffset: new window.google.maps.Size(0, -10)
                      }}
                    >
                      <div className="p-3 min-w-[350px]">
                        {/* Header */}
                        <div className="font-semibold text-lg mb-3 flex items-center gap-2">
                          {selectedDevice.imei}
                          <Badge
                            variant={
                              selectedDevice.status === "online"
                                ? "default"
                                : selectedDevice.status === "no_gps"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {selectedDevice.status === "online"
                              ? "GPS Online"
                              : selectedDevice.status === "no_gps"
                                ? "No GPS"
                                : "Offline"}
                          </Badge>
                        </div>

                        {/* WebRTC Video Player */}
                        <div className="mb-4">
                          <WebRTCVideoPlayer
                            deviceId={selectedDevice.imei}
                            deviceName={selectedDevice.vehicle?.plate_number || selectedDevice.imei}
                            className="w-full h-48"
                            onStreamStart={() => console.log('Stream started for', selectedDevice.imei)}
                            onStreamStop={() => console.log('Stream stopped for', selectedDevice.imei)}
                          />
                        </div>

                        {/* Device Info */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">IMEI: {selectedDevice.imei}</span>
                          </div>
                          {selectedDevice.vehicle?.plate_number && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-green-600" />
                              <span>Xe: {selectedDevice.vehicle.plate_number}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-purple-600" />
                            <span>Tốc độ: {selectedDevice.speed || 0} km/h</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-orange-600" />
                            <span className="font-mono text-xs">
                              {selectedDevice.latitude?.toFixed(6)}, {selectedDevice.longitude?.toFixed(6)}
                            </span>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-4 mt-3 pt-2 border-t">
                            {selectedDevice.battery_percent !== undefined && (
                              <div>
                                <div className="text-xs text-gray-500">Pin</div>
                                <div className="font-semibold">{selectedDevice.battery_percent}%</div>
                              </div>
                            )}
                            {selectedDevice.temperature !== undefined && (
                              <div>
                                <div className="text-xs text-gray-500">Nhiệt độ</div>
                                <div className="font-semibold">{selectedDevice.temperature}°C</div>
                              </div>
                            )}
                          </div>

                          {selectedDevice.error && (
                            <div className="text-xs text-red-500 mt-2 pt-2 border-t">
                              Lỗi: {selectedDevice.error}
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
    </div>
  )
}
