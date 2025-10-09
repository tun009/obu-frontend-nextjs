"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import Link from "next/link"
import devicesAPI from "@/lib/services/devices-api"
import type { Device, CreateDeviceRequest, UpdateDeviceRequest } from "@/lib/types/api"

export default function DevicesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteDevice, setDeleteDevice] = useState<Device | null>(null)
  const [editDevice, setEditDevice] = useState<Device | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

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

  const fetchDevices = async (page = 1, pageSize = 10, search = debouncedSearchQuery) => {
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
          pages: Math.ceil(response.total_count / response.items_per_page)
        })
      }
    } catch (error) {
      toast.error('Không thể tải danh sách thiết bị')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices(1, pagination.pageSize, debouncedSearchQuery)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery])

  const handlePageChange = (page: number) => {
    fetchDevices(page, pagination.pageSize, debouncedSearchQuery)
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
      fetchDevices(pagination.current, pagination.pageSize, debouncedSearchQuery)
    } catch (error: any) {
      if (error?.status === 400) {
        toast.error(error.details?.detail ?? 'Có lỗi xảy ra khi tạo thiết bị')
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
      fetchDevices(pagination.current, pagination.pageSize, debouncedSearchQuery)
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
      fetchDevices(pagination.current, pagination.pageSize, debouncedSearchQuery)
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

  

  

  const openCreateDialog = () => {
    setFormData({
      imei: "",
      serial_number: "",
      firmware_version: ""
    })
    setShowCreateDialog(true)
  }

  const openEditDialog = (device: Device) => {
    setFormData({
      imei: device.imei,
      serial_number: device.serial_number || "",
      firmware_version: device.firmware_version || ""
    })
    setEditDevice(device)
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Danh sách thiết bị</CardTitle>
              <CardDescription>Tổng cộng {pagination.total} thiết bị trong hệ thống</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm theo Device No..."
                  className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm thiết bị
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">STT</TableHead>
                  <TableHead>Device No</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Firmware</TableHead>
                  <TableHead>Ngày cài đặt</TableHead>
                  <TableHead className="text-center w-40">Thao tác</TableHead>
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
                  devices.map((device, index) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">
                        {(pagination.current - 1) * pagination.pageSize + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{device.imei}</TableCell>
                      <TableCell>{device.serial_number || '-'}</TableCell>
                      <TableCell>{device.firmware_version || '-'}</TableCell>
                      <TableCell>{formatDate(device.installed_at)}</TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <div className="flex items-center justify-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openEditDialog(device)}
                                  disabled={loading}
                                  className="text-blue-500 border-blue-500 hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Sửa</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Sửa</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setDeleteDevice(device)}
                                  disabled={loading}
                                  className="text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Xóa</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Xóa</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
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
