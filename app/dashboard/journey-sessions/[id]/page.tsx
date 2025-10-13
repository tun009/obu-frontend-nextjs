"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useVirtualizer } from '@tanstack/react-virtual'
import { useParams } from "next/navigation"


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Filter, Play, Pause, SkipBack, SkipForward, Square, Volume2, VolumeX, ArrowLeft, Clock, Gauge, Battery, MapPin } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import journeySessionsAPI from "@/lib/services/journey-sessions-api"
import type { JourneySessionHistoryResponse } from "@/lib/types/api"
import Link from "next/link"
import JourneyMap from "@/components/map/journey-map";
import { convertGpsCoordinates } from "@/lib/utils"
import { getMediaUrl } from "@/lib/proxy-service"
import { useTranslation } from "react-i18next";
import { z } from "zod";

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



const createFilterSchema = (journeyStart: Date, journeyEnd: Date, t: (key: string) => string) => z.object({
  from: z.date({ required_error: t('journeySessionDetailsPage.filter.validation.required') })
    .min(journeyStart, { message: t('journeySessionDetailsPage.filter.validation.out_of_bounds') })
    .max(journeyEnd, { message: t('journeySessionDetailsPage.filter.validation.out_of_bounds') }),
  to: z.date({ required_error: t('journeySessionDetailsPage.filter.validation.required') })
    .min(journeyStart, { message: t('journeySessionDetailsPage.filter.validation.out_of_bounds') })
    .max(journeyEnd, { message: t('journeySessionDetailsPage.filter.validation.out_of_bounds') }),
}).refine(data => !data.from || !data.to || data.to >= data.from, {
  message: t('journeySessionDetailsPage.filter.validation.end_after_start'),
  path: ["to"],
});

const PLAYBACK_SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 5, label: '5x' },
  { value: 10, label: '10x' },
];



