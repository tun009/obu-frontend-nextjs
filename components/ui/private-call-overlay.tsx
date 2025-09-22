"use client"

import { Mic, PhoneOff, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface PrivateCallOverlayProps {
  deviceName: string
  onStopCall: () => void
}

export function PrivateCallOverlay({ deviceName, onStopCall }: PrivateCallOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in-0 duration-300">
      <div className="flex flex-col items-center gap-8 text-white">
        <div className="relative flex items-center justify-center h-32 w-32">
          <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse"></div>
          <div className="absolute inset-2 rounded-full bg-green-500/30 animate-pulse [animation-delay:0.3s]"></div>
          <Mic className="h-16 w-16 text-green-400 z-10" />
        </div>
        <div className="text-center">
          <p className="text-lg text-gray-300">Đang trong cuộc gọi riêng với</p>
          <h2 className="text-4xl font-bold mt-1 tracking-wider">{deviceName}</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-gray-300 border border-white/20">
          <Info className="h-4 w-4" />
          <span>Cuộc gọi sẽ tự động ngắt sau 20 giây.</span>
        </div>
        <Button
          onClick={onStopCall}
          variant="destructive"
          size="lg"
          className="rounded-full h-20 w-20 p-0 flex items-center justify-center shadow-2xl mt-4 transform hover:scale-110 transition-transform duration-200"
        >
          <PhoneOff className="h-9 w-9" />
          <span className="sr-only">Dừng cuộc gọi</span>
        </Button>
      </div>
    </div>
  )
}

