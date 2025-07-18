"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AddVehiclePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    plateNumber: "",
    brand: "",
    model: "",
    year: "",
    color: "",
    engineNumber: "",
    chassisNumber: "",
    fuelType: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In real app, send data to API
    console.log("Vehicle data:", formData)
    router.push("/dashboard/vehicles")
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/vehicles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thêm xe mới</h1>
          <p className="text-muted-foreground">Nhập thông tin chi tiết của xe mới</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin xe</CardTitle>
          <CardDescription>Vui lòng điền đầy đủ thông tin bắt buộc</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plateNumber">Biển số xe *</Label>
                <Input
                  id="plateNumber"
                  placeholder="29A-12345"
                  value={formData.plateNumber}
                  onChange={(e) => handleInputChange("plateNumber", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Hãng xe *</Label>
                <Select onValueChange={(value) => handleInputChange("brand", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn hãng xe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="toyota">Toyota</SelectItem>
                    <SelectItem value="honda">Honda</SelectItem>
                    <SelectItem value="mazda">Mazda</SelectItem>
                    <SelectItem value="ford">Ford</SelectItem>
                    <SelectItem value="hyundai">Hyundai</SelectItem>
                    <SelectItem value="kia">Kia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  placeholder="Camry, Civic, CX-5..."
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Năm sản xuất *</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2023"
                  min="1990"
                  max="2024"
                  value={formData.year}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Màu sắc</Label>
                <Input
                  id="color"
                  placeholder="Trắng, Đen, Xám..."
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelType">Loại nhiên liệu</Label>
                <Select onValueChange={(value) => handleInputChange("fuelType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại nhiên liệu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gasoline">Xăng</SelectItem>
                    <SelectItem value="diesel">Dầu diesel</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="electric">Điện</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="engineNumber">Số máy</Label>
                <Input
                  id="engineNumber"
                  placeholder="Nhập số máy"
                  value={formData.engineNumber}
                  onChange={(e) => handleInputChange("engineNumber", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chassisNumber">Số khung</Label>
                <Input
                  id="chassisNumber"
                  placeholder="Nhập số khung"
                  value={formData.chassisNumber}
                  onChange={(e) => handleInputChange("chassisNumber", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                placeholder="Thông tin bổ sung về xe..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit">Thêm xe</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/vehicles">Hủy</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
