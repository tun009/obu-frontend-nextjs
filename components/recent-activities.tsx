import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Car, User, Smartphone, AlertTriangle } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "vehicle",
    message: "Xe 29A-12345 đã được thêm vào hệ thống",
    time: "2 phút trước",
    icon: Car,
    status: "success",
  },
  {
    id: 2,
    type: "device",
    message: "Thiết bị OBU-001234 mất kết nối",
    time: "5 phút trước",
    icon: AlertTriangle,
    status: "warning",
  },
  {
    id: 3,
    type: "driver",
    message: "Tài xế Nguyễn Văn A đã được cập nhật thông tin",
    time: "10 phút trước",
    icon: User,
    status: "info",
  },
  {
    id: 4,
    type: "device",
    message: "Thiết bị OBU-001235 đã được gán cho xe 30B-67890",
    time: "15 phút trước",
    icon: Smartphone,
    status: "success",
  },
  {
    id: 5,
    type: "vehicle",
    message: "Xe 31C-11111 đã hoàn thành bảo trì",
    time: "1 giờ trước",
    icon: Car,
    status: "success",
  },
]

export function RecentActivities() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoạt động gần đây</CardTitle>
        <CardDescription>Các sự kiện và thay đổi mới nhất trong hệ thống</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div
                className={`p-2 rounded-full ${
                  activity.status === "success"
                    ? "bg-green-100 text-green-600"
                    : activity.status === "warning"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-blue-100 text-blue-600"
                }`}
              >
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{activity.message}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              <Badge
                variant={
                  activity.status === "success"
                    ? "default"
                    : activity.status === "warning"
                      ? "destructive"
                      : "secondary"
                }
              >
                {activity.type}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
