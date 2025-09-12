"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"

// Tải động component CallGroupClient và vô hiệu hóa SSR
const CallGroupClient = dynamic(
  () => import('@/components/call-group/call-group-client'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải thư viện giao tiếp...</p>
        </div>
      </div>
    )
  }
)

export default function CallGroupPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Trung tâm Giao tiếp</CardTitle>
          <CardDescription>
            Thực hiện cuộc gọi nhóm (Push-to-Talk) và gọi trực tiếp tới các thiết bị.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Đang tải...</div>}>
            <CallGroupClient />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

