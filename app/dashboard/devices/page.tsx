"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Wifi, WifiOff, LinkIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import Link from "next/link"
import devicesAPI from "@/lib/services/devices-api"
import type { Device, CreateDeviceRequest, UpdateDeviceRequest, Vehicle } from "@/lib/types/api"

export default function DevicesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteDevice, setDeleteDevice] = useState<Device | null>(null)
  const [editDevice, setEditDevice] = useState<Device | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [assignDevice, setAssignDevice] = useState<Device | null>(null)
  const [unassignDevice, setUnassignDevice] = useState<Device | null>(null)
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    pages: 0,
    has_more: false
  })

  const [formData, setFormData] = useState<CreateDeviceRequest>({
    imei: "",
    serial_number: "",
    firmware_version: ""
  })

  const fetchDevices = async (page = 1, pageSize = 10, search = searchTerm) => {
    try {
      setLoading(true)
      const response = await devicesAPI.getDevices({
        page,
        items_per_page: pageSize,
        search: search || undefined
      })

      if (response) {
        setDevices(response.data || [])
        setPagination({
          current: response.page,
          pageSize: response.items_per_page,
          total: response.total_count,
          has_more: response.has_more,
          pages: Math.floor(response.total_count / response.items_per_page) + 1
        })
      }
    } catch (error) {
      toast.error('Không thể tải danh sách thiết bị')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableVehicles = async () => {
    try {
      const vehicles = await devicesAPI.getUnassignedVehicles()
      setAvailableVehicles(vehicles)
    } catch (error) {
      toast.error('Không thể tải danh sách xe')
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const handleSearch = () => {
    fetchDevices(1, pagination.pageSize, searchTerm)
  }

  const handlePageChange = (page: number) => {
    fetchDevices(page, pagination.pageSize, searchTerm)
  }

  const handleCreateDevice = async () => {
    try {
      setLoading(true)
      await devicesAPI.createDevice(formData)
      toast.success('Tạo thiết bị thành công')
      setShowCreateDialog(false)
      setFormData({
        imei: "",
        serial_number: "",
        firmware_version: ""
      })
      fetchDevices(pagination.current, pagination.pageSize, searchTerm)
    } catch (error: any) {
      if (error?.response?.status === 400) {
        const detail = error?.response?.data?.detail
        if (detail?.includes('Device No')) {
          toast.error('Device No đã tồn tại')
        } else if (detail?.includes('Serial number')) {
          toast.error('Số serial đã tồn tại')
        } else if (detail?.includes('Vehicle')) {
          toast.error('Xe đã được gán thiết bị khác')
        } else {
          toast.error('Dữ liệu đã tồn tại')
        }
      } else {
        toast.error('Có lỗi xảy ra khi tạo thiết bị')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDevice = async () => {
    if (!editDevice) return

    try {
      setLoading(true)
      await devicesAPI.updateDevice(editDevice.id, formData)
      toast.success('Cập nhật thiết bị thành công')
      setEditDevice(null)
      setFormData({
        imei: "",
        serial_number: "",
        firmware_version: ""

      })
      fetchDevices(pagination.current, pagination.pageSize, searchTerm)
    } catch (error: any) {
      if (error?.response?.status === 400) {
        const detail = error?.response?.data?.detail
        if (detail?.includes('Device No')) {
          toast.error('Device No đã tồn tại')
        } else if (detail?.includes('Serial number')) {
          toast.error('Số serial đã tồn tại')
        } else {
          toast.error('Dữ liệu đã tồn tại')
        }
      } else if (error?.response?.status === 404) {
        toast.error('Không tìm thấy thiết bị')
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật thiết bị')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDevice) return

    try {
      setLoading(true)
      await devicesAPI.deleteDevice(deleteDevice.id)
      toast.success('Xóa thiết bị thành công')
      setDeleteDevice(null)
      fetchDevices(pagination.current, pagination.pageSize, searchTerm)
    } catch (error: any) {
      if (error?.response?.status === 404) {
        toast.error('Không tìm thấy thiết bị')
      } else {
        toast.error('Có lỗi xảy ra khi xóa thiết bị')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAssignDevice = async () => {
    if (!assignDevice || !selectedVehicleId) return

    try {
      setLoading(true)
      await devicesAPI.assignDeviceToVehicle(assignDevice.id, selectedVehicleId)
      toast.success('Gán thiết bị cho xe thành công')
      setShowAssignDialog(false)
      setAssignDevice(null)
      setSelectedVehicleId("")
      fetchDevices(pagination.current, pagination.pageSize, searchTerm)
    } catch (error: any) {
      if (error?.response?.status === 400) {
        toast.error('Xe đã được gán thiết bị khác')
      } else if (error?.response?.status === 404) {
        toast.error('Không tìm thấy thiết bị hoặc xe')
      } else {
        toast.error('Có lỗi xảy ra khi gán thiết bị')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUnassignConfirm = async () => {
    if (!unassignDevice) return

    try {
      setLoading(true)
      await devicesAPI.unassignDeviceFromVehicle(unassignDevice.id)
      toast.success('Hủy gán thiết bị thành công')
      setUnassignDevice(null)
      fetchDevices(pagination.current, pagination.pageSize, searchTerm)
    } catch (error: any) {
      if (error?.response?.status === 404) {
        toast.error('Không tìm thấy thiết bị')
      } else {
        toast.error('Có lỗi xảy ra khi hủy gán thiết bị')
      }
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setFormData({
      imei: "",
      serial_number: "",
      firmware_version: "",

    })
    setShowCreateDialog(true)
  }

  const openEditDialog = (device: Device) => {
    setFormData({
      imei: device.imei,
      serial_number: device.serial_number || "",
      firmware_version: device.firmware_version || "",

    })
    setEditDevice(device)
  }

  const openAssignDialog = async (device: Device) => {
    setAssignDevice(device)
    setSelectedVehicleId("")
    await fetchAvailableVehicles()
    setShowAssignDialog(true)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi })
    } catch {
      return dateString
    }
  }

  // Calculate stats
  const totalDevices = pagination.total
  const assignedDevices = devices.filter(d => d.vehicle_id).length
  const unassignedDevices = devices.filter(d => !d.vehicle_id).length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thiết bị</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã gán xe</CardTitle>
            <LinkIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {assignedDevices}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chưa gán xe</CardTitle>
            <WifiOff className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {unassignedDevices}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng xe có sẵn</CardTitle>
            <Wifi className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {availableVehicles.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách thiết bị</CardTitle>
              <CardDescription>Tổng cộng {pagination.total} thiết bị trong hệ thống</CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm thiết bị mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo Device No, Serial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Tìm kiếm
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device No</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Firmware</TableHead>
                  <TableHead>Xe được gán</TableHead>
                  <TableHead>Ngày cài đặt</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Đang tải...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !devices || devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Không có thiết bị nào
                    </TableCell>
                  </TableRow>
                ) : (
                  devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{device.imei}</TableCell>
                      <TableCell>{device.serial_number || '-'}</TableCell>
                      <TableCell>{device.firmware_version || '-'}</TableCell>
                      <TableCell>
                        {device.vehicle_plate_number ? (
                          <Badge variant="outline" className="font-mono">
                            {device.vehicle_plate_number}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Chưa gán</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(device.installed_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
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
                            {device.vehicle_id ? (
                              <DropdownMenuItem onClick={() => setUnassignDevice(device)}>
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Hủy gán xe
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => openAssignDialog(device)}>
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Gán xe
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => openEditDialog(device)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteDevice(device)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Hiển thị {(pagination.current - 1) * pagination.pageSize + 1} đến {Math.min(pagination.current * pagination.pageSize, pagination.total)} trong tổng số {pagination.total} kết quả
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">Trang</span>
                  <span className="text-sm font-medium">{pagination.current}</span>
                  <span className="text-sm text-muted-foreground">trên {pagination.pages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={!pagination.has_more}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Device Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm thiết bị mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin thiết bị OBU mới vào hệ thống
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imei">Device No *</Label>
              <Input
                id="imei"
                placeholder="OBU-001234"
                value={formData.imei}
                onChange={(e) => setFormData(prev => ({ ...prev, imei: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                placeholder="SN001234567"
                value={formData.serial_number}
                onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firmware_version">Firmware Version</Label>
              <Input
                id="firmware_version"
                placeholder="v1.0.0"
                value={formData.firmware_version}
                onChange={(e) => setFormData(prev => ({ ...prev, firmware_version: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateDevice}
              disabled={loading || !formData.imei}
            >
              Tạo thiết bị
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={!!editDevice} onOpenChange={() => setEditDevice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật thiết bị</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin thiết bị: {editDevice?.imei}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_imei">Device No *</Label>
              <Input
                id="edit_imei"
                placeholder="OBU-001234"
                value={formData.imei}
                onChange={(e) => setFormData(prev => ({ ...prev, imei: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_serial_number">Serial Number</Label>
              <Input
                id="edit_serial_number"
                placeholder="SN001234567"
                value={formData.serial_number}
                onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_firmware_version">Firmware Version</Label>
              <Input
                id="edit_firmware_version"
                placeholder="v1.0.0"
                value={formData.firmware_version}
                onChange={(e) => setFormData(prev => ({ ...prev, firmware_version: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDevice(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleUpdateDevice}
              disabled={loading || !formData.imei}
            >
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Device Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gán thiết bị cho xe</DialogTitle>
            <DialogDescription>
              Chọn xe để gán cho thiết bị: {assignDevice?.imei}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle_select">Chọn xe</Label>
              {availableVehicles.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 border rounded-md">
                  Không có xe nào khả dụng để gán
                </div>
              ) : (
                <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn xe..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate_number} {vehicle.type && `(${vehicle.type})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleAssignDevice}
              disabled={loading || !selectedVehicleId || availableVehicles.length === 0}
            >
              Gán thiết bị
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Confirmation Dialog */}
      <AlertDialog open={!!unassignDevice} onOpenChange={() => setUnassignDevice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy gán thiết bị</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy gán thiết bị này khỏi xe không?
              <br />
              <br />
              <strong>Device No:</strong> {unassignDevice?.imei}
              <br />
              <strong>Serial Number:</strong> {unassignDevice?.serial_number || 'Không có'}
              <br />
              <strong>Xe hiện tại:</strong> {unassignDevice?.vehicle_plate_number || 'Chưa gán'}
              <br />
              <br />
              Sau khi hủy gán, thiết bị sẽ có thể được gán cho xe khác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnassignConfirm}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={loading}
            >
              Hủy gán thiết bị
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDevice} onOpenChange={() => setDeleteDevice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa thiết bị</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa thiết bị này không? Hành động này không thể hoàn tác.
              <br />
              <br />
              <strong>Device No:</strong> {deleteDevice?.imei}
              <br />
              <strong>Serial Number:</strong> {deleteDevice?.serial_number || 'Không có'}
              <br />
              <strong>Firmware:</strong> {deleteDevice?.firmware_version || 'Không có'}
              <br />
              <strong>Xe được gán:</strong> {deleteDevice?.vehicle_plate_number || 'Chưa gán'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              Xóa thiết bị
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
