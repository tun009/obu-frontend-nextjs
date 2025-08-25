"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api"
import { useGoogleMaps } from "@/components/providers/google-maps-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Play, Pause, SkipBack, SkipForward, Square, Volume2, VolumeX, ArrowLeft, Clock, Gauge, Battery, MapPin } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import journeySessionsAPI from "@/lib/services/journey-sessions-api"
import type { JourneySessionHistoryResponse, JourneySessionHistoryPoint } from "@/lib/types/api"
import Link from "next/link"
import { convertGpsCoordinates } from "@/lib/utils"

const mapContainerStyle = {
  width: "100%",
  height: "100%",
}

const defaultCenter = {
  lat: 21.0285,
  lng: 105.8542,
}

// Playback speed options
const PLAYBACK_SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 5, label: '5x' },
  { value: 10, label: '10x' },
  { value: 50, label: '50x' },
  { value: 100, label: '100x' },
]



const getCarIcon = (isActive: boolean) => {
  const carSvg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(16,16)">
        <circle cx="0" cy="0" r="10"
              fill="${isActive ? "#3b82f6" : "#6b7280"}"
              stroke="#ffffff"
              strokeWidth="2"/>
        <circle cx="0" cy="0" r="6" fill="#ffffff"/>
        <text x="0" y="2" text-anchor="middle" fill="${isActive ? "#3b82f6" : "#6b7280"}" font-size="6" font-weight="bold">CAR</text>
      </g>
    </svg>
  `

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(carSvg)}`,
    scaledSize: new window.google.maps.Size(32, 32),
    anchor: new window.google.maps.Point(16, 16),
  }
}

interface JourneyHistoryPageProps { }

