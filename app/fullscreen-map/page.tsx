"use client"

import { useState, useCallback } from "react"
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navigation, User, Phone, Video, Play, Pause, Volume2, VolumeX, X } from "lucide-react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import Link from "next/link"

const mapContainerStyle = {
  width: "100%",
  height: "600px",
}

const center = {
  lat: 21.0285,
  lng: 105.8542,
}

const mockVehicles = [
  {
    id: 1,
    plate: "29A-12345",
    lat: 21.0285,
    lng: 105.8542,
    status: "moving",
    driver: "Nguyễn Văn A",
    phone: "0901234567",
    speed: 45,
    lastUpdate: "2 phút trước",
    fuel: 75,
    temperature: 85,
    cameraStatus: "online",
    streamUrl: "stream1",
  },
  {
    id: 2,
    plate: "30B-67890",
    lat: 21.0245,
    lng: 105.8412,
    status: "stopped",
    driver: "Trần Văn B",
    phone: "0907654321",
    speed: 0,
    lastUpdate: "1 phút trước",
    fuel: 45,
    temperature: 78,
    cameraStatus: "online",
    streamUrl: "stream2",
  },
  {
    id: 3,
    plate: "31C-11111",
    lat: 21.0195,
    lng: 105.8352,
    status: "moving",
    driver: "Lê Văn C",
    phone: "0903456789",
    speed: 32,
    lastUpdate: "30 giây trước",
    fuel: 90,
    temperature: 82,
    cameraStatus: "offline",
    streamUrl: "stream3",
  },
  {
    id: 4,
    plate: "32D-22222",
    lat: 21.0335,
    lng: 105.8482,
    status: "parked",
    driver: "Phạm Văn D",
    phone: "0909876543",
    speed: 0,
    lastUpdate: "5 phút trước",
    fuel: 60,
    temperature: 75,
    cameraStatus: "online",
    streamUrl: "stream4",
  },
  {
    id: 5,
    plate: "33E-33333",
    lat: 21.0155,
    lng: 105.8622,
    status: "moving",
    driver: "Hoàng Văn E",
    phone: "0905555555",
    speed: 55,
    lastUpdate: "1 phút trước",
    fuel: 85,
    temperature: 88,
    cameraStatus: "online",
    streamUrl: "stream5",
  },
]

const getCarIcon = (status: string) => {
  const carSvg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(16,16)">
        <g transform="rotate(0)">
          <path d="M-12,-6 L-12,-2 L-8,-2 L-8,2 L-6,2 L-6,6 L6,6 L6,2 L8,2 L8,-2 L12,-2 L12,-6 Z" 
                fill="${status === "moving" ? "#22c55e" : status === "stopped" ? "#f59e0b" : "#6b7280"}" 
                stroke="#ffffff" 
                strokeWidth="1"/>
          <circle cx="-6" cy="4" r="2" fill="#333"/>
          <circle cx="6" cy="4" r="2" fill="#333"/>
          <rect x="-10" y="-4" width="20" height="6" fill="${status === "moving" ? "#16a34a" : status === "stopped" ? "#ea580c" : "#4b5563"}" rx="1"/>
        </g>
      </g>
    </svg>
  `

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(carSvg)}`,
    scaledSize: { width: 32, height: 32 },
    anchor: { x: 16, y: 16 },
  }
}

