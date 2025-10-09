"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"

import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { toast } from "sonner"
import apiService from "@/lib/services/api"
import type { Device, Driver, CreateJourneySessionRequest, JourneySessionWithDetails, PaginatedResponse } from "@/lib/types/api"
import { useTranslation } from "react-i18next"

const createFormSchema = (isEditing: boolean = false, t: (key: string) => string) => z.object({
  device_id: z.string().min(1, t('journeySessionForm.validation.deviceRequired')),
  driver_id: z.string().min(1, t('journeySessionForm.validation.driverRequired')),
  start_time: z.date({
    required_error: t('journeySessionForm.validation.startTimeRequired'),
  }).refine((date) => {
    if (isEditing) return true // Cho phép edit session trong quá khứ
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset về đầu ngày để chỉ so sánh ngày
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0) // Reset về đầu ngày
    return selectedDate >= today
  }, {
    message: t('journeySessionForm.validation.pastDateNotAllowed'),
  }),
  end_time: z.date({
    required_error: t('journeySessionForm.validation.endTimeRequired'),
  }).refine((date) => {
    if (isEditing) return true // Cho phép edit session trong quá khứ
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset về đầu ngày để chỉ so sánh ngày
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0) // Reset về đầu ngày
    return selectedDate >= today
  }, {
    message: t('journeySessionForm.validation.pastDateNotAllowed'),
  }),
  notes: z.string().optional(),
}).refine((data) => data.end_time > data.start_time, {
  message: t('journeySessionForm.validation.endTimeAfterStart'),
  path: ["end_time"],
}).refine((data) => {
  if (data.start_time && data.end_time) {
    const diffInMs = data.end_time.getTime() - data.start_time.getTime();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    return diffInMs <= sevenDaysInMs;
  }
  return true;
}, {
  message: t('journeySessionForm.validation.durationExceeds7Days'),
  path: ["end_time"],
})

interface JourneySessionFormProps {
  session?: JourneySessionWithDetails
  onSuccess?: () => void
  onCancel?: () => void
}

export function JourneySessionForm({ session, onSuccess, onCancel }: JourneySessionFormProps) {
  const { t } = useTranslation()
  const [devices, setDevices] = useState<Device[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const isEditing = !!session
  const formSchema = createFormSchema(isEditing, t)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      device_id: session?.device_id || "",
      driver_id: session?.driver_id || "",
      start_time: session?.start_time ? new Date(session.start_time) : undefined,
      end_time: session?.end_time ? new Date(session.end_time) : undefined,
      notes: session?.notes || "",
    },
  })

  // Load devices and drivers
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true)
        const [devicesResponse, driversResponse] = await Promise.all([
          apiService.get<PaginatedResponse<Device>>('/devices?items_per_page=100'),
          apiService.get<PaginatedResponse<Driver>>('/drivers?items_per_page=100')
        ])
        setDevices(devicesResponse.data)
        setDrivers(driversResponse.data)
      } catch (error) {
        toast.error(t('journeySessionForm.toasts.loadDataError'))
        console.error('Error loading data:', error)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true)

      const requestData: CreateJourneySessionRequest = {
        device_id: values.device_id,
        driver_id: values.driver_id,
        start_time: values.start_time.toISOString(),
        end_time: values.end_time.toISOString(),
        notes: values.notes || undefined,
      }

      if (isEditing) {
        await apiService.put(`/journey-sessions/${session.id}`, requestData)
        toast.success(t('journeySessionForm.toasts.updateSuccess'))
      } else {
        await apiService.post('/journey-sessions', requestData)
        toast.success(t('journeySessionForm.toasts.createSuccess'))
      }

      onSuccess?.()
    } catch (error: any) {
      const errorMessage = error?.details?.detail || t('journeySessionForm.toasts.genericError')
      toast.error(errorMessage)      
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>{t('journeySessionForm.loadingData')}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? t('journeySessionForm.editTitle') : t('journeySessionForm.createTitle')}</CardTitle>
        <CardDescription>
          {isEditing ? t('journeySessionForm.editDescription') : t('journeySessionForm.createDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Driver Selection */}
              <FormField
                control={form.control}
                name="driver_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('journeySessionForm.driverLabel')} <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('journeySessionForm.driverPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Device Selection */}
              <FormField
                control={form.control}
                name="device_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('journeySessionForm.deviceLabel')} <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('journeySessionForm.devicePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {devices.map((device) => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.plate_number ? `${device.imei} (${device.plate_number})` : device.imei}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Time */}
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('journeySessionForm.startTimeLabel')} <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t('journeySessionForm.startTimePlaceholder')}
                        format24Hour={true}
                        disablePastDates={!isEditing}
                        maxDate={form.watch("end_time")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Time */}
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('journeySessionForm.endTimeLabel')} <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t('journeySessionForm.endTimePlaceholder')}
                        format24Hour={true}
                        disablePastDates={!isEditing}
                        minDate={form.watch("start_time")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('journeySessionForm.notesLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('journeySessionForm.notesPlaceholder')}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? t('journeySessionForm.updateButton') : t('journeySessionForm.createButton')}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  {t('journeySessionForm.cancelButton')}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
