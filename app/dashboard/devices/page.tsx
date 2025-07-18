"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Wifi, WifiOff, LinkIcon } from "lucide-react"
import Link from "next/link"

const mockDevices = [
  {
    id: 1,
    imei: "OBU-001234",
    serialNumber: "SN001234567",
    status: "online",
    assignedVehicle: "29A-12345",
    lastUpdate: "2024-01-15 14:30:25",
    signalStrength: 85,
  },
  {
    id: 2,
    imei: "OBU-001235",
    serialNumber: "SN001234568",
    status: "offline",
    assignedVehicle: "30B-67890",
    lastUpdate: "2024-01-15 12:15:10",
    signalStrength: 0,
  },
  {
    id: 3,
    imei: "OBU-001236",
    serialNumber: "SN001234569",
    status: "online",
    assignedVehicle: null,
    lastUpdate: "2024-01-15 14:28:45",
    signalStrength: 92,
  },
  {
    id: 4,
    imei: "OBU-001237",
    serialNumber: "SN001234570",
    status: "maintenance",
    assignedVehicle: null,
    lastUpdate: "2024-01-14 16:45:30",
    signalStrength: 0,
  },
]

export default function DevicesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredDevices = mockDevices.filter(
    (device) =>
      device.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý thiết bị OBU</h1>
          <p className="text-muted-foreground">Quản lý thiết bị theo dõi và gán cho xe</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/devices/add">
            <Plus className="h-4 w-4 mr-2" />
            Thêm thiết bị mới
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thiết bị</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDevices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
            <Wifi className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockDevices.filter((d) => d.status === "online").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mất kết nối</CardTitle>
            <WifiOff className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mockDevices.filter((d) => d.status === "offline").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chưa gán</CardTitle>
            <LinkIcon className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {mockDevices.filter((d) => !d.assignedVehicle).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách thiết bị</CardTitle>
          <CardDescription>Quản lý và theo dõi trạng thái thiết bị OBU</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo IMEI, Serial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IMEI</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Xe được gán</TableHead>
                <TableHead>Tín hiệu</TableHead>
                <TableHead>Cập nhật cuối</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.imei}</TableCell>
                  <TableCell>{device.serialNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {device.status === "online" ? (
                        <Wifi className="h-4 w-4 text-green-600" />
                      ) : device.status === "offline" ? (
                        <WifiOff className="h-4 w-4 text-red-600" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-gray-400" />
                      )}
                      <Badge
                        variant={
                          device.status === "online"
                            ? "default"
                            : device.status === "offline"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {device.status === "online"
                          ? "Trực tuyến"
                          : device.status === "offline"
                            ? "Mất kết nối"
                            : "Bảo trì"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {device.assignedVehicle ? (
                      <Badge variant="outline">{device.assignedVehicle}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Chưa gán</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {device.signalStrength > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              device.signalStrength > 70
                                ? "bg-green-600"
                                : device.signalStrength > 40
                                  ? "bg-yellow-600"
                                  : "bg-red-600"
                            }`}
                            style={{ width: `${device.signalStrength}%` }}
                          />
                        </div>
                        <span className="text-sm">{device.signalStrength}%</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{device.lastUpdate}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/devices/${device.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/devices/${device.id}/assign`}>
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Gán xe
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/devices/${device.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
