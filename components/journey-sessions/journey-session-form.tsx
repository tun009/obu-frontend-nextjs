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
import type { Vehicle, Driver, CreateJourneySessionRequest, JourneySessionWithDetails } from "@/lib/types/api"

const createFormSchema = (isEditing: boolean = false) => z.object({
  vehicle_id: z.string().min(1, "Vui lòng chọn xe"),
  driver_id: z.string().min(1, "Vui lòng chọn tài xế"),
  start_time: z.date({
    required_error: "Vui lòng chọn thời gian bắt đầu",
  }).refine((date) => {
    if (isEditing) return true // Cho phép edit session trong quá khứ
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset về đầu ngày để chỉ so sánh ngày
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0) // Reset về đầu ngày
    return selectedDate >= today
  }, {
    message: "Không được chọn ngày trong quá khứ",
  }),
  end_time: z.date({
    required_error: "Vui lòng chọn thời gian kết thúc",
  }).refine((date) => {
    if (isEditing) return true // Cho phép edit session trong quá khứ
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset về đầu ngày để chỉ so sánh ngày
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0) // Reset về đầu ngày
    return selectedDate >= today
  }, {
    message: "Không được chọn ngày trong quá khứ",
  }),
  notes: z.string().optional(),
}).refine((data) => data.end_time > data.start_time, {
  message: "Thời gian kết thúc phải sau thời gian bắt đầu",
  path: ["end_time"],
})

interface JourneySessionFormProps {
  session?: JourneySessionWithDetails
  onSuccess?: () => void
  onCancel?: () => void
}

export function JourneySessionForm({ session, onSuccess, onCancel }: JourneySessionFormProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const isEditing = !!session
  const formSchema = createFormSchema(isEditing)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicle_id: session?.vehicle_id || "",
      driver_id: session?.driver_id || "",
      start_time: session?.start_time ? new Date(session.start_time) : undefined,
      end_time: session?.end_time ? new Date(session.end_time) : undefined,
      notes: session?.notes || "",
    },
  })

  // Load vehicles and drivers
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true)
        const [vehiclesResponse, driversResponse] = await Promise.all([
          apiService.get<{ data: Vehicle[] }>('/vehicles?items_per_page=100'),
          apiService.get<{ data: Driver[] }>('/drivers?items_per_page=100')
        ])
        
        setVehicles(vehiclesResponse.data)
        setDrivers(driversResponse.data)
      } catch (error) {
        toast.error('Không thể tải dữ liệu xe và tài xế')
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
        vehicle_id: values.vehicle_id,
        driver_id: values.driver_id,
        start_time: values.start_time.toISOString(),
        end_time: values.end_time.toISOString(),
        notes: values.notes || undefined,
      }

      if (isEditing) {
        await apiService.put(`/journey-sessions/${session.id}`, requestData)
        toast.success('Cập nhật ca làm việc thành công')
      } else {
        await apiService.post('/journey-sessions', requestData)
        toast.success('Tạo ca làm việc thành công')
      }

      onSuccess?.()
    } catch (error: any) {
      const errorMessage = error?.details?.detail || 'Có lỗi xảy ra'
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
          <span>Đang tải dữ liệu...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Cập nhật ca làm việc' : 'Tạo ca làm việc mới'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Cập nhật thông tin ca làm việc' : 'Tạo ca làm việc mới cho tài xế và xe'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Selection */}
              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Xe</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn xe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.plate_number} {vehicle.type && `(${vehicle.type})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Driver Selection */}
              <FormField
                control={form.control}
                name="driver_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tài xế</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn tài xế" />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Time */}
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Thời gian bắt đầu</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Chọn thời gian bắt đầu"
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
                    <FormLabel>Thời gian kết thúc</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Chọn thời gian kết thúc"
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
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập ghi chú cho ca làm việc..."
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
                {isEditing ? 'Cập nhật' : 'Tạo ca làm việc'}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Hủy
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
