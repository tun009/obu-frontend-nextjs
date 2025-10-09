"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Weight, Car } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import vehiclesAPI from "@/lib/services/vehicles-api"
import type { Vehicle, CreateVehicleRequest, UpdateVehicleRequest } from "@/lib/types/api"

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    pages: 0,
    has_more: false
  })

  const [formData, setFormData] = useState<CreateVehicleRequest>({
    plate_number: "",
    type: "",
    load_capacity_kg: undefined
  })

  const fetchVehicles = async (page = 1, pageSize = 10, search = debouncedSearchQuery) => {
    try {
      setLoading(true)
      const response = await vehiclesAPI.getVehicles({
        page,
        items_per_page: pageSize,
        search: search || undefined
      })

      if (response) {
        setVehicles(response.data || [])
        setPagination({
          current: response.page,
          pageSize: response.items_per_page,
          total: response.total_count,
          has_more: response.has_more,
          pages: Math.ceil(response.total_count / response.items_per_page)
        })
      }
    } catch (error) {
      toast.error('Không thể tải danh sách xe')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles(1, pagination.pageSize, debouncedSearchQuery)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery])

  const handlePageChange = (page: number) => {
    fetchVehicles(page, pagination.pageSize, debouncedSearchQuery)
  }

  const handleCreateVehicle = async () => {
    try {
      setLoading(true)
      await vehiclesAPI.createVehicle(formData)
      toast.success('Tạo xe thành công')
      setShowCreateDialog(false)
      setFormData({ plate_number: "", type: "", load_capacity_kg: undefined })
      fetchVehicles(1, pagination.pageSize, "") // Refetch from page 1 without search
    } catch (error: any) {
      if (error?.response?.status === 400) {
        toast.error('Biển số xe đã tồn tại')
      } else {
        toast.error('Có lỗi xảy ra khi tạo xe')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateVehicle = async () => {
    if (!editVehicle) return
    try {
      setLoading(true)
      await vehiclesAPI.updateVehicle(editVehicle.id, formData)
      toast.success('Cập nhật xe thành công')
      setEditVehicle(null)
      setFormData({ plate_number: "", type: "", load_capacity_kg: undefined })
      fetchVehicles(pagination.current, pagination.pageSize, debouncedSearchQuery)
    } catch (error: any) {
      if (error?.response?.status === 404) {
        toast.error('Không tìm thấy xe')
      } else if (error?.response?.status === 400) {
        toast.error('Biển số xe đã tồn tại')
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật xe')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteVehicle) return
    try {
      setLoading(true)
      await vehiclesAPI.deleteVehicle(deleteVehicle.id)
      toast.success('Xóa xe thành công')
      setDeleteVehicle(null)
      fetchVehicles(pagination.current, pagination.pageSize, debouncedSearchQuery)
    } catch (error: any) {
      if (error?.response?.status === 404) {
        toast.error('Không tìm thấy xe')
      } else {
        toast.error('Có lỗi xảy ra khi xóa xe')
      }
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setFormData({ plate_number: "", type: "", load_capacity_kg: undefined })
    setShowCreateDialog(true)
  }

  const openEditDialog = (vehicle: Vehicle) => {
    setFormData({ 
      plate_number: vehicle.plate_number, 
      type: vehicle.type || "", 
      load_capacity_kg: vehicle.load_capacity_kg || undefined 
    })
    setEditVehicle(vehicle)
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Danh sách xe tuần tra</CardTitle>
              <CardDescription>Tổng cộng {pagination.total} xe trong hệ thống</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm theo biển số xe..."
                  className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm xe
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
                  <TableHead>Biển số xe</TableHead>
                  <TableHead>Loại xe</TableHead>
                  <TableHead>Tải trọng (kg)</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-center w-[120px]">Thao tác</TableHead>
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
                ) : !vehicles || vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Không có xe nào
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicles.map((vehicle, index) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        {(pagination.current - 1) * pagination.pageSize + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{vehicle.plate_number}</TableCell>
                      <TableCell>{vehicle.type || '-'}</TableCell>
                      <TableCell>{vehicle.load_capacity_kg || '-'}</TableCell>
                      <TableCell>{formatDate(vehicle.created_at)}</TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <div className="flex items-center justify-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openEditDialog(vehicle)}
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
                                  onClick={() => setDeleteVehicle(vehicle)}
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm xe mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin xe mới vào hệ thống
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plate_number">Biển số xe <span className="text-destructive">*</span></Label>
              <Input
                id="plate_number"
                placeholder="29A-12345"
                value={formData.plate_number}
                onChange={(e) => setFormData(prev => ({ ...prev, plate_number: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Loại xe</Label>
              <Input
                id="type"
                placeholder="Xe tải, bán tải..."
                value={formData.type || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="load_capacity_kg">Tải trọng (kg)</Label>
              <Input
                id="load_capacity_kg"
                type="number"
                placeholder="1000"
                value={formData.load_capacity_kg || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, load_capacity_kg: e.target.value ? parseInt(e.target.value) : undefined }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateVehicle}
              disabled={loading || !formData.plate_number}
            >
              Tạo xe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editVehicle} onOpenChange={() => setEditVehicle(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cập nhật xe</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin xe: {editVehicle?.plate_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_plate_number">Biển số xe <span className="text-destructive">*</span></Label>
              <Input
                id="edit_plate_number"
                placeholder="29A-12345"
                value={formData.plate_number}
                onChange={(e) => setFormData(prev => ({ ...prev, plate_number: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_type">Loại xe</Label>
              <Input
                id="edit_type"
                placeholder="Xe tải, bán tải..."
                value={formData.type || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_load_capacity_kg">Tải trọng (kg)</Label>
              <Input
                id="edit_load_capacity_kg"
                type="number"
                placeholder="1000"
                value={formData.load_capacity_kg || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, load_capacity_kg: e.target.value ? parseInt(e.target.value) : undefined }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVehicle(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleUpdateVehicle}
              disabled={loading || !formData.plate_number}
            >
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteVehicle} onOpenChange={() => setDeleteVehicle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa xe</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa xe này không? Hành động này không thể hoàn tác.
              <br />
              <br />
              <strong>Biển số:</strong> {deleteVehicle?.plate_number}
              <br />
              <strong>Loại xe:</strong> {deleteVehicle?.type || 'Không có'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              Xóa xe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

