"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useParams } from "next/navigation"


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import DynamicMap from "@/components/map/dynamic-map";
import { convertGpsCoordinates } from "@/lib/utils"
import { getMediaUrl } from "@/lib/app-config"

// Define the type for a playlist item from our new API
interface PlaylistItem {
  id: number;
  file_url: string;
  thumbnail_url: string;
  size: number;
  orig_name: string;
  file_ext: string;
  media_type: number;
  media_codec: string;
  media_width: number;
  media_height: number;
  media_fps: number;
  media_duration: number;
  uploaded_at: string;
  taken_at: string; // This is the start time of the video
  created_on_device_id: number;
  belongs_to_department_id: number;
  created_by_staff_id: number;
  device_no: string;
  status: string;
  note: string | null;
  alarm_flag: number;
  created_at: string;
  keywords: string | null;
  crypto: number;
  created_by_staff_fullname: string;
  belongs_to_department_name: string;
}



const PLAYBACK_SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 5, label: '5x' },
  { value: 10, label: '10x' },
];



export default function JourneyHistoryPage() {
  const params = useParams()
  const journeyId = parseInt(params.id as string)
  // Data states
  const [historyData, setHistoryData] = useState<JourneySessionHistoryResponse | null>(null)
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([])
  const [loading, setLoading] = useState(true)

  // Player states
  const [activeVideo, setActiveVideo] = useState<PlaylistItem | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [globalTime, setGlobalTime] = useState(0) // in seconds, represents time from the start of the whole journey

  // Map and Log states
  const [currentGpsIndex, setCurrentGpsIndex] = useState(0)
  const [map, setMap] = useState<any>(null);
  

  const videoRef = useRef<HTMLVideoElement>(null)

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      if (!journeyId) return
      try {
        setLoading(true)
        const [historyResponse, playlistResponse] = await Promise.all([
          journeySessionsAPI.getJourneySessionHistory(journeyId),
          journeySessionsAPI.getJourneyPlaylist(journeyId)
        ])

        // const validHistory = historyResponse.data.filter((item: JourneySessionHistoryPoint) => item.gps_valid === 1)
        const validHistory = historyResponse.data
        setHistoryData({ ...historyResponse, data: validHistory })
        setPlaylist(playlistResponse)

      } catch (error: any) {
        toast.error('Không thể tải dữ liệu hành trình hoặc video.')
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [journeyId])

  // --- MEMOIZED CALCULATIONS ---
  const { totalDuration, journeyStartTimeMs } = useMemo(() => {
    if (!historyData?.data || historyData.data.length === 0) {
      return { totalDuration: 0, journeyStartTimeMs: 0 };
    }

    const journeyStart = new Date(historyData.data[0].collected_at).getTime();

    // If there's a playlist, duration is based on video lengths
    if (playlist.length > 0) {
      const accumulatedDuration = playlist.reduce((acc, item) => acc + item.media_duration, 0);
      return { totalDuration: accumulatedDuration, journeyStartTimeMs: journeyStart };
    }

    // If no playlist, duration is based on GPS history
    const journeyEnd = new Date(historyData.data[historyData.data.length - 1].collected_at).getTime();
    const historyDuration = (journeyEnd - journeyStart) / 1000; // in seconds
    return { totalDuration: historyDuration > 0 ? historyDuration : 0, journeyStartTimeMs: journeyStart };

  }, [playlist, historyData]);

  // --- PLAYER LOGIC ---

  // Find the active video based on globalTime
  useEffect(() => {
    if (!journeyStartTimeMs || !playlist.length) return;

    const currentJourneyTimeMs = journeyStartTimeMs + (globalTime * 1000);

    const foundVideo = playlist.find(video => {
      const videoStartTimeMs = new Date(video.taken_at).getTime();
      const videoEndTimeMs = videoStartTimeMs + (video.media_duration * 1000);
      return currentJourneyTimeMs >= videoStartTimeMs && currentJourneyTimeMs < videoEndTimeMs;
    });
    console.log(foundVideo, 'foundVideo');
    setActiveVideo(foundVideo || null);

  }, [globalTime, playlist, journeyStartTimeMs]);

  // Effect to control video element properties (play, pause, speed, mute, and seeking)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = playbackSpeed;
    video.muted = isMuted;

    if (activeVideo) {
      // If the video source is not the active one, change it
      const proxyUrl = getMediaUrl(activeVideo.file_url);
      if (video.src !== proxyUrl) {
        video.src = proxyUrl;
      }

      // Calculate the correct time within the current video file
      const videoStartTimeMs = new Date(activeVideo.taken_at).getTime();
      const currentJourneyTimeMs = journeyStartTimeMs + (globalTime * 1000);
      const timeInVideo = (currentJourneyTimeMs - videoStartTimeMs) / 1000;

      // Seek to the correct time, accounting for potential load delays
      const seekVideo = () => {
        if (Math.abs(video.currentTime - timeInVideo) > 1) { // Only seek if the difference is significant
          video.currentTime = timeInVideo;
        }
      }

      if (video.readyState >= 2) { // HAVE_CURRENT_DATA - ready to play
        seekVideo();
      } else {
        video.addEventListener('loadeddata', seekVideo, { once: true });
      }

      if (isPlaying) {
        video.play().catch(e => console.error("Play error:", e));
      } else {
        video.pause();



      }
    } else {
      // If no active video, pause and clear the source
      video.pause();
      if (video.src) {
        video.src = "";
      }
    }
  }, [isPlaying, playbackSpeed, isMuted, activeVideo, globalTime, journeyStartTimeMs]);

  useEffect(() => {
    if (isPlaying && totalDuration > 0) {
      const interval = setInterval(() => {
        setGlobalTime(prevTime => {
          const newTime = prevTime + (1 * playbackSpeed);
          if (newTime >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, playlist, totalDuration, playbackSpeed]);


  const handlePlayPause = () => setIsPlaying(!isPlaying);



  const handleSliderChange = (value: number[]) => {
    const newGlobalTime = value[0];
    setGlobalTime(newGlobalTime);
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (!historyData?.data.length || !journeyStartTimeMs) return

    const currentElapsedTimeMs = globalTime * 1000
    const targetTimeMs = journeyStartTimeMs + currentElapsedTimeMs

    const closestGpsIndex = historyData.data.reduce((closest, point, index) => {
      const pointTime = new Date(point.collected_at).getTime()
      const closestTime = new Date(historyData.data[closest].collected_at).getTime()
      return Math.abs(pointTime - targetTimeMs) < Math.abs(closestTime - targetTimeMs) ? index : closest
    }, 0)

    setCurrentGpsIndex(closestGpsIndex)
  }, [globalTime, historyData, journeyStartTimeMs])

  const handleLogClick = (index: number) => {
    if (!historyData?.data.length || !journeyStartTimeMs) return

    const pointTimeMs = new Date(historyData.data[index].collected_at).getTime()
    const newGlobalTime = (pointTimeMs - journeyStartTimeMs) / 1000
    handleSliderChange([Math.max(0, newGlobalTime)])

    if (map && historyData?.data[index]) {
      const point = historyData.data[index]
      const convertedCoords = convertGpsCoordinates(point)
      if (convertedCoords) map.panTo(convertedCoords)
    }
  }

  // Auto-scroll to active log item
  useEffect(() => {
    const activeItem = document.getElementById(`log-item-${historyData?.data[currentGpsIndex]?.id}`)
    activeItem?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [currentGpsIndex, historyData])




  // --- DATA PREPARATION FOR MAP (Hooks must be called at the top level) ---
  const {
    mapCenter,
    carDeviceAsMapDevice,
    pathCoordinatesForMap,
    journeyMarkersForMap,
    currentPoint
  } = useMemo(() => {
    const point = historyData?.data[currentGpsIndex];
    const centerCoords = point ? convertGpsCoordinates(point) : null;
    const center = centerCoords || { lat: 21.0285, lng: 105.8542 };

    let carDevice: any[] = [];
    if (point && centerCoords && historyData) {
      carDevice = [{
        id: historyData.imei,
        imei: historyData.imei,
        plate_number: historyData.plate_number,
        status: 'online',
        latitude: centerCoords.lat,
        longitude: centerCoords.lng,
        speed: point.gps_speed,
        last_update: point.collected_at,
      }];
    }

    const path = historyData?.data
      ? historyData.data.slice(0, currentGpsIndex + 1)
          .map(p => convertGpsCoordinates(p))
          .filter(Boolean) as { lat: number; lng: number }[]
      : [];

    let markers;
    if (historyData?.data?.length) {
      const start = convertGpsCoordinates(historyData.data[0]);
      const end = convertGpsCoordinates(historyData.data[historyData.data.length - 1]);
      markers = {
        start: start || undefined,
        end: end || undefined,
      };
    }

    return {
      currentPoint: point,
      mapCenter: center,
      carDeviceAsMapDevice: carDevice,
      pathCoordinatesForMap: path,
      journeyMarkersForMap: markers,
    };
  }, [historyData, currentGpsIndex]);

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
          <Link href="/dashboard/journey-sessions"><Button variant="outline" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" />Quay lại</Button></Link>
        </div>
      </div>
    )
  }
  






  return (
    <div className="h-[calc(100vh-115px)] flex flex-col overflow-scroll">
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Video & Controls */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full flex flex-col overflow-hidden">
              {/* Video Player */}
              <div className="relative bg-black aspect-video flex-shrink-0 flex items-center justify-center">
                <video
                  ref={videoRef}
                  key={activeVideo?.id || 'no-video'}
                  className={`w-full h-full object-cover ${!activeVideo ? 'hidden' : ''}`}

                  autoPlay={isPlaying}
                  playsInline // for better mobile support
                />
                {!activeVideo && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
                    <p className="text-muted-foreground">Không có video cho thời điểm này</p>
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Xe {historyData.plate_number}</span>
                </div>
                <div className="absolute top-4 right-4">
                  <Button size="sm" variant="secondary" className="bg-black/70 hover:bg-black/80 text-white border-none" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Video Controls */}
              <div className="p-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">
                    Video {activeVideo ? playlist.findIndex(v => v.id === activeVideo.id) + 1 : '-'} / {playlist.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Tốc độ:</span>
                    <Select value={playbackSpeed.toString()} onValueChange={(value) => setPlaybackSpeed(Number(value))}>
                      <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLAYBACK_SPEED_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Button size="sm" variant="outline" onClick={() => handleSliderChange([Math.max(0, globalTime - 10)])}><SkipBack className="h-4 w-4" /></Button>
                  <Button size="sm" onClick={handlePlayPause}>{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
                  <Button size="sm" variant="outline" onClick={() => { setIsPlaying(false); handleSliderChange([0]); }}><Square className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => handleSliderChange([Math.min(totalDuration, globalTime + 10)])}><SkipForward className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {historyData?.data[0] ? format(new Date(historyData.data[0].collected_at), "dd/MM/yyyy HH:mm:ss", { locale: vi }) : "--:--:--"}
                    </span>
                    <span className="font-semibold text-primary">
                      {journeyStartTimeMs ? format(new Date(journeyStartTimeMs + globalTime * 1000), "dd/MM/yyyy HH:mm:ss", { locale: vi }) : "--:--:--"}
                    </span>
                    <span>
                      {historyData?.data[historyData.data.length - 1] ? format(new Date(historyData.data[historyData.data.length - 1].collected_at), "dd/MM/yyyy HH:mm:ss", { locale: vi }) : "--:--:--"}
                    </span>
                  </div>
                  <Slider value={[globalTime]} onValueChange={handleSliderChange} max={totalDuration} step={1} className="w-full" />
                </div>
              </div>

              {/* Journey Log */}
              <div className="flex-1 overflow-hidden">
                <Card className="h-full border-0 rounded-none flex flex-col">
                  <CardHeader className="py-3 flex-shrink-0"><CardTitle className="text-base">Nhật ký di chuyển</CardTitle></CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-4 pt-0">
                    <div className="space-y-2">
                      {historyData.data.map((point, index) => (
                        <div
                          key={point.id}
                          id={`log-item-${point.id}`}
                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${index === currentGpsIndex ? "bg-blue-200 border-blue-500 shadow-sm" : "bg-white hover:bg-gray-50"}`}
                          onClick={() => handleLogClick(index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${index === currentGpsIndex ? "bg-blue-500" : "bg-gray-300"}`} />
                              <div>
                                <div className="font-medium text-sm flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" />{format(new Date(point.collected_at), "HH:mm:ss", { locale: vi })}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />
                                  {(() => {
                                    const coords = convertGpsCoordinates(point)
                                    return coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : 'Invalid GPS'
                                  })()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="text-sm font-medium flex items-center justify-end gap-1"><Gauge className="h-3 w-3 text-muted-foreground" />{point.gps_speed.toFixed(1)} km/h</div>
                              <div className="text-xs text-muted-foreground flex items-center justify-end gap-1"><Battery className="h-3 w-3" />{point.bat_percent}%</div>
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
                  {currentPoint && (<>Vị trí hiện tại: {format(new Date(currentPoint.collected_at), "HH:mm:ss dd/MM/yyyy", { locale: vi })} - Tốc độ: {currentPoint.gps_speed} km/h</>)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-4">
                                <DynamicMap
                  center={mapCenter}
                  devices={carDeviceAsMapDevice}
                  pathCoordinates={pathCoordinatesForMap}
                  journeyMarkers={journeyMarkersForMap}
                  mapRef={setMap}
                />
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
