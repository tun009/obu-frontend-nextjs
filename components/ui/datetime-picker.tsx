"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  format24Hour?: boolean
  className?: string
  disablePastDates?: boolean
  minDate?: Date
  maxDate?: Date
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Chọn ngày và giờ",
  disabled = false,
  format24Hour = true,
  className,
  disablePastDates = false,
  minDate,
  maxDate,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [timeValue, setTimeValue] = React.useState({
    hours: value ? value.getHours() : 0,
    minutes: value ? value.getMinutes() : 0,
    period: value && value.getHours() >= 12 ? "PM" : "AM",
  })

  // Cập nhật thời gian khi value thay đổi từ bên ngoài
  React.useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setTimeValue({
        hours: value.getHours(),
        minutes: value.getMinutes(),
        period: value.getHours() >= 12 ? "PM" : "AM",
      })
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDateTime = new Date(date)
      newDateTime.setHours(timeValue.hours, timeValue.minutes, 0, 0)
      setSelectedDate(newDateTime)
      onChange?.(newDateTime)
    } else {
      setSelectedDate(undefined)
      onChange?.(undefined)
    }
  }

  const handleTimeChange = (type: "hours" | "minutes" | "period", newValue: string) => {
    let newHours = timeValue.hours
    let newMinutes = timeValue.minutes
    let newPeriod = timeValue.period

    if (type === "hours") {
      if (format24Hour) {
        newHours = Number.parseInt(newValue) || 0
      } else {
        const hour12 = Number.parseInt(newValue) || 12
        newHours = newPeriod === "PM" && hour12 !== 12 ? hour12 + 12 : newPeriod === "AM" && hour12 === 12 ? 0 : hour12
      }
    } else if (type === "minutes") {
      newMinutes = Number.parseInt(newValue) || 0
    } else if (type === "period") {
      newPeriod = newValue as "AM" | "PM"
      if (!format24Hour) {
        const hour12 = timeValue.hours > 12 ? timeValue.hours - 12 : timeValue.hours === 0 ? 12 : timeValue.hours
        newHours =
          newValue === "PM" && hour12 !== 12
            ? hour12 + 12
            : newValue === "AM" && hour12 === 12
              ? 0
              : newValue === "PM" && hour12 === 12
                ? 12
                : hour12
      }
    }

    const newTimeValue = { hours: newHours, minutes: newMinutes, period: newPeriod }
    setTimeValue(newTimeValue)

    if (selectedDate) {
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(newHours, newMinutes, 0, 0)
      setSelectedDate(newDateTime)
      onChange?.(newDateTime)
    }
  }

  const formatDateTime = (date: Date) => {
    const dateStr = date.toLocaleDateString("vi-VN")
    const timeStr = format24Hour
      ? date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })
      : date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: true })
    return `${dateStr} ${timeStr}`
  }

  const generateHourOptions = () => {
    if (format24Hour) {
      return Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
    } else {
      return Array.from({ length: 12 }, (_, i) => (i + 1).toString())
    }
  }

  const generateMinuteOptions = () => {
    return Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))
  }

  const displayHours = format24Hour
    ? timeValue.hours.toString().padStart(2, "0")
    : (timeValue.hours > 12 ? timeValue.hours - 12 : timeValue.hours === 0 ? 12 : timeValue.hours).toString()

  // Tạo function để disable dates
  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Disable ngày quá khứ nếu disablePastDates = true
    if (disablePastDates && date < today) {
      return true
    }

    // Disable ngày trước minDate
    if (minDate) {
      const min = new Date(minDate)
      min.setHours(0, 0, 0, 0)
      if (date < min) {
        return true
      }
    }

    // Disable ngày sau maxDate
    if (maxDate) {
      const max = new Date(maxDate)
      max.setHours(23, 59, 59, 999)
      if (date > max) {
        return true
      }
    }

    return false
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? formatDateTime(selectedDate) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            captionLayout="dropdown"
            autoFocus
          />
          <div className="border-l border-border p-3 w-64">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <Label className="text-sm font-medium">Thời gian</Label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="hours" className="text-xs">
                    Giờ
                  </Label>
                  <Select value={displayHours} onValueChange={(value) => handleTimeChange("hours", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generateHourOptions().map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="minutes" className="text-xs">
                    Phút
                  </Label>
                  <Select
                    value={timeValue.minutes.toString().padStart(2, "0")}
                    onValueChange={(value) => handleTimeChange("minutes", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generateMinuteOptions().map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!format24Hour && (
                <div>
                  <Label htmlFor="period" className="text-xs">
                    AM/PM
                  </Label>
                  <Select value={timeValue.period} onValueChange={(value) => handleTimeChange("period", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="pt-2 border-t">
                <Button onClick={() => setOpen(false)} className="w-full" size="sm">
                  Xác nhận
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
