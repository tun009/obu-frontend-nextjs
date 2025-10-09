"use client"

import { useState, useEffect } from "react"
import { JourneySessionForm } from "@/components/journey-sessions/journey-session-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Play, Square, Edit, Trash2, ChevronLeft, ChevronRight, MapPin, Search, Filter } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import journeySessionsAPI from "@/lib/services/journey-sessions-api"
import type { JourneySessionWithDetails } from "@/lib/types/api"
import { useTranslation } from "react-i18next"

// Real list component with API integration
function JourneySessionList({ onCreateClick, onEditClick, refreshTrigger }: {
  onCreateClick?: () => void
  onEditClick?: (session: JourneySessionWithDetails) => void
  refreshTrigger?: number
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const [sessions, setSessions] = useState<JourneySessionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // States for filter popover
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [tempStatus, setTempStatus] = useState<string>("all")
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined)

  const [deleteSession, setDeleteSession] = useState<JourneySessionWithDetails | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    pages: 0,
    has_more: false
  })

  const fetchSessions = async (page = 1, pageSize = 10, filters: { status?: string, search?: string, startDate?: Date, endDate?: Date } = {}) => {
    try {
      setLoading(true)
      const { status, search, startDate, endDate } = filters

      const response = await journeySessionsAPI.getJourneySessions({
        page,
        items_per_page: pageSize,
        status_filter: status === "all" ? undefined : status as any,
        search: search || undefined,
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
      })

      setSessions(response.data)
      setPagination({
        current: response.page,
        pageSize: response.items_per_page,
        total: response.total_count,
        has_more: response.has_more,
        pages: Math.ceil(response.total_count / response.items_per_page)
      })
    } catch (error: any) {
      toast.error(t('journeySessionsPage.toasts.load_error'))
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions(1, pagination.pageSize, { status: statusFilter, search: searchQuery, startDate: dateRange?.from, endDate: dateRange?.to })
  }, [refreshTrigger, statusFilter, searchQuery, dateRange])

  const handlePageChange = (page: number) => {
    fetchSessions(page, pagination.pageSize, { status: statusFilter, search: searchQuery, startDate: dateRange?.from, endDate: dateRange?.to })
  }
  const handleApplyFilters = () => {
    setStatusFilter(tempStatus)
    setDateRange(tempDateRange)
    setIsFilterOpen(false)
    fetchSessions(1, pagination.pageSize, { status: tempStatus, search: searchQuery, startDate: tempDateRange?.from, endDate: tempDateRange?.to })
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setDateRange(undefined)
    setTempStatus("all")
    setTempDateRange(undefined)
    setIsFilterOpen(false) // Close popover on clear
    fetchSessions(1, pagination.pageSize, { status: 'all', search: '', startDate: undefined, endDate: undefined })
  }

  const handleOpenFilter = (isOpen: boolean) => {
    if (isOpen) {
      // Sync temp state with main state when opening
      setTempStatus(statusFilter)
      setTempDateRange(dateRange)
    }
    setIsFilterOpen(isOpen)
  }

  const isFiltered = searchQuery !== "" || statusFilter !== "all" || !!dateRange;


  const handleStartSession = async (session: JourneySessionWithDetails) => {
    setActionLoading(session.id)
    try {
      await journeySessionsAPI.startJourneySession(session.id)
      toast.success(t('journeySessionsPage.toasts.start_success'))
      fetchSessions(pagination.current, pagination.pageSize, { status: statusFilter, search: searchQuery, startDate: dateRange?.from, endDate: dateRange?.to })
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || t('journeySessionsPage.toasts.generic_error'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleEndSession = async (session: JourneySessionWithDetails) => {
    setActionLoading(session.id)
    try {
      await journeySessionsAPI.endJourneySession(session.id)
      toast.success(t('journeySessionsPage.toasts.end_success'))
      fetchSessions(pagination.current, pagination.pageSize, { status: statusFilter, search: searchQuery, startDate: dateRange?.from, endDate: dateRange?.to })
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || t('journeySessionsPage.toasts.generic_error'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteSession) return

    setActionLoading(deleteSession.id)
    try {
      await journeySessionsAPI.deleteJourneySession(deleteSession.id)
      toast.success(t('journeySessionsPage.toasts.delete_success'))
      setDeleteSession(null)
      fetchSessions(pagination.current, pagination.pageSize, { status: statusFilter, search: searchQuery, startDate: dateRange?.from, endDate: dateRange?.to })
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || t('journeySessionsPage.toasts.generic_error'))
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t('journeySessionsPage.status.pending')}</Badge>
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">{t('journeySessionsPage.status.active')}</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">{t('journeySessionsPage.status.completed')}</Badge>
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{t('journeySessionsPage.title')}</CardTitle>
              <CardDescription>{t('journeySessionsPage.description', { total: pagination.total })}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('journeySessionsPage.searchPlaceholder')}
                  className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Popover open={isFilterOpen} onOpenChange={handleOpenFilter}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className={cn("shrink-0", isFiltered && "bg-primary/30 text-primary")}>
                    <Filter className="h-4 w-4" />
                    <span className="sr-only">{t('journeySessionsPage.filters.tooltip')}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">{t('journeySessionsPage.filters.title')}</h4>
                    </div>
                    <div className="grid gap-3">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="status">{t('journeySessionsPage.filters.statusLabel')}</Label>
                        <Select value={tempStatus} onValueChange={setTempStatus}>
                          <SelectTrigger id="status">
                            <SelectValue placeholder={t('journeySessionsPage.filters.statusPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('journeySessionsPage.status.all')}</SelectItem>
                            <SelectItem value="pending">{t('journeySessionsPage.status.pending')}</SelectItem>
                            <SelectItem value="active">{t('journeySessionsPage.status.active')}</SelectItem>
                            <SelectItem value="completed">{t('journeySessionsPage.status.completed')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label>{t('journeySessionsPage.filters.startLabel')}</Label>
                        <DateTimePicker
                          value={tempDateRange?.from}
                          onChange={(date) => setTempDateRange((prev) => ({ from: date, to: prev?.to }))}
                          placeholder={t('journeySessionsPage.filters.startPlaceholder')}
                          format24Hour={true}
                          maxDate={tempDateRange?.to}
                        />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label>{t('journeySessionsPage.filters.endLabel')}</Label>
                        <DateTimePicker
                          value={tempDateRange?.to}
                          onChange={(date) => setTempDateRange((prev) => ({ from: prev?.from, to: date }))}
                          placeholder={t('journeySessionsPage.filters.endPlaceholder')}
                          format24Hour={true}
                          minDate={tempDateRange?.from}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={handleClearFilters}>{t('journeySessionsPage.filters.clearButton')}</Button>
                      <Button onClick={handleApplyFilters}>{t('journeySessionsPage.filters.applyButton')}</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {onCreateClick && (
                <Button onClick={onCreateClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('journeySessionsPage.createButton')}
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
                  <TableHead className="w-[50px]">{t('journeySessionsPage.table.col_no')}</TableHead>
                  <TableHead>{t('journeySessionsPage.table.col_device')}</TableHead>
                  <TableHead>{t('journeySessionsPage.table.col_user')}</TableHead>
                  <TableHead>{t('journeySessionsPage.table.col_time')}</TableHead>
                  <TableHead>{t('journeySessionsPage.table.col_status')}</TableHead>
                  <TableHead>{t('journeySessionsPage.table.col_notes')}</TableHead>
                  <TableHead className="text-center w-40">{t('journeySessionsPage.table.col_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">{t('common.loading')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {t('journeySessionsPage.noSessions')}
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session, index) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {(pagination.current - 1) * pagination.pageSize + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                         {session.device_imei}
                           {session?.plate_number && (
                            <div className="text-xs text-muted-foreground">{t('journeySessionsPage.timeLabels.plate')} {session?.plate_number}</div>
                          )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{session.driver_name}</div>
                          {session?.driver_phone_number && (
                            <div className="text-xs text-muted-foreground">{t('journeySessionsPage.timeLabels.phone')} {session?.driver_phone_number}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{t('journeySessionsPage.timeLabels.start')} {formatDateTime(session.start_time)}</div>
                          <div>{t('journeySessionsPage.timeLabels.end')} {formatDateTime(session.end_time)}</div>
                          {session.activated_at && (
                            <div className="text-xs text-muted-foreground">
                              {t('journeySessionsPage.timeLabels.activated')} {formatDateTime(session.activated_at)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(session.status)}</TableCell>
                      <TableCell className="max-w-32 truncate">
                        {session.notes || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <div className="flex items-center justify-center gap-2">
                            {session.status === 'pending' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon" onClick={() => handleStartSession(session)} disabled={actionLoading === session.id} className="text-green-500 border-green-500 hover:bg-green-50 hover:text-green-600">
                                    <Play className="h-4 w-4" />
                                    <span className="sr-only">{t('journeySessionsPage.tooltips.start')}</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('journeySessionsPage.tooltips.start')}</p></TooltipContent>
                              </Tooltip>
                            )}
                            {(session.status === 'active' || session.status === 'completed') && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon" onClick={() => router.push(`/dashboard/journey-sessions/${session.id}`)} className="text-purple-500 border-purple-500 hover:bg-purple-50 hover:text-purple-600">
                                    <MapPin className="h-4 w-4" />
                                    <span className="sr-only">{t('journeySessionsPage.tooltips.view')}</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('journeySessionsPage.tooltips.view')}</p></TooltipContent>
                              </Tooltip>
                            )}
                            {session.status === 'active' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon" onClick={() => handleEndSession(session)} disabled={actionLoading === session.id} className="text-yellow-500 border-yellow-500 hover:bg-yellow-50 hover:text-yellow-600">
                                    <Square className="h-4 w-4" />
                                    <span className="sr-only">{t('journeySessionsPage.tooltips.end')}</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('journeySessionsPage.tooltips.end')}</p></TooltipContent>
                              </Tooltip>
                            )}
                            {session.status !== 'active' && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => onEditClick?.(session)} disabled={actionLoading === session.id} className="text-blue-500 border-blue-500 hover:bg-blue-50 hover:text-blue-600">
                                      <Edit className="h-4 w-4" />
                                      <span className="sr-only">{t('journeySessionsPage.tooltips.edit')}</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>{t('journeySessionsPage.tooltips.edit')}</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => setDeleteSession(session)} disabled={actionLoading === session.id} className="text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600">
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">{t('journeySessionsPage.tooltips.delete')}</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>{t('journeySessionsPage.tooltips.delete')}</p></TooltipContent>
                                </Tooltip>
                              </>
                            )}
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
                {t('common.pagination', {
                  from: (pagination.current - 1) * pagination.pageSize + 1,
                  to: Math.min(pagination.current * pagination.pageSize, pagination.total),
                  total: pagination.total,
                })}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('common.previous')}
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">{t('common.page')}</span>
                  <span className="text-sm font-medium">{pagination.current}</span>
                  <span className="text-sm text-muted-foreground">{t('common.of')} {pagination.pages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={!pagination.has_more}
                >
                  {t('common.next')}
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
            <AlertDialogTitle>{t('journeySessionsPage.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('journeySessionsPage.deleteDialog.description')}
              <br />
              <br />
              <strong>{t('journeySessionsPage.deleteDialog.infoDevice')}</strong> {deleteSession?.device_imei}
              <br />
              <strong>{t('journeySessionsPage.deleteDialog.infoUser')}</strong> {deleteSession?.driver_name}
              <br />
              <strong>{t('journeySessionsPage.deleteDialog.infoTime')}</strong> {deleteSession && formatDateTime(deleteSession.start_time)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('journeySessionsPage.deleteDialog.submitButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function JourneySessionsPage() {
  const { t } = useTranslation()
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
      <JourneySessionList
        onCreateClick={handleCreateClick}
        onEditClick={handleEditClick}
        refreshTrigger={refreshTrigger}
      />

      {/* Create Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('journeySessionsPage.createDialog.title')}</DialogTitle>
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
            <DialogTitle>{t('journeySessionsPage.editDialog.title')}</DialogTitle>
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
