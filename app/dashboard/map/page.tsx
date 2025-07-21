"use client"

import { useState, useCallback } from "react"
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Navigation, User, Phone, Search, Maximize2 } from "lucide-react"

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
  },
]

const getMarkerIcon = (status: string) => {
  const baseIcon = {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#ffffff",
    scale: 1.8,
    anchor: { x: 12, y: 24 },
  }

  switch (status) {
    case "moving":
      return { ...baseIcon, fillColor: "#22c55e" }
    case "stopped":
      return { ...baseIcon, fillColor: "#f59e0b" }
    case "parked":
      return { ...baseIcon, fillColor: "#6b7280" }
    default:
      return { ...baseIcon, fillColor: "#ef4444" }
  }
}

export default function MapPage() {
  const [selectedVehicle, setSelectedVehicle] = useState<(typeof mockVehicles)[0] | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredVehicles = mockVehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const onLoad = useCallback(() => {
    setMapLoaded(true)
  }, [])

  const handleMarkerClick = (vehicle: (typeof mockVehicles)[0]) => {
    setSelectedVehicle(vehicle)
  }

  const handleVehicleClick = (vehicle: (typeof mockVehicles)[0]) => {
    setSelectedVehicle(vehicle)
  }

  const centerMapOnVehicle = (vehicle: (typeof mockVehicles)[0]) => {
    setSelectedVehicle(vehicle)
    // In a real implementation, you would use map.panTo() here
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bản đồ theo dõi</h1>
          <p className="text-muted-foreground">Theo dõi vị trí thời gian thực của tất cả xe trong hệ thống</p>
        </div>
        <Button variant="outline">
          <Maximize2 className="h-4 w-4 mr-2" />
          Toàn màn hình
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng xe</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockVehicles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang di chuyển</CardTitle>
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockVehicles.filter((v) => v.status === "moving").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang dừng</CardTitle>
            <div className="w-3 h-3 bg-orange-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {mockVehicles.filter((v) => v.status === "stopped").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang đỗ</CardTitle>
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {mockVehicles.filter((v) => v.status === "parked").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Vehicle List Sidebar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Danh sách xe</CardTitle>
            <CardDescription>Click để xem vị trí trên bản đồ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm xe, tài xế..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lọc theo trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="moving">Đang di chuyển</SelectItem>
                    <SelectItem value="stopped">Đang dừng</SelectItem>
                    <SelectItem value="parked">Đang đỗ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle List */}
              <div className="max-h-[500px] overflow-y-auto space-y-2">
                {filteredVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                      selectedVehicle?.id === vehicle.id ? "bg-blue-50 border-blue-200 shadow-sm" : ""
                    }`}
                    onClick={() => handleVehicleClick(vehicle)}
                  >
                    <div className="flex items-start justify-between">
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
                        <div>
                          <p className="font-medium text-sm">{vehicle.plate}</p>
                          <p className="text-xs text-muted-foreground">{vehicle.driver}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          centerMapOnVehicle(vehicle)
                        }}
                      >
                        <MapPin className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Tốc độ:</span>
                        <span className="font-medium">{vehicle.speed} km/h</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Nhiên liệu:</span>
                        <span className="font-medium">{vehicle.fuel}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{vehicle.lastUpdate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Bản đồ thời gian thực</CardTitle>
            <CardDescription>
              {selectedVehicle
                ? `Đang xem: ${selectedVehicle.plate} - ${selectedVehicle.driver}`
                : "Click vào marker hoặc danh sách xe để xem chi tiết"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Providing blank string prevents exposing env vars in client bundle.
            Pass key through a server component/server action if required. */}
            <LoadScript googleMapsApiKey="">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
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
                  filteredVehicles.map((vehicle) => (
                    <Marker
                      key={vehicle.id}
                      position={{ lat: vehicle.lat, lng: vehicle.lng }}
                      icon={getMarkerIcon(vehicle.status)}
                      onClick={() => handleMarkerClick(vehicle)}
                      title={`${vehicle.plate} - ${vehicle.driver}`}
                      animation={vehicle.status === "moving" ? 2 : undefined} // BOUNCE animation for moving vehicles
                    />
                  ))}

                {selectedVehicle && (
                  <InfoWindow
                    position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
                    onCloseClick={() => setSelectedVehicle(null)}
                  >
                    <div className="p-3 min-w-[250px]">
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
      </div>
    </div>
  )
}
