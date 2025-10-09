"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, Phone, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import driversAPI from "@/lib/services/drivers-api"
import type { Driver, CreateDriverRequest, UpdateDriverRequest } from "@/lib/types/api"

export default function DriversPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
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
    phone_number: ""
  })

  const fetchDrivers = async (page = 1, pageSize = 10, search = debouncedSearchQuery) => {
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
          pages: Math.ceil(response.total_count / response.items_per_page)
        })
      }
    } catch (error) {
      toast.error(t('usersPage.toasts.load_error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers(1, pagination.pageSize, debouncedSearchQuery)
  }, [debouncedSearchQuery])

  const handlePageChange = (page: number) => {
    fetchDrivers(page, pagination.pageSize, debouncedSearchQuery)
  }

  const handleCreateDriver = async () => {
    try {
      setLoading(true)
      await driversAPI.createDriver(formData)
      toast.success(t('usersPage.toasts.create_success'))
      setShowCreateDialog(false)
      setFormData({ full_name: "", phone_number: "" })
      fetchDrivers(pagination.current, pagination.pageSize, debouncedSearchQuery)
    } catch (error: any) {
      if (error?.response?.status === 400) {
        toast.error(t('usersPage.toasts.create_error_duplicate'))
      } else {
        toast.error(t('usersPage.toasts.create_error_generic'))
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
      toast.success(t('usersPage.toasts.update_success'))
      setEditDriver(null)
      setFormData({ full_name: "", phone_number: "" })
      fetchDrivers(pagination.current, pagination.pageSize, debouncedSearchQuery)
    } catch (error: any) {
      if (error?.response?.status === 404) {
        toast.error(t('usersPage.toasts.update_error_notfound'))
      } else {
        toast.error(t('usersPage.toasts.update_error_generic'))
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
      toast.success(t('usersPage.toasts.delete_success'))
      setDeleteDriver(null)
      fetchDrivers(pagination.current, pagination.pageSize, debouncedSearchQuery)
    } catch (error: any) {
      if (error?.response?.status === 404) {
        toast.error(t('usersPage.toasts.delete_error_notfound'))
      } else {
        toast.error(t('usersPage.toasts.delete_error_generic'))
      }
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setFormData({ full_name: "", phone_number: "" })
    setShowCreateDialog(true)
  }

  const openEditDialog = (driver: Driver) => {
    setFormData({ full_name: driver.full_name, phone_number: driver.phone_number || "" })
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{t('usersPage.title')}</CardTitle>
              <CardDescription>{t('usersPage.description', { total: pagination.total })}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('usersPage.searchPlaceholder')}
                  className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                {t('usersPage.addUserButton')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">{t('usersPage.table.col_no')}</TableHead>
                  <TableHead>{t('usersPage.table.col_fullName')}</TableHead>
                  <TableHead>{t('usersPage.table.col_phoneNumber')}</TableHead>
                  <TableHead>{t('usersPage.table.col_createdAt')}</TableHead>
                  <TableHead className="text-center w-[200px]">{t('usersPage.table.col_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">{t('common.loading')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !drivers || drivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      {t('usersPage.noUsers')}
                    </TableCell>
                  </TableRow>
                ) : (
                  drivers.map((driver, index) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">
                        {(pagination.current - 1) * pagination.pageSize + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{driver.full_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {driver.phone_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(driver.created_at)}</TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <div className="flex items-center justify-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openEditDialog(driver)}
                                  disabled={loading}
                                  className="text-blue-500 border-blue-500 hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">{t('common.edit')}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('common.edit')}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setDeleteDriver(driver)}
                                  disabled={loading}
                                  className="text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">{t('common.delete')}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('common.delete')}</p>
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
                {t('usersPage.pagination', {
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
                  disabled={pagination.current <= 1 || loading}
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('usersPage.createDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('usersPage.createDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t('usersPage.createDialog.fullNameLabel')} <span className="text-destructive">*</span></Label>
              <Input
                id="full_name"
                placeholder={t('usersPage.createDialog.fullNamePlaceholder')}
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">{t('usersPage.createDialog.phoneLabel')}</Label>
              <Input
                id="phone_number"
                placeholder={t('usersPage.createDialog.phonePlaceholder')}
                value={formData.phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateDriver}
              disabled={loading || !formData.full_name}
            >
              {t('usersPage.createDialog.submitButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDriver} onOpenChange={() => setEditDriver(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('usersPage.editDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('usersPage.editDialog.description', { name: editDriver?.full_name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">{t('usersPage.createDialog.fullNameLabel')} <span className="text-destructive">*</span></Label>
              <Input
                id="edit_full_name"
                placeholder={t('usersPage.createDialog.fullNamePlaceholder')}
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone_number">{t('usersPage.createDialog.phoneLabel')}</Label>
              <Input
                id="edit_phone_number"
                placeholder={t('usersPage.createDialog.phonePlaceholder')}
                value={formData.phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDriver(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpdateDriver}
              disabled={loading || !formData.full_name}
            >
              {t('usersPage.editDialog.submitButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDriver} onOpenChange={() => setDeleteDriver(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('usersPage.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('usersPage.deleteDialog.description')}
              <br />
              <br />
              <strong>{t('usersPage.deleteDialog.infoName')}</strong> {deleteDriver?.full_name}
              <br />
              <strong>{t('usersPage.deleteDialog.infoPhone')}</strong> {deleteDriver?.phone_number || t('common.none')}
              <br />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {t('usersPage.deleteDialog.submitButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

