"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, Users, Smartphone, Activity, Plus, MapPin } from "lucide-react"
import { StatsCard } from "@/components/stats-card"
import { RecentActivities } from "@/components/recent-activities"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"

const chartData = [
  { month: "T1", vehicles: 45, active: 42 },
  { month: "T2", vehicles: 48, active: 45 },
  { month: "T3", vehicles: 52, active: 49 },
  { month: "T4", vehicles: 55, active: 52 },
  { month: "T5", vehicles: 58, active: 55 },
  { month: "T6", vehicles: 62, active: 59 },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Tổng quan hệ thống quản lý xe và thiết bị OBU</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Tổng số xe" value="62" description="+3 từ tháng trước" icon={Car} trend="up" />
        <StatsCard title="Tài xế" value="48" description="+2 từ tháng trước" icon={Users} trend="up" />
        <StatsCard title="Thiết bị OBU" value="58" description="4 chưa gán" icon={Smartphone} trend="neutral" />
        <StatsCard title="Xe đang hoạt động" value="59" description="95.2% tổng số xe" icon={Activity} trend="up" />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
          <CardDescription>Các chức năng thường dùng để quản lý hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Thêm xe mới
            </Button>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Thêm tài xế
            </Button>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Thêm thiết bị
            </Button>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <MapPin className="h-4 w-4" />
              Xem bản đồ
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Charts */}
        <Card>
          <CardHeader>
            <CardTitle>Thống kê theo tháng</CardTitle>
            <CardDescription>Số lượng xe và xe hoạt động trong 6 tháng qua</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                vehicles: {
                  label: "Tổng xe",
                  color: "hsl(var(--chart-1))",
                },
                active: {
                  label: "Xe hoạt động",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="vehicles" stroke="var(--color-vehicles)" strokeWidth={2} />
                  <Line type="monotone" dataKey="active" stroke="var(--color-active)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <RecentActivities />
      </div>

    </div>
  )
}
