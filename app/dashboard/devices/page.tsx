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
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Car, Unlink, LinkIcon } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import devicesAPI from "@/lib/services/devices-api"
import vehiclesAPI from "@/lib/services/vehicles-api"
import type { Device, CreateDeviceRequest, Vehicle } from "@/lib/types/api"
import { useTranslation } from "react-i18next"

export default function DevicesPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteDevice, setDeleteDevice] = useState<Device | null>(null)
  const [editDevice, setEditDevice] = useState<Device | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [assignDevice, setAssignDevice] = useState<Device | null>(null)
  const [unassignDevice, setUnassignDevice] = useState<Device | null>(null)
  const [unassignedVehicles, setUnassignedVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

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
      toast.error(t('devicesPage.toasts.load_error'))
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
      toast.success(t('devicesPage.toasts.create_success'))
      setShowCreateDialog(false)
      setFormData({
        imei: "",
        serial_number: "",
        firmware_version: ""
      })
      fetchDevices(pagination.current, pagination.pageSize, debouncedSearchQuery)
    } catch (error: any) {
      if (error?.status === 400) {
        toast.error(error.details?.detail ?? t('devicesPage.toasts.create_error_generic'))
      } else {
        toast.error(t('devicesPage.toasts.create_error_generic'))
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
      toast.success(t('devicesPage.toasts.update_success'))
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
          toast.error(t('devicesPage.toasts.update_error_duplicate_imei'))
        } else if (detail?.includes('Serial number')) {
          toast.error(t('devicesPage.toasts.update_error_duplicate_serial'))
        } else {
          toast.error(t('devicesPage.toasts.update_error_duplicate_generic'))
        }
      } else if (error?.response?.status === 404) {
        toast.error(t('devicesPage.toasts.update_error_notfound'))
      } else {
        toast.error(t('devicesPage.toasts.update_error_generic'))
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
      toast.success(t('devicesPage.toasts.delete_success'))
      setDeleteDevice(null)
      fetchDevices(pagination.current, pagination.pageSize, debouncedSearchQuery)
    } catch (error: any) {
      if (error?.response?.status === 404) {
        toast.error(t('devicesPage.toasts.delete_error_notfound'))
      } else {
        toast.error(t('devicesPage.toasts.delete_error_generic'))
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

  const openAssignDialog = async (device: Device) => {
    try {
      setLoading(true);
      const vehicles = await vehiclesAPI.getUnassignedVehicles();
      setUnassignedVehicles(vehicles);
      setAssignDevice(device);
      setSelectedVehicleId(null);
    } catch (error) {
      toast.error(t('devicesPage.toasts.load_unassigned_vehicles_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDevice = async () => {
    if (!assignDevice || !selectedVehicleId) return;
    try {
      setLoading(true);
      await devicesAPI.assignDeviceToVehicle(assignDevice.id, selectedVehicleId);
      toast.success(t('devicesPage.toasts.assign_success'));
      setAssignDevice(null);
      fetchDevices(pagination.current, pagination.pageSize, debouncedSearchQuery);
    } catch (error) {
      toast.error(t('devicesPage.toasts.assign_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignConfirm = async () => {
    if (!unassignDevice) return;
    try {
      setLoading(true);
      await devicesAPI.unassignDeviceFromVehicle(unassignDevice.id);
      toast.success(t('devicesPage.toasts.unassign_success'));
      setUnassignDevice(null);
      fetchDevices(pagination.current, pagination.pageSize, debouncedSearchQuery);
    } catch (error) {
      toast.error(t('devicesPage.toasts.unassign_error'));
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi })
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
              <CardTitle>{t('devicesPage.title')}</CardTitle>
              <CardDescription>{t('devicesPage.description', { total: pagination.total })}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('devicesPage.searchPlaceholder')}
                  className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                {t('devicesPage.addDeviceButton')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">{t('devicesPage.table.col_no')}</TableHead>
                  <TableHead>{t('devicesPage.table.col_deviceNo')}</TableHead>
                  <TableHead>{t('devicesPage.table.col_serial')}</TableHead>
                  <TableHead>{t('devicesPage.table.col_firmware')}</TableHead>
                  <TableHead>{t('devicesPage.table.col_assignedVehicle')}</TableHead>
                  <TableHead>{t('devicesPage.table.col_installedAt')}</TableHead>
                  <TableHead className="text-center w-40">{t('devicesPage.table.col_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">{t('common.loading')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !devices || devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {t('devicesPage.noDevices')}
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
                      <TableCell>
                        {device.plate_number ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            {device.plate_number}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{t('devicesPage.unassigned')}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(device.installed_at)}</TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <div className="flex items-center justify-center gap-1">
                            {device.vehicle_id ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setUnassignDevice(device)}
                                    disabled={loading}
                                    className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                                  >
                                    <Unlink className="h-4 w-4" />
                                    <span className="sr-only">{t('devicesPage.tooltips.unassign')}</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('devicesPage.tooltips.unassign')}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => openAssignDialog(device)}
                                    disabled={loading}
                                    className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                                  >
                                    <LinkIcon className="h-4 w-4" />
                                    <span className="sr-only">{t('devicesPage.tooltips.assign')}</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('devicesPage.tooltips.assign')}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
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
                                  <span className="sr-only">{t('devicesPage.tooltips.edit')}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('devicesPage.tooltips.edit')}</p>
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
                                  <span className="sr-only">{t('devicesPage.tooltips.delete')}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('devicesPage.tooltips.delete')}</p>
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

      {/* Create Device Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('devicesPage.createDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('devicesPage.createDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imei">{t('devicesPage.createDialog.deviceNoLabel')} <span className="text-destructive">*</span></Label>
              <Input
                id="imei"
                placeholder={t('devicesPage.createDialog.deviceNoPlaceholder')}
                value={formData.imei}
                onChange={(e) => setFormData(prev => ({ ...prev, imei: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial_number">{t('devicesPage.createDialog.serialLabel')}</Label>
              <Input
                id="serial_number"
                placeholder={t('devicesPage.createDialog.serialPlaceholder')}
                value={formData.serial_number}
                onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firmware_version">{t('devicesPage.createDialog.firmwareLabel')}</Label>
              <Input
                id="firmware_version"
                placeholder={t('devicesPage.createDialog.firmwarePlaceholder')}
                value={formData.firmware_version}
                onChange={(e) => setFormData(prev => ({ ...prev, firmware_version: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateDevice}
              disabled={loading || !formData.imei}
            >
              {t('devicesPage.createDialog.submitButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={!!editDevice} onOpenChange={() => setEditDevice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('devicesPage.editDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('devicesPage.editDialog.description', { imei: editDevice?.imei })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_imei">{t('devicesPage.createDialog.deviceNoLabel')} <span className="text-destructive">*</span></Label>
              <Input
                id="edit_imei"
                placeholder={t('devicesPage.createDialog.deviceNoPlaceholder')}
                value={formData.imei}
                onChange={(e) => setFormData(prev => ({ ...prev, imei: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_serial_number">{t('devicesPage.createDialog.serialLabel')}</Label>
              <Input
                id="edit_serial_number"
                placeholder={t('devicesPage.createDialog.serialPlaceholder')}
                value={formData.serial_number}
                onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_firmware_version">{t('devicesPage.createDialog.firmwareLabel')}</Label>
              <Input
                id="edit_firmware_version"
                placeholder={t('devicesPage.createDialog.firmwarePlaceholder')}
                value={formData.firmware_version}
                onChange={(e) => setFormData(prev => ({ ...prev, firmware_version: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDevice(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpdateDevice}
              disabled={loading || !formData.imei}
            >
              {t('devicesPage.editDialog.submitButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDevice} onOpenChange={() => setDeleteDevice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('devicesPage.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('devicesPage.deleteDialog.description')}
              <br />
              <br />
              <strong>{t('devicesPage.deleteDialog.infoDeviceNo')}</strong> {deleteDevice?.imei}
              <br />
              <strong>{t('devicesPage.deleteDialog.infoSerial')}</strong> {deleteDevice?.serial_number || t('common.none')}
              <br />
              <strong>{t('devicesPage.deleteDialog.infoFirmware')}</strong> {deleteDevice?.firmware_version || t('common.none')}
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
              {t('devicesPage.deleteDialog.submitButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Device Dialog */}
      <Dialog open={!!assignDevice} onOpenChange={() => setAssignDevice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('devicesPage.assignDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('devicesPage.assignDialog.description', { imei: assignDevice?.imei })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-select">{t('devicesPage.assignDialog.selectLabel')}</Label>
              <Select onValueChange={setSelectedVehicleId} value={selectedVehicleId || undefined}>
                <SelectTrigger id="vehicle-select">
                  <SelectValue placeholder={t('devicesPage.assignDialog.selectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {unassignedVehicles.length > 0 ? (
                    unassignedVehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate_number}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">{t('devicesPage.assignDialog.noVehicles')}</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDevice(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAssignDevice}
              disabled={loading || !selectedVehicleId}
            >
              {t('devicesPage.assignDialog.submitButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Confirmation Dialog */}
      <AlertDialog open={!!unassignDevice} onOpenChange={() => setUnassignDevice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('devicesPage.unassignDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('devicesPage.unassignDialog.description', { imei: unassignDevice?.imei, plate: unassignDevice?.plate_number })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnassignConfirm}
              className="bg-yellow-600 hover:bg-yellow-700"
              disabled={loading}
            >
              {t('devicesPage.unassignDialog.submitButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
