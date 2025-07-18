"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Phone } from "lucide-react"
import Link from "next/link"

const mockDrivers = [
  {
    id: 1,
    fullName: "Nguyễn Văn A",
    licenseNumber: "123456789",
    phone: "0901234567",
    email: "nguyenvana@email.com",
    status: "active",
    assignedVehicle: "29A-12345",
    licenseClass: "B2",
  },
  {
    id: 2,
    fullName: "Trần Văn B",
    licenseNumber: "987654321",
    phone: "0907654321",
    email: "tranvanb@email.com",
    status: "active",
    assignedVehicle: "30B-67890",
    licenseClass: "C",
  },
  {
    id: 3,
    fullName: "Lê Văn C",
    licenseNumber: "456789123",
    phone: "0903456789",
    email: "levanc@email.com",
    status: "inactive",
    assignedVehicle: null,
    licenseClass: "B2",
  },
  {
    id: 4,
    fullName: "Phạm Văn D",
    licenseNumber: "789123456",
    phone: "0909876543",
    email: "phamvand@email.com",
    status: "suspended",
    assignedVehicle: null,
    licenseClass: "D",
  },
]

export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredDrivers = mockDrivers.filter(
    (driver) =>
      driver.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.licenseNumber.includes(searchTerm) ||
      driver.phone.includes(searchTerm),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý tài xế</h1>
          <p className="text-muted-foreground">Quản lý thông tin tài xế và phân công xe</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/drivers/add">
            <Plus className="h-4 w-4 mr-2" />
            Thêm tài xế mới
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách tài xế</CardTitle>
          <CardDescription>Tổng cộng {mockDrivers.length} tài xế trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, GPLX, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Số GPLX</TableHead>
                <TableHead>Hạng GPLX</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Xe được gán</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.fullName}</TableCell>
                  <TableCell>{driver.licenseNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{driver.licenseClass}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {driver.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        driver.status === "active"
                          ? "default"
                          : driver.status === "suspended"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {driver.status === "active"
                        ? "Hoạt động"
                        : driver.status === "suspended"
                          ? "Tạm dừng"
                          : "Không hoạt động"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {driver.assignedVehicle ? (
                      <Badge variant="outline">{driver.assignedVehicle}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Chưa gán</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/drivers/${driver.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/drivers/${driver.id}/edit`}>
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
