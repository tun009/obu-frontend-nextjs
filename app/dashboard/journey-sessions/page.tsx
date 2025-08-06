"use client"

import { useState, useEffect } from "react"
import { JourneySessionForm } from "@/components/journey-sessions/journey-session-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, MoreHorizontal, Play, Square, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import journeySessionsAPI from "@/lib/services/journey-sessions-api"
import type { JourneySessionWithDetails } from "@/lib/types/api"

// Real list component with API integration
function JourneySessionList({ onCreateClick, onEditClick, refreshTrigger }: {
  onCreateClick?: () => void
  onEditClick?: (session: JourneySessionWithDetails) => void
  refreshTrigger?: number
}) {
  const [sessions, setSessions] = useState<JourneySessionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteSession, setDeleteSession] = useState<JourneySessionWithDetails | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    pages: 0
  })

  const fetchSessions = async (page = 1, pageSize = 10, status = statusFilter) => {
    try {
      setLoading(true)
      const response = await journeySessionsAPI.getJourneySessions({
        page,
        items_per_page: pageSize,
        status_filter: status === "all" ? undefined : status as any
      })

      setSessions(response.data)
      setPagination({
        current: response.page,
        pageSize: response.items_per_page,
        total: response.total,
        pages: response.pages
      })
    } catch (error: any) {
      toast.error('Không thể tải danh sách ca làm việc')
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [refreshTrigger])

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    fetchSessions(1, pagination.pageSize, value)
  }

  const handlePageChange = (page: number) => {
    fetchSessions(page, pagination.pageSize, statusFilter)
  }

  const handleStartSession = async (session: JourneySessionWithDetails) => {
    setActionLoading(session.id)
    try {
      await journeySessionsAPI.startJourneySession(session.id)
      toast.success('Bắt đầu ca làm việc thành công')
      fetchSessions(pagination.current, pagination.pageSize, statusFilter)
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Có lỗi xảy ra')
    } finally {
      setActionLoading(null)
    }
  }

  const handleEndSession = async (session: JourneySessionWithDetails) => {
    setActionLoading(session.id)
    try {
      await journeySessionsAPI.endJourneySession(session.id)
      toast.success('Kết thúc ca làm việc thành công')
      fetchSessions(pagination.current, pagination.pageSize, statusFilter)
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Có lỗi xảy ra')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteSession) return

    setActionLoading(deleteSession.id)
    try {
      await journeySessionsAPI.deleteJourneySession(deleteSession.id)
      toast.success('Xóa ca làm việc thành công')
      setDeleteSession(null)
      fetchSessions(pagination.current, pagination.pageSize, statusFilter)
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Có lỗi xảy ra')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Chờ bắt đầu</Badge>
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Đang hoạt động</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Đã hoàn thành</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách ca làm việc</CardTitle>
              <CardDescription>Tổng cộng {pagination.total} ca làm việc trong hệ thống</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ bắt đầu</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="completed">Đã hoàn thành</SelectItem>
                </SelectContent>
              </Select>
              {onCreateClick && (
                <Button onClick={onCreateClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo ca làm việc
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Xe</TableHead>
                  <TableHead>Tài xế</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Quãng đường</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="text-right w-20">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Đang tải...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Không có ca làm việc nào
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{session.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{session.vehicle_plate_number}</div>
                          {session.device_imei && (
                            <div className="text-xs text-muted-foreground">IMEI: {session.device_imei}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{session.driver_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Bắt đầu: {formatDateTime(session.start_time)}</div>
                          <div>Kết thúc: {formatDateTime(session.end_time)}</div>
                          {session.activated_at && (
                            <div className="text-xs text-muted-foreground">
                              Kích hoạt: {formatDateTime(session.activated_at)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(session.status)}</TableCell>
                      <TableCell className="text-right">
                        {session.total_distance_km ? `${session.total_distance_km} km` : '-'}
                      </TableCell>
                      <TableCell className="max-w-32 truncate">
                        {session.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              disabled={actionLoading === session.id}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {session.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleStartSession(session)}>
                                <Play className="mr-2 h-4 w-4" />
                                Bắt đầu
                              </DropdownMenuItem>
                            )}
                            {session.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleEndSession(session)}>
                                <Square className="mr-2 h-4 w-4" />
                                Kết thúc
                              </DropdownMenuItem>
                            )}
                            {session.status !== 'active' && (
                              <>
                                <DropdownMenuItem onClick={() => onEditClick?.(session)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteSession(session)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Xóa
                                </DropdownMenuItem>
                              </>
                            )}
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
                  disabled={pagination.current <= 1}
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
                  disabled={pagination.current >= pagination.pages}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSession} onOpenChange={() => setDeleteSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa ca làm việc này không? Hành động này không thể hoàn tác.
              <br />
              <br />
              <strong>Xe:</strong> {deleteSession?.vehicle_plate_number}
              <br />
              <strong>Tài xế:</strong> {deleteSession?.driver_name}
              <br />
              <strong>Thời gian:</strong> {deleteSession && formatDateTime(deleteSession.start_time)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function JourneySessionsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSession, setEditingSession] = useState<JourneySessionWithDetails | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreateClick = () => {
    setShowCreateForm(true)
  }

  const handleEditClick = (session: JourneySessionWithDetails) => {
    setEditingSession(session)
  }

  const handleFormSuccess = () => {
    setShowCreateForm(false)
    setEditingSession(null)
    // Trigger refresh of the list
    setRefreshTrigger(prev => prev + 1)
  }

  const handleFormCancel = () => {
    setShowCreateForm(false)
    setEditingSession(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ca làm việc</h1>
        <p className="text-muted-foreground">
          Quản lý ca làm việc của tài xế và xe trong hệ thống
        </p>
      </div>

      <JourneySessionList
        onCreateClick={handleCreateClick}
        onEditClick={handleEditClick}
        refreshTrigger={refreshTrigger}
      />

      {/* Create Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo ca làm việc mới</DialogTitle>
          </DialogHeader>
          <JourneySessionForm
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cập nhật ca làm việc</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <JourneySessionForm
              session={editingSession}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default JourneySessionsPage
