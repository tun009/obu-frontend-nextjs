"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Phone, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import Link from "next/link"
import driversAPI from "@/lib/services/drivers-api"
import type { Driver, CreateDriverRequest, UpdateDriverRequest } from "@/lib/types/api"

export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteDriver, setDeleteDriver] = useState<Driver | null>(null)
  const [editDriver, setEditDriver] = useState<Driver | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    pages: 0,
    has_more: false
  })

  const [formData, setFormData] = useState<CreateDriverRequest>({
    full_name: "",
    license_number: "",
    card_id: "",
    phone_number: ""
  })

  const fetchDrivers = async (page = 1, pageSize = 10, search = searchTerm) => {
    try {
      setLoading(true)
      const response = await driversAPI.getDrivers({
        page,
        items_per_page: pageSize,
        search: search || undefined
      })

      if (response) {
        setDrivers(response.data || [])
        setPagination({
          current: response.page,
          pageSize: response.items_per_page,
          total: response.total_count,
          has_more: response.has_more,
          pages: Math.floor(response.total_count / response.items_per_page) + 1
        })
      }
    } catch (error) {
      toast.error('Không thể tải danh sách tài xế')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  const handleSearch = () => {
    fetchDrivers(1, pagination.pageSize, searchTerm)
  }

  const handlePageChange = (page: number) => {
    fetchDrivers(page, pagination.pageSize, searchTerm)
  }

  const handleCreateDriver = async () => {
    try {
      setLoading(true)
      await driversAPI.createDriver(formData)
      toast.success('Tạo tài xế thành công')
      setShowCreateDialog(false)
      setFormData({
        full_name: "",
        license_number: "",
        card_id: "",
        phone_number: ""
      })
      fetchDrivers(pagination.current, pagination.pageSize, searchTerm)
    } catch (error: any) {
      if (error?.response?.status === 400) {
        const detail = error?.response?.data?.detail
        if (detail?.includes('License number')) {
          toast.error('Số GPLX đã tồn tại')
        } else if (detail?.includes('Phone number')) {
          toast.error('Số điện thoại đã tồn tại')
        } else if (detail?.includes('Card ID')) {
          toast.error('Số thẻ đã tồn tại')
        } else {
          toast.error('Dữ liệu đã tồn tại')
        }
      } else {
        toast.error('Có lỗi xảy ra khi tạo tài xế')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDriver = async () => {
    if (!editDriver) return

    try {
      setLoading(true)
      await driversAPI.updateDriver(editDriver.id, formData)
      toast.success('Cập nhật tài xế thành công')
      setEditDriver(null)
      setFormData({
        full_name: "",
        license_number: "",
        card_id: "",
        phone_number: ""
      })
      fetchDrivers(pagination.current, pagination.pageSize, searchTerm)
    } catch (error: any) {
      if (error?.response?.status === 400) {
        const detail = error?.response?.data?.detail
        if (detail?.includes('License number')) {
          toast.error('Số GPLX đã tồn tại')
        } else if (detail?.includes('Phone number')) {
          toast.error('Số điện thoại đã tồn tại')
        } else if (detail?.includes('Card ID')) {
          toast.error('Số thẻ đã tồn tại')
        } else {
          toast.error('Dữ liệu đã tồn tại')
        }
      } else if (error?.response?.status === 404) {
        toast.error('Không tìm thấy tài xế')
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật tài xế')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDriver) return

    try {
      setLoading(true)
      await driversAPI.deleteDriver(deleteDriver.id)
      toast.success('Xóa tài xế thành công')
      setDeleteDriver(null)
      fetchDrivers(pagination.current, pagination.pageSize, searchTerm)
    } catch (error: any) {
      if (error?.response?.status === 404) {
        toast.error('Không tìm thấy tài xế')
      } else {
        toast.error('Có lỗi xảy ra khi xóa tài xế')
      }
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setFormData({
      full_name: "",
      license_number: "",
      card_id: "",
      phone_number: ""
    })
    setShowCreateDialog(true)
  }

  const openEditDialog = (driver: Driver) => {
    setFormData({
      full_name: driver.full_name,
      license_number: driver.license_number,
      card_id: driver.card_id || "",
      phone_number: driver.phone_number || ""
    })
    setEditDriver(driver)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: vi })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách tài xế</CardTitle>
              <CardDescription>Tổng cộng {pagination.total} tài xế trong hệ thống</CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm tài xế mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, GPLX, SĐT..."
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
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Số GPLX</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Đang tải...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !drivers || drivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Không có tài xế nào
                    </TableCell>
                  </TableRow>
                ) : (
                  drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.full_name}</TableCell>
                      <TableCell>{driver.license_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {driver.phone_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(driver.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
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
                            <DropdownMenuItem onClick={() => openEditDialog(driver)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteDriver(driver)}
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

      {/* Create Driver Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm tài xế mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin tài xế mới vào hệ thống
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Họ và tên *</Label>
              <Input
                id="full_name"
                placeholder="Nguyễn Văn A"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_number">Số GPLX *</Label>
              <Input
                id="license_number"
                placeholder="123456789"
                value={formData.license_number}
                onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Số điện thoại</Label>
              <Input
                id="phone_number"
                placeholder="0901234567"
                value={formData.phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateDriver}
              disabled={loading || !formData.full_name || !formData.license_number}
            >
              Tạo tài xế
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={!!editDriver} onOpenChange={() => setEditDriver(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật tài xế</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin tài xế: {editDriver?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Họ và tên *</Label>
              <Input
                id="edit_full_name"
                placeholder="Nguyễn Văn A"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_license_number">Số GPLX *</Label>
              <Input
                id="edit_license_number"
                placeholder="123456789"
                value={formData.license_number}
                onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone_number">Số điện thoại</Label>
              <Input
                id="edit_phone_number"
                placeholder="0901234567"
                value={formData.phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDriver(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleUpdateDriver}
              disabled={loading || !formData.full_name || !formData.license_number}
            >
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDriver} onOpenChange={() => setDeleteDriver(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tài xế</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tài xế này không? Hành động này không thể hoàn tác.
              <br />
              <br />
              <strong>Họ tên:</strong> {deleteDriver?.full_name}
              <br />
              <strong>Số GPLX:</strong> {deleteDriver?.license_number}
              <br />
              <strong>Số điện thoại:</strong> {deleteDriver?.phone_number || 'Không có'}
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
              Xóa tài xế
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
