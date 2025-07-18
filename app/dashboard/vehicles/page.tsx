"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"

const mockVehicles = [
  {
    id: 1,
    plateNumber: "29A-12345",
    brand: "Toyota",
    model: "Camry",
    year: 2022,
    status: "active",
    deviceId: "OBU-001234",
    driver: "Nguyễn Văn A",
  },
  {
    id: 2,
    plateNumber: "30B-67890",
    brand: "Honda",
    model: "Civic",
    year: 2021,
    status: "maintenance",
    deviceId: "OBU-001235",
    driver: "Trần Văn B",
  },
  {
    id: 3,
    plateNumber: "31C-11111",
    brand: "Mazda",
    model: "CX-5",
    year: 2023,
    status: "active",
    deviceId: null,
    driver: "Lê Văn C",
  },
  {
    id: 4,
    plateNumber: "32D-22222",
    brand: "Ford",
    model: "Ranger",
    year: 2020,
    status: "inactive",
    deviceId: "OBU-001236",
    driver: null,
  },
]

export default function VehiclesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredVehicles = mockVehicles.filter(
    (vehicle) =>
      vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý xe</h1>
          <p className="text-muted-foreground">Quản lý thông tin xe và gán thiết bị OBU</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/vehicles/add">
            <Plus className="h-4 w-4 mr-2" />
            Thêm xe mới
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách xe</CardTitle>
          <CardDescription>Tổng cộng {mockVehicles.length} xe trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo biển số, hãng xe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Biển số</TableHead>
                <TableHead>Hãng xe</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Năm SX</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thiết bị</TableHead>
                <TableHead>Tài xế</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.plateNumber}</TableCell>
                  <TableCell>{vehicle.brand}</TableCell>
                  <TableCell>{vehicle.model}</TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        vehicle.status === "active"
                          ? "default"
                          : vehicle.status === "maintenance"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {vehicle.status === "active"
                        ? "Hoạt động"
                        : vehicle.status === "maintenance"
                          ? "Bảo trì"
                          : "Không hoạt động"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {vehicle.deviceId ? (
                      <Badge variant="outline">{vehicle.deviceId}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Chưa gán</span>
                    )}
                  </TableCell>
                  <TableCell>{vehicle.driver || <span className="text-muted-foreground">Chưa gán</span>}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/vehicles/${vehicle.id}/edit`}>
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
