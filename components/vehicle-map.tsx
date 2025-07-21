"use client"

import { useState, useCallback } from "react"
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, User, Phone } from "lucide-react"

const mapContainerStyle = {
  width: "100%",
  height: "400px",
}

const center = {
  lat: 21.0285,
  lng: 105.8542, // Hà Nội center
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
  },
]

const getMarkerIcon = (status: string) => {
  const baseIcon = {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#ffffff",
    scale: 1.5,
    anchor: { x: 12, y: 24 },
  }

  switch (status) {
    case "moving":
      return { ...baseIcon, fillColor: "#22c55e" } // Green
    case "stopped":
      return { ...baseIcon, fillColor: "#f59e0b" } // Orange
    case "parked":
      return { ...baseIcon, fillColor: "#6b7280" } // Gray
    default:
      return { ...baseIcon, fillColor: "#ef4444" } // Red
  }
}

export function VehicleMap() {
  const [selectedVehicle, setSelectedVehicle] = useState<(typeof mockVehicles)[0] | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const onLoad = useCallback(() => {
    setMapLoaded(true)
  }, [])

  const handleMarkerClick = (vehicle: (typeof mockVehicles)[0]) => {
    setSelectedVehicle(vehicle)
  }

  const handleVehicleClick = (vehicle: (typeof mockVehicles)[0]) => {
    setSelectedVehicle(vehicle)
    // Optional: Pan to vehicle location
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bản đồ theo dõi xe</CardTitle>
        <CardDescription>Vị trí thời gian thực của các xe trong hệ thống</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Google Map */}
          <div className="md:col-span-2">
            {/* NOTE: avoid inlining environment variables in client bundle.
                 If you must, move the key to a server component and pass it via prop. */}
            <LoadScript googleMapsApiKey="">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={13}
                onLoad={onLoad}
                options={{
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true,
                }}
              >
                {mapLoaded &&
                  mockVehicles.map((vehicle) => (
                    <Marker
                      key={vehicle.id}
                      position={{ lat: vehicle.lat, lng: vehicle.lng }}
                      icon={getMarkerIcon(vehicle.status)}
                      onClick={() => handleMarkerClick(vehicle)}
                      title={`${vehicle.plate} - ${vehicle.driver}`}
                    />
                  ))}

                {selectedVehicle && (
                  <InfoWindow
                    position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
                    onCloseClick={() => setSelectedVehicle(null)}
                  >
                    <div className="p-2 min-w-[200px]">
                      <div className="font-semibold text-lg mb-2">{selectedVehicle.plate}</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>{selectedVehicle.driver}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{selectedVehicle.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Navigation className="h-3 w-3" />
                          <span>{selectedVehicle.speed} km/h</span>
                        </div>
                        <div className="flex items-center gap-2">
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
                        <div className="text-xs text-gray-500 mt-2">Cập nhật: {selectedVehicle.lastUpdate}</div>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </LoadScript>
          </div>

          {/* Vehicle List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Danh sách xe ({mockVehicles.length})</h4>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full" title="Đang di chuyển"></div>
                <div className="w-3 h-3 bg-orange-500 rounded-full" title="Dừng"></div>
                <div className="w-3 h-3 bg-gray-500 rounded-full" title="Đỗ"></div>
              </div>
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-2">
              {mockVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedVehicle?.id === vehicle.id ? "bg-blue-50 border-blue-200" : ""
                  }`}
                  onClick={() => handleVehicleClick(vehicle)}
                >
                  <div className="flex items-center gap-3">
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
                      <p className="text-xs text-muted-foreground">{vehicle.speed} km/h</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        vehicle.status === "moving" ? "default" : vehicle.status === "stopped" ? "secondary" : "outline"
                      }
                      className="text-xs"
                    >
                      {vehicle.status === "moving" ? "Di chuyển" : vehicle.status === "stopped" ? "Dừng" : "Đỗ"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{vehicle.lastUpdate}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t">
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                <MapPin className="h-4 w-4 mr-2" />
                Xem toàn bộ bản đồ
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