function LiveCameraGrid({
  vehicles,
  selectedVehicle,
  onVehicleSelect,
}: {
  vehicles: typeof mockVehicles
  selectedVehicle: (typeof mockVehicles)[0] | null
  onVehicleSelect: (vehicle: (typeof mockVehicles)[0]) => void
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
      {vehicles.map((vehicle) => (
        <Card
          key={vehicle.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedVehicle?.id === vehicle.id ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => onVehicleSelect(vehicle)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    vehicle.status === "moving"
                      ? "bg-green-500"
                      : vehicle.status === "stopped"
                        ? "bg-orange-500"
                        : "bg-gray-500"
                  }`}
                />
                <CardTitle className="text-sm">{vehicle.plate}</CardTitle>
              </div>
              <Badge variant={vehicle.cameraStatus === "online" ? "default" : "secondary"} className="text-xs">
                {vehicle.cameraStatus === "online" ? "LIVE" : "OFFLINE"}
              </Badge>
            </div>
            <CardDescription className="text-xs">{vehicle.driver}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3">
              {vehicle.cameraStatus === "online" ? (
                <>
                  {/* Mock live video feed */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900">
                    <div className="absolute inset-0 opacity-20">
                      <div className="w-full h-full bg-[url('/placeholder.svg?height=200&width=300&text=Live+Feed')] bg-cover bg-center"></div>
                    </div>
                    {playingStreams.has(vehicle.id) ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-xs font-mono bg-black/50 px-2 py-1 rounded">
                          🔴 LIVE - {vehicle.plate}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white/70 text-xs">Stream Paused</div>
                      </div>
                    )}
                  </div>

                  {/* Video controls */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePlay(vehicle.id)
                        }}
                      >
                        {playingStreams.has(vehicle.id) ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleMute(vehicle.id)
                        }}
                      >
                        {mutedStreams.has(vehicle.id) ? (
                          <VolumeX className="h-3 w-3" />
                        ) : (
                          <Volume2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <div className="text-white text-xs font-mono bg-black/50 px-1 rounded">{vehicle.speed} km/h</div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center text-gray-400">
                    <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-xs">Camera Offline</div>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle info */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tốc độ:</span>
                <span className="font-medium">{vehicle.speed} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nhiên liệu:</span>
                <span className="font-medium">{vehicle.fuel}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cập nhật:</span>
                <span className="font-medium">{vehicle.lastUpdate}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function FullscreenMapPage() {
  const [selectedVehicle, setSelectedVehicle] = useState<(typeof mockVehicles)[0] | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const filteredVehicles = mockVehicles.filter((vehicle) => vehicle.cameraStatus === "online")

  const onLoad = useCallback(() => {
    setMapLoaded(true)
  }, [])

  const handleMarkerClick = (vehicle: (typeof mockVehicles)[0]) => {
    setSelectedVehicle(vehicle)
  }

  const handleVehicleClick = (vehicle: (typeof mockVehicles)[0]) => {
    setSelectedVehicle(vehicle)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Theo dõi và giám sát - Chế độ toàn màn hình</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{mockVehicles.filter((v) => v.status === "moving").length} đang di chuyển</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span>{mockVehicles.filter((v) => v.cameraStatus === "online").length} camera online</span>
            </div>
          </div>
        </div>
        <Link href="/dashboard/map">
          <Button variant="outline" size="sm">
            <X className="h-4 w-4 mr-2" />
            Đóng
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-73px)]">
        {/* Live Camera Grid - Left Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <Card className="h-full border-0 rounded-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Camera trực tiếp</CardTitle>
              <CardDescription>
                {selectedVehicle ? `Đang xem: ${selectedVehicle.plate}` : "Tất cả camera đang hoạt động"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-100px)] overflow-y-auto">
              <LiveCameraGrid
                vehicles={filteredVehicles}
                selectedVehicle={selectedVehicle}
                onVehicleSelect={handleVehicleClick}
              />
            </CardContent>
          </Card>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Map - Right Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <Card className="h-full border-0 rounded-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Bản đồ thời gian thực</CardTitle>
              <CardDescription>
                {selectedVehicle
                  ? `Đang xem: ${selectedVehicle.plate} - ${selectedVehicle.driver}`
                  : "Click vào xe hoặc camera để xem chi tiết"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-100px)]">
              <LoadScript googleMapsApiKey="">
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={selectedVehicle ? { lat: selectedVehicle.lat, lng: selectedVehicle.lng } : center}
                  zoom={selectedVehicle ? 15 : 13}
                  onLoad={onLoad}
                  options={{
                    zoomControl: true,
                    streetViewControl: true,
                    mapTypeControl: true,
                    fullscreenControl: true,
                    mapTypeId: "roadmap",
                  }}
                >
                  {mapLoaded &&
                    mockVehicles.map((vehicle) => (
                      <Marker
                        key={vehicle.id}
                        position={{ lat: vehicle.lat, lng: vehicle.lng }}
                        icon={getCarIcon(vehicle.status)}
                        onClick={() => handleMarkerClick(vehicle)}
                        title={`${vehicle.plate} - ${vehicle.driver}`}
                      />
                    ))}
                  {selectedVehicle && (
                    <InfoWindow
                      position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
                      onCloseClick={() => setSelectedVehicle(null)}
                    >
                      <div className="p-3 min-w-[280px]">
                        <div className="font-semibold text-lg mb-3 flex items-center gap-2">
                          {selectedVehicle.plate}
                          <Badge
                            variant={
                              selectedVehicle.status === "moving"
                                ? "default"
                                : selectedVehicle.status === "stopped"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {selectedVehicle.status === "moving"
                              ? "Đang di chuyển"
                              : selectedVehicle.status === "stopped"
                                ? "Dừng"
                                : "Đỗ"}
                          </Badge>
                          <Badge
                            variant={selectedVehicle.cameraStatus === "online" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {selectedVehicle.cameraStatus === "online" ? "LIVE" : "OFFLINE"}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{selectedVehicle.driver}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-600" />
                            <span>{selectedVehicle.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-purple-600" />
                            <span>{selectedVehicle.speed} km/h</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-3 pt-2 border-t">
                            <div>
                              <div className="text-xs text-gray-500">Nhiên liệu</div>
                              <div className="font-semibold">{selectedVehicle.fuel}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Nhiệt độ</div>
                              <div className="font-semibold">{selectedVehicle.temperature}°C</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-3 pt-2 border-t">
                            Cập nhật: {selectedVehicle.lastUpdate}
                          </div>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            </CardContent>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
