"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useVirtualizer } from '@tanstack/react-virtual'
import { useParams } from "next/navigation"


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Play, Pause, SkipBack, SkipForward, Square, Volume2, VolumeX, ArrowLeft, Clock, Gauge, Battery, MapPin, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import journeySessionsAPI from "@/lib/services/journey-sessions-api"
import type { JourneySessionHistoryResponse } from "@/lib/types/api"
import Link from "next/link"
import JourneyMap from "@/components/map/journey-map";
import { convertGpsCoordinates } from "@/lib/utils"
import { getMediaUrl } from "@/lib/proxy-service"

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

  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isFilterActive, setIsFilterActive] = useState(false)
  const [timeRange, setTimeRange] = useState([0, 0]) // For the slider UI, in seconds
  const [appliedTimeRange, setAppliedTimeRange] = useState<[number, number] | null>(null) // For applied filter, in seconds

  // Map and Log states
  const [currentGpsIndex, setCurrentGpsIndex] = useState(0)



  const videoRef = useRef<HTMLVideoElement>(null)

  // --- DATA FETCHING ---
  const fetchData = async (startTime?: string, endTime?: string, isFiltering: boolean = false) => {
    if (!journeyId) return;
    try {
      if (!isFiltering) {
        setLoading(true);
      }
      const [historyResponse, playlistResponse] = await Promise.all([
        journeySessionsAPI.getJourneySessionHistory(journeyId, startTime, endTime),
        journeySessionsAPI.getJourneyPlaylist(journeyId, startTime, endTime)
      ]);

      const validHistory = historyResponse.data;
      setHistoryData({ ...historyResponse, data: validHistory });
      setPlaylist(playlistResponse);

    } catch (error: any) {
      toast.error('Không thể tải dữ liệu hành trình hoặc video.');
      console.error('Error fetching data:', error);
    } finally {
      if (!isFiltering) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData()
  }, [journeyId])



  // --- FILTER HANDLERS ---
  const handleApplyFilter = async () => {
    if (!historyData?.data || historyData.data.length === 0 || !journeyStartTimeMs) return;

    const startTimeMs = journeyStartTimeMs + (timeRange[0] * 1000);
    const endTimeMs = journeyStartTimeMs + (timeRange[1] * 1000);

    const startTimeISO = new Date(startTimeMs).toISOString();
    const endTimeISO = new Date(endTimeMs).toISOString();

    setAppliedTimeRange([timeRange[0], timeRange[1]]);
    setIsFilterActive(true);
    setGlobalTime(0); // Reset playback position

    await fetchData(startTimeISO, endTimeISO, true);
    toast.success('Đã áp dụng bộ lọc thời gian');
  };

  const handleResetFilter = async () => {
    setAppliedTimeRange(null);
    setIsFilterActive(false);
    setGlobalTime(0); // Reset playback position

    await fetchData(undefined, undefined, true);
    toast.success('Đã xóa bộ lọc thời gian');
  };



  const formatTimestampFromSeconds = (seconds: number) => {
    if (!journeyStartTimeMs || isNaN(seconds)) return "--/--/---- --:--:--";
    const timestampMs = journeyStartTimeMs + (seconds * 1000);
    return format(new Date(timestampMs), "dd/MM/yyyy HH:mm:ss");
  }

  // --- MEMOIZED CALCULATIONS ---
  const { totalDuration, journeyStartTimeMs } = useMemo(() => {
    if (!historyData?.data || historyData.data.length === 0) {
      return { totalDuration: 0, journeyStartTimeMs: 0 };
    }

    const journeyStart = new Date(historyData.data[0].collected_at).getTime();
    const journeyEnd = new Date(historyData.data[historyData.data.length - 1].collected_at).getTime();
    const historyDuration = (journeyEnd - journeyStart) / 1000; // in seconds

    return {
      totalDuration: historyDuration > 0 ? historyDuration : 0,
      journeyStartTimeMs: journeyStart
    };

  }, [historyData]);

  // Sync filter slider range with total duration
  useEffect(() => {
    if (!isFilterActive) {
      setTimeRange([0, totalDuration]);
    }
  }, [totalDuration, isFilterActive]);

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
      if (!video.src || !video.src.endsWith(proxyUrl)) {
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

    // The new map component will handle panning automatically based on vehicle position.
  }

  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: historyData?.data.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Approx height of one log item in pixels
    overscan: 5,
  });

  // Auto-scroll to active log item
  useEffect(() => {
    if (rowVirtualizer) {
      rowVirtualizer.scrollToIndex(currentGpsIndex, { align: 'center', behavior: 'smooth' });
    }
  }, [currentGpsIndex]);




  // --- DATA PREPARATION FOR NEW JOURNEY MAP ---
  const {
    fullPathCoordinates,
    progressPathCoordinates,
    vehiclePosition,
    startPosition,
    endPosition,
    currentPoint
  } = useMemo(() => {
    if (!historyData?.data || historyData.data.length === 0) {
      return { fullPathCoordinates: [], progressPathCoordinates: [], currentPoint: undefined };
    }

    const allPoints = historyData.data
      .map(p => convertGpsCoordinates(p))
      .filter(Boolean) as { lat: number; lng: number }[];

    const progressPoints = allPoints.slice(0, currentGpsIndex + 1);

    const point = historyData.data[currentGpsIndex];
    const vehiclePos = point ? { ...convertGpsCoordinates(point), direction: point.direction ?? 0 } : undefined; // Direction is not available in history data, default to 0
    return {
      fullPathCoordinates: allPoints,
      progressPathCoordinates: progressPoints,
      vehiclePosition: vehiclePos,
      startPosition: allPoints[0],
      endPosition: allPoints[allPoints.length - 1],
      currentPoint: point,
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
                <div className="absolute top-4 right-4">
                  <Button size="sm" variant="secondary" className="bg-black/70 hover:bg-black/80 text-white border-none" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Timeline Filter */}
              <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <CollapsibleTrigger className="w-full">
                  <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between hover:bg-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isFilterActive ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                      <span className="text-sm font-medium">Bộ lọc</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-300">
                        {isFilterOpen
                          ? `${formatTimestampFromSeconds(timeRange[0])} → ${formatTimestampFromSeconds(timeRange[1])}`
                          : (isFilterActive && appliedTimeRange)
                            ? `${formatTimestampFromSeconds(appliedTimeRange[0])} → ${formatTimestampFromSeconds(appliedTimeRange[1])}`
                            : "Toàn bộ hành trình"
                        }
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="bg-slate-800 text-white px-4 py-4 border-t border-slate-700">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="relative h-8 w-full flex items-center">
                          {/* Track background */}
                          <div className="absolute h-2 w-full bg-slate-600 rounded-full" />
                          {/* Range highlight */}
                          <div
                            className="absolute h-2 bg-blue-500 rounded-full"
                            style={{
                              left: `${(timeRange[0] / totalDuration) * 100}%`,
                              width: `${((timeRange[1] - timeRange[0]) / totalDuration) * 100}%`,
                            }}
                          />
                          {/* Start marker */}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer border-2 border-white"
                            style={{ left: `calc(${(timeRange[0] / totalDuration) * 100}% - 12px)` }}
                          >
                            <ChevronLeft className="w-4 h-4 text-white" />
                          </div>
                          {/* End marker */}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer border-2 border-white"
                            style={{ left: `calc(${(timeRange[1] / totalDuration) * 100}% - 12px)` }}
                          >
                            <ChevronRight className="w-4 h-4 text-white" />
                          </div>
                          {/* Invisible range inputs */}
                          <input
                            type="range"
                            min={0}
                            max={totalDuration}
                            value={timeRange[0]}
                            step={1}
                            onChange={(e) => {
                              const newStart = Number(e.target.value);
                              if (newStart < timeRange[1]) {
                                setTimeRange([newStart, timeRange[1]]);
                              }
                            }}
                            className="absolute w-full h-full opacity-0 cursor-pointer"
                            style={{ zIndex: 3 }}
                          />
                          <input
                            type="range"
                            min={0}
                            max={totalDuration}
                            value={timeRange[1]}
                            step={1}
                            onChange={(e) => {
                              const newEnd = Number(e.target.value);
                              if (newEnd > timeRange[0]) {
                                setTimeRange([timeRange[0], newEnd]);
                              }
                            }}
                            className="absolute w-full h-full opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                            style={{ zIndex: 4 }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 pt-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">{formatTimestampFromSeconds(0)}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Thời gian bắt đầu hành trình</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">{formatTimestampFromSeconds(totalDuration)}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Thời gian kết thúc hành trình</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>

                      {/* Stats and buttons */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                          Duration: {new Date((timeRange[1] - timeRange[0]) * 1000).toISOString().slice(11, 19)}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={handleResetFilter} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                            Reset
                          </Button>
                          <Button size="sm" onClick={handleApplyFilter} className="bg-blue-600 hover:bg-blue-700">
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

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
                  <CardContent ref={parentRef} className="flex-1 overflow-y-auto p-4 pt-0">
                    <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                      {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const index = virtualItem.index;
                        const point = historyData.data[index];
                        return (
                          <div
                            key={point.id}
                            id={`log-item-${point.id}`}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: `${virtualItem.size}px`,
                              transform: `translateY(${virtualItem.start}px)`,
                              padding: '0.25rem' // Add padding to compensate for space-y-2
                            }}
                            onClick={() => handleLogClick(index)}
                          >
                            <div className={`p-2 h-full rounded-lg border cursor-pointer transition-all hover:shadow-sm ${index === currentGpsIndex ? "bg-blue-200 border-blue-500 shadow-sm" : "bg-white hover:bg-gray-50"}`}>
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
                          </div>
                        )
                      })}
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
              <CardHeader className="pb-3 flex-shrink-0 pt-0">
                <CardTitle className="text-lg">Bản đồ hành trình {historyData.imei}</CardTitle>
                <CardDescription>
                  {currentPoint && (<>Vị trí hiện tại: {format(new Date(currentPoint.collected_at), "HH:mm:ss dd/MM/yyyy", { locale: vi })} - Tốc độ: {currentPoint.gps_speed} km/h</>)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-4">
                <JourneyMap
                  fullPathCoordinates={fullPathCoordinates}
                  progressPathCoordinates={progressPathCoordinates}
                  vehiclePosition={vehiclePosition}
                  startPosition={startPosition}
                  endPosition={endPosition}
                />
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