export default function JourneyHistoryPage({ }: JourneyHistoryPageProps) {
  const params = useParams()
  const journeyId = parseInt(params.id as string)
  const { isLoaded } = useGoogleMaps()

  const [historyData, setHistoryData] = useState<JourneySessionHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // // Prevent body scroll when component mounts
  // useEffect(() => {
  //   document.body.style.overflow = 'hidden'
  //   return () => {
  //     document.body.style.overflow = 'unset'
  //   }
  // }, [])

  // Fetch journey history data
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        let response = await journeySessionsAPI.getJourneySessionHistory(journeyId)
        response.data = response.data.filter((item: JourneySessionHistoryPoint) => item.gps_valid === 1)
        setHistoryData(response)
      } catch (error: any) {
        toast.error('Không thể tải lịch sử hành trình')
        console.error('Error fetching history:', error)
      } finally {
        setLoading(false)
      }
    }

    if (journeyId) {
      fetchHistory()
    }
  }, [journeyId])

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && historyData?.data.length) {
      const timeToNext = getTimeToNextPoint()
      const adjustedTime = timeToNext / playbackSpeed

      intervalRef.current = setTimeout(() => {
        if (currentIndex < historyData.data.length - 1) {
          setCurrentIndex(prev => prev + 1)
        } else {
          setIsPlaying(false)
        }
      }, adjustedTime)
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
      }
    }
  }, [isPlaying, currentIndex, playbackSpeed, historyData])

  // Video control sync
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
      if(playbackSpeed <= 20) {
        videoRef.current.playbackRate = playbackSpeed
      }
      videoRef.current.muted = isMuted
    }
  }, [isPlaying, playbackSpeed, isMuted])

  const getTimeToNextPoint = () => {
    if (!historyData?.data || currentIndex >= historyData.data.length - 1) {
      return 1000
    }

    const current = new Date(historyData.data[currentIndex].collected_at)
    const next = new Date(historyData.data[currentIndex + 1].collected_at)
    return Math.max(next.getTime() - current.getTime(), 100)
  }

  const onLoad = useCallback((map: google.maps.Map) => {
    setMapLoaded(true)
    setMap(map)
  }, [])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }



  const handleProgressChange = (value: number[]) => {
    const newIndex = value[0]
    setCurrentIndex(newIndex)
    setIsPlaying(false)

    // Sync video time
    if (videoRef.current && historyData?.data) {
      const totalDuration = videoRef.current.duration
      const progress = newIndex / (historyData.data.length - 1)
      videoRef.current.currentTime = totalDuration * progress
    }
  }

  const handleLogClick = (index: number) => {
    setCurrentIndex(index)
    setIsPlaying(false)

    // Pan map to selected point
    if (map && historyData?.data[index]) {
      const point = historyData.data[index]
      const convertedCoords = convertGpsCoordinates({
        latitude: point.latitude,
        latitude_degree: point.latitude_degree,
        longitude: point.longitude,
        longitude_degree: point.longitude_degree
      })
      if (convertedCoords) {
        map.panTo(convertedCoords)
      }
    }
  }

  // Auto-scroll to active log item
  useEffect(() => {
    if (historyData?.data && historyData.data[currentIndex]) {
      const activeItemId = `log-item-${historyData.data[currentIndex].id}`
      const activeItem = document.getElementById(activeItemId)
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        })
      }
    }
  }, [currentIndex, historyData?.data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải lịch sử hành trình...</p>
        </div>
      </div>
    )
  }

  if (!historyData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Không tìm thấy dữ liệu hành trình</p>
          <Link href="/dashboard/journey-sessions">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentPoint = historyData.data[currentIndex]
  const pathCoordinates = historyData.data.slice(0, currentIndex + 1)
    .map(point => convertGpsCoordinates({
      latitude: point.latitude,
      latitude_degree: point.latitude_degree,
      longitude: point.longitude,
      longitude_degree: point.longitude_degree
    }))
    .filter(coords => coords !== undefined) as { lat: number; lng: number }[]

  return (
    <div className="h-[calc(100vh-115px)] flex flex-col overflow-scroll">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Video & Controls */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full flex flex-col overflow-hidden">
              {/* Video Player */}
              <div className="relative bg-black aspect-video flex-shrink-0">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  src="https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4"
                  loop
                />

                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Xe 29K-061.61</span>
                </div>

                <div className="absolute top-4 right-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-black/70 hover:bg-black/80 text-white border-none"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Video Controls */}
              <div className="p-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">
                    {currentIndex + 1} / {historyData.data.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Tốc độ:</span>
                    <Select
                      value={playbackSpeed.toString()}
                      onValueChange={(value) => setPlaybackSpeed(Number(value))}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAYBACK_SPEED_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Controls - Center aligned */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Button size="sm" variant="outline" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={handlePlayPause}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsPlaying(false)}>
                    <Square className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCurrentIndex(Math.min(historyData.data.length - 1, currentIndex + 1))}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {historyData.data[0] && format(new Date(historyData.data[0].collected_at), "dd/MM/yyyy HH:mm:ss", { locale: vi })}
                    </span>
                    <span>
                      {currentPoint && format(new Date(currentPoint.collected_at), "dd/MM/yyyy HH:mm:ss", { locale: vi })}
                    </span>
                    <span>
                      {historyData.data[historyData.data.length - 1] && format(new Date(historyData.data[historyData.data.length - 1].collected_at), "dd/MM/yyyy HH:mm:ss", { locale: vi })}
                    </span>
                  </div>
                  <Slider
                    value={[currentIndex]}
                    onValueChange={handleProgressChange}
                    max={historyData.data.length - 1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Journey Log */}
              <div className="flex-1 overflow-hidden">
                <Card className="h-full border-0 rounded-none flex flex-col">
                  <CardHeader className="py-3 flex-shrink-0">
                    <CardTitle className="text-base">Nhật ký di chuyển</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-4 pt-0">
                    <div className="space-y-2">
                      {historyData.data.map((point, index) => (
                        <div
                          key={point.id}
                          id={`log-item-${point.id}`}
                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${index === currentIndex
                              ? "bg-blue-50 border-blue-200 shadow-sm"
                              : "bg-white hover:bg-gray-50"
                            }`}
                          onClick={() => handleLogClick(index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${index === currentIndex ? "bg-blue-500" : "bg-gray-300"
                                }`} />
                              <div>
                                <div className="font-medium text-sm flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  {format(new Date(point.collected_at), "HH:mm:ss", { locale: vi })}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {(() => {
                                    const coords = convertGpsCoordinates({
                                      latitude: point.latitude,
                                      latitude_degree: point.latitude_degree,
                                      longitude: point.longitude,
                                      longitude_degree: point.longitude_degree
                                    })
                                    return coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : 'Invalid GPS'
                                  })()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="text-sm font-medium flex items-center justify-end gap-1">
                                <Gauge className="h-3 w-3 text-muted-foreground" />
                                {point.gps_speed.toFixed(1)} km/h
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                <Battery className="h-3 w-3" />
                                {point.bat_percent}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Map */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <Card className="h-full border-0 rounded-none flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-lg">Bản đồ hành trình</CardTitle>
                <CardDescription>
                  {currentPoint && (
                    <>
                      Vị trí hiện tại: {format(new Date(currentPoint.collected_at), "HH:mm:ss dd/MM/yyyy", { locale: vi })} -
                      Tốc độ: {currentPoint.gps_speed} km/h
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-4">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={currentPoint ? (convertGpsCoordinates({
                      latitude: currentPoint.latitude,
                      latitude_degree: currentPoint.latitude_degree,
                      longitude: currentPoint.longitude,
                      longitude_degree: currentPoint.longitude_degree
                    }) || defaultCenter) : defaultCenter}
                    zoom={15}
                    onLoad={onLoad}
                    options={{
                      zoomControl: true,
                      streetViewControl: true,
                      mapTypeControl: true,
                      fullscreenControl: true,
                      mapTypeId: "roadmap",
                    }}
                  >
                    {/* Journey Path */}
                    {pathCoordinates.length > 1 && (
                      <Polyline
                        path={pathCoordinates}
                        options={{
                          strokeColor: "#3b82f6",
                          strokeOpacity: 0.8,
                          strokeWeight: 4,
                        }}
                      />
                    )}

                    {/* Current Position Marker */}
                    {mapLoaded && currentPoint && (() => {
                      const convertedCoords = convertGpsCoordinates({
                        latitude: currentPoint.latitude,
                        latitude_degree: currentPoint.latitude_degree,
                        longitude: currentPoint.longitude,
                        longitude_degree: currentPoint.longitude_degree
                      });

                      return convertedCoords ? (
                        <Marker
                          position={convertedCoords}
                          icon={getCarIcon(true)}
                          title={`${historyData.plate_number} - ${format(new Date(currentPoint.collected_at), "HH:mm:ss", { locale: vi })}`}
                        />
                      ) : null;
                    })()}

                    {/* Start Point */}
                    {historyData.data.length > 0 && (() => {
                      const startCoords = convertGpsCoordinates({
                        latitude: historyData.data[0].latitude,
                        latitude_degree: historyData.data[0].latitude_degree,
                        longitude: historyData.data[0].longitude,
                        longitude_degree: historyData.data[0].longitude_degree
                      });

                      return startCoords ? (
                        <Marker
                          position={startCoords}
                        icon={{
                          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="8" fill="#22c55e" stroke="#ffffff" strokeWidth="2"/>
                              <text x="12" y="16" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="bold">S</text>
                            </svg>
                          `),
                          scaledSize: new window.google.maps.Size(24, 24),
                          anchor: new window.google.maps.Point(12, 12),
                        }}
                        title="Điểm bắt đầu"
                      />
                      ) : null;
                    })()}

                    {/* End Point */}
                    {historyData.data.length > 1 && (() => {
                      const endPoint = historyData.data[historyData.data.length - 1];
                      const endCoords = convertGpsCoordinates({
                        latitude: endPoint.latitude,
                        latitude_degree: endPoint.latitude_degree,
                        longitude: endPoint.longitude,
                        longitude_degree: endPoint.longitude_degree
                      });

                      return endCoords ? (
                        <Marker
                          position={endCoords}
                        icon={{
                          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2"/>
                              <text x="12" y="16" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="bold">E</text>
                            </svg>
                          `),
                          scaledSize: new window.google.maps.Size(24, 24),
                          anchor: new window.google.maps.Point(12, 12),
                        }}
                        title="Điểm kết thúc"
                      />
                      ) : null;
                    })()}
                  </GoogleMap>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>Đang tải bản đồ...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