export default function JourneyHistoryPage() {
  const { t } = useTranslation();
  const params = useParams()
  const journeyId = parseInt(params.id as string);
  // Data states
  const [historyData, setHistoryData] = useState<JourneySessionHistoryResponse | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);


  // Player states
  const [activeVideo, setActiveVideo] = useState<PlaylistItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [globalTime, setGlobalTime] = useState(0); // in seconds, represents time from the start of the whole journey

  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined);
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>(undefined);
  const [errors, setErrors] = useState<z.ZodFormattedError<{ from: Date; to: Date; }> | null>(null);

  // Map and Log states
  const [currentGpsIndex, setCurrentGpsIndex] = useState(0);



  const videoRef = useRef<HTMLVideoElement>(null);

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
      toast.error(t('journeySessionDetailsPage.loadError'));
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



  // --- FILTERED DATA ---
  const { filteredData, filteredPlaylist } = useMemo(() => {
    if (!appliedDateRange?.from || !appliedDateRange?.to) {
      return { filteredData: historyData?.data || [], filteredPlaylist: playlist };
    }

    const fromTime = appliedDateRange.from.getTime();
    const toTime = appliedDateRange.to.getTime();

    const newFilteredData = (historyData?.data || []).filter(p => {
      const pointTime = new Date(p.collected_at).getTime();
      return pointTime >= fromTime && pointTime <= toTime;
    });

    const newFilteredPlaylist = playlist.filter(v => {
      const videoTime = new Date(v.taken_at).getTime();
      return videoTime >= fromTime && videoTime <= toTime;
    });

    return { filteredData: newFilteredData, filteredPlaylist: newFilteredPlaylist };
  }, [appliedDateRange, historyData?.data, playlist]);





  // --- MEMOIZED CALCULATIONS ---
  const { totalDuration, journeyStartTimeMs } = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { totalDuration: 0, journeyStartTimeMs: 0 };
    }

    const journeyStart = new Date(filteredData[0].collected_at).getTime();
    const journeyEnd = new Date(filteredData[filteredData.length - 1].collected_at).getTime();
    const historyDuration = (journeyEnd - journeyStart) / 1000; // in seconds

    return {
      totalDuration: historyDuration > 0 ? historyDuration : 0,
      journeyStartTimeMs: journeyStart
    };

  }, [filteredData]);



  // --- PLAYER LOGIC ---

  // Find the active video based on globalTime
  useEffect(() => {
    if (!journeyStartTimeMs || !filteredPlaylist.length) {
      setActiveVideo(null);
      return;
    }

    const currentJourneyTimeMs = journeyStartTimeMs + (globalTime * 1000);

    const foundVideo = filteredPlaylist.find(video => {
      const videoStartTimeMs = new Date(video.taken_at).getTime();
      const videoEndTimeMs = videoStartTimeMs + (video.media_duration * 1000);
      return currentJourneyTimeMs >= videoStartTimeMs && currentJourneyTimeMs < videoEndTimeMs;
    });

    setActiveVideo(foundVideo || null);

  }, [globalTime, filteredPlaylist, journeyStartTimeMs]);

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
  }, [isPlaying, filteredPlaylist, totalDuration, playbackSpeed]);


  const handlePlayPause = () => setIsPlaying(!isPlaying);



  const handleSliderChange = (value: number[]) => {
    const newGlobalTime = value[0];
    setGlobalTime(newGlobalTime);
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (!filteredData.length || !journeyStartTimeMs) return;

    const currentElapsedTimeMs = globalTime * 1000;
    const targetTimeMs = journeyStartTimeMs + currentElapsedTimeMs;

    const closestGpsIndex = filteredData.reduce((closest, point, index) => {
      const pointTime = new Date(point.collected_at).getTime();
      const closestTime = new Date(filteredData[closest].collected_at).getTime();
      return Math.abs(pointTime - targetTimeMs) < Math.abs(closestTime - targetTimeMs) ? index : closest;
    }, 0);

    setCurrentGpsIndex(closestGpsIndex);
  }, [globalTime, filteredData, journeyStartTimeMs]);

  const handleLogClick = (index: number) => {
    if (!filteredData.length || !journeyStartTimeMs) return;

    const pointTimeMs = new Date(filteredData[index].collected_at).getTime();
    const newGlobalTime = (pointTimeMs - journeyStartTimeMs) / 1000;
    handleSliderChange([Math.max(0, newGlobalTime)]);

    // The new map component will handle panning automatically based on vehicle position.
  };

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredData.length ?? 0,
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
    if (!filteredData || filteredData.length === 0) {
      return { fullPathCoordinates: [], progressPathCoordinates: [], currentPoint: undefined };
    }

    const allPoints = filteredData
      .map(p => convertGpsCoordinates(p))
      .filter(Boolean) as { lat: number; lng: number }[];

    const progressPoints = allPoints.slice(0, currentGpsIndex + 1);

    const currentPoint = filteredData[currentGpsIndex];
    let vehiclePos: { lat: number; lng: number; direction: number; isValidGps: boolean; } | undefined;

    if (currentPoint) {
      const isCurrentPointValid = currentPoint.gps_valid === 1 && currentPoint.gps_enable === 1;
      let pointToDisplay = currentPoint;

      if (!isCurrentPointValid) {
        // Find the last valid point if the current one is not valid
        for (let i = currentGpsIndex - 1; i >= 0; i--) {
          if (filteredData[i].gps_valid === 1 && filteredData[i].gps_enable === 1) {
            pointToDisplay = filteredData[i];
            break;
          }
        }
      }

      const coords = convertGpsCoordinates(pointToDisplay);
      if (coords) {
        vehiclePos = {
          ...coords,
          direction: pointToDisplay.direction ?? 0,
          isValidGps: isCurrentPointValid
        };
      }
    }

    return {
      fullPathCoordinates: allPoints,
      progressPathCoordinates: progressPoints,
      vehiclePosition: vehiclePos,
      startPosition: allPoints[0],
      endPosition: allPoints[allPoints.length - 1],
      currentPoint: currentPoint,
    };
  }, [filteredData, currentGpsIndex]);

  useEffect(() => {
    // Don't validate if the popover is closed (tempDateRange is undefined)
    if (!historyData?.data || historyData.data.length < 2 || !tempDateRange) {
      setErrors(null);
      return;
    }

    const journeyStart = new Date(historyData.data[0].collected_at);
    const journeyEnd = new Date(historyData.data[historyData.data.length - 1].collected_at);
    const schema = createFilterSchema(journeyStart, journeyEnd, t);
    const result = schema.safeParse(tempDateRange);

    if (!result.success) {
      setErrors(result.error.format());
    } else {
      setErrors(null);
    }
  }, [tempDateRange, historyData?.data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('journeySessionDetailsPage.loading')}</p>
        </div>
      </div>
    )
  }

  if (!historyData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">{t('journeySessionDetailsPage.notFound')}</p>
          <Link href="/dashboard/journey-sessions"><Button variant="outline" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" />{t('journeySessionDetailsPage.backButton')}</Button></Link>
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
                    <p className="text-muted-foreground">{t('journeySessionDetailsPage.noVideo')}</p>
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Button size="sm" variant="secondary" className="bg-black/70 hover:bg-black/80 text-white border-none" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Video Controls */}
              <div className="p-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {/* <span className="text-sm text-muted-foreground">
                      {t('journeySessionDetailsPage.player.videoProgress', { current: activeVideo ? filteredPlaylist.findIndex(v => v.id === activeVideo.id) + 1 : '-', total: filteredPlaylist.length })}
                    </span> */}
                    <Popover
                      open={isFilterOpen}
                      onOpenChange={(isOpen) => {
                        setIsFilterOpen(isOpen);
                        if (isOpen && historyData?.data && historyData.data.length > 0) {
                          // Initialize temp range when opening
                          setTempDateRange({
                            from: appliedDateRange?.from ?? new Date(historyData.data[0].collected_at),
                            to: appliedDateRange?.to ?? new Date(historyData.data[historyData.data.length - 1].collected_at),
                          });
                        } else if (!isOpen) {
                          // Clear temp range and errors when closing
                          setTempDateRange(undefined);
                          setErrors(null);
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={`h-8 border-dashed ${appliedDateRange ? 'bg-muted text-primary' : ''}`}>
                          <Filter className="mr-2 h-4 w-4" />
                          {t('journeySessionDetailsPage.filter.title')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4" align="start">
                        <div className="space-y-4">
                          <div className="font-semibold">{t('journeySessionDetailsPage.filter.popoverTitle')}</div>
                          <div className="flex items-start gap-4">
                            <div className="grid gap-1 text-sm">
                              <label className="font-medium">{t('journeySessionDetailsPage.filter.fromLabel')}</label>
                              <DateTimePicker
                                value={tempDateRange?.from}
                                onChange={(date) => setTempDateRange(prev => ({ from: date, to: prev?.to }))}
                                maxDate={tempDateRange?.to}
                                minDate={historyData?.data && historyData.data.length > 0 ? new Date(historyData.data[0].collected_at) : undefined}
                              />
                              {errors?.from && <p className="text-red-500 text-xs mt-1">{errors.from._errors[0]}</p>}
                            </div>
                            <div className="grid gap-1 text-sm">
                              <label className="font-medium">{t('journeySessionDetailsPage.filter.toLabel')}</label>
                              <DateTimePicker
                                value={tempDateRange?.to}
                                onChange={(date) => setTempDateRange(prev => ({ from: prev?.from, to: date }))}
                                minDate={tempDateRange?.from}
                                maxDate={historyData?.data && historyData.data.length > 0 ? new Date(historyData.data[historyData.data.length - 1].collected_at) : undefined}
                              />
                              {errors?.to && <p className="text-red-500 text-xs mt-1">{errors.to._errors[0]}</p>}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setAppliedDateRange(undefined);
                                setTempDateRange(undefined);
                                setIsFilterOpen(false);
                                setGlobalTime(0);
                              }}
                            >
                              {t('journeySessionDetailsPage.filter.resetButton')}
                            </Button>
                            <Button
                              disabled={!!errors}
                              onClick={() => {
                                setAppliedDateRange(tempDateRange);
                                setIsFilterOpen(false);
                                setGlobalTime(0);
                              }}
                            >
                              {t('journeySessionDetailsPage.filter.applyButton')}
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{t('journeySessionDetailsPage.player.speed')}:</span>
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
                      {filteredData[0] ? format(new Date(filteredData[0].collected_at), "dd/MM/yyyy HH:mm:ss", { locale: vi }) : "--:--:--"}
                    </span>
                    <span className="font-semibold text-primary">
                      {journeyStartTimeMs ? format(new Date(journeyStartTimeMs + globalTime * 1000), "dd/MM/yyyy HH:mm:ss", { locale: vi }) : "--:--:--"}
                    </span>
                    <span>
                      {filteredData[filteredData.length - 1] ? format(new Date(filteredData[filteredData.length - 1].collected_at), "dd/MM/yyyy HH:mm:ss", { locale: vi }) : "--:--:--"}
                    </span>
                  </div>
                  <div className="relative w-full h-4 flex items-center">
                    {/* Video segments overlay */}
                    <div className="absolute w-full h-2 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                      {filteredPlaylist.map((video) => {
                        if (!journeyStartTimeMs || !totalDuration) return null;

                        const videoStartOffset = (new Date(video.taken_at).getTime() - journeyStartTimeMs) / 1000;
                        const leftPercentage = (videoStartOffset / totalDuration) * 100;
                        const widthPercentage = (video.media_duration / totalDuration) * 100;

                        // Ensure segments are within the 0-100% bounds
                        if (leftPercentage > 100 || leftPercentage < 0) return null;

                        return (
                          <div
                            key={video.id}
                            className="absolute h-full bg-blue-500/50 rounded-full"
                            style={{
                              left: `${leftPercentage}%`,
                              width: `${widthPercentage}%`,
                            }}
                          />
                        );
                      })}
                    </div>
                    <Slider value={[globalTime]} onValueChange={handleSliderChange} max={totalDuration} step={1} className="w-full" />
                  </div>
                </div>
              </div>

              {/* Journey Log */}
              <div className="flex-1 overflow-hidden">
                <Card className="h-full border-0 rounded-none flex flex-col">
                  <CardHeader className="py-3 flex-shrink-0"><CardTitle className="text-base">{t('journeySessionDetailsPage.log.title')}</CardTitle></CardHeader>
                  <CardContent ref={parentRef} className="flex-1 overflow-y-auto p-4 pt-0">
                    <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                      {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const index = virtualItem.index;
                        const point = filteredData[index];
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
                                        return coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : t('journeySessionDetailsPage.log.invalidGps')
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
                <CardTitle className="text-lg">{t('journeySessionDetailsPage.map.title', { imei: historyData.imei })}</CardTitle>
                <CardDescription>
                  {currentPoint && t('journeySessionDetailsPage.map.currentLocation', { time: format(new Date(currentPoint.collected_at), "HH:mm:ss dd/MM/yyyy", { locale: vi }), speed: currentPoint.gps_speed })}
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
