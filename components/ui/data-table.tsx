"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

export interface DataTableColumn<T> {
  key: keyof T | string
  title: string
  render?: (value: any, record: T, index: number) => React.ReactNode
  className?: string
  sortable?: boolean
}

export interface DataTableProps<T> {
  title: string
  description?: string
  data: T[]
  columns: DataTableColumn<T>[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: (keyof T)[]
  pagination?: {
    current: number
    pageSize: number
    total: number
    showSizeChanger?: boolean
    pageSizeOptions?: number[]
    onChange: (page: number, pageSize: number) => void
  }
  actions?: React.ReactNode
  emptyText?: string
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  title,
  description,
  data,
  columns,
  loading = false,
  searchable = true,
  searchPlaceholder = "Tìm kiếm...",
  searchKeys = [],
  pagination,
  actions,
  emptyText = "Không có dữ liệu",
  className = ""
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filter data based on search term
  const filteredData = searchable && searchTerm ? 
    data.filter(item => 
      searchKeys.length > 0 
        ? searchKeys.some(key => 
            String(item[key] || '').toLowerCase().includes(searchTerm.toLowerCase())
          )
        : Object.values(item).some(value => 
            String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
          )
    ) : data

  const renderCell = (column: DataTableColumn<T>, record: T, index: number) => {
    if (column.render) {
      return column.render(record[column.key as keyof T], record, index)
    }
    return record[column.key as keyof T]
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1
  const startItem = pagination ? (pagination.current - 1) * pagination.pageSize + 1 : 1
  const endItem = pagination ? Math.min(pagination.current * pagination.pageSize, pagination.total) : filteredData.length

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          {searchable && (
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead key={index} className={column.className}>
                      {column.title}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Đang tải...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      {emptyText}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((record, index) => (
                    <TableRow key={index}>
                      {columns.map((column, colIndex) => (
                        <TableCell key={colIndex} className={column.className}>
                          {renderCell(column, record, index)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total > 0 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {startItem} đến {endItem} trong tổng số {pagination.total} kết quả
                </p>
                {pagination.showSizeChanger && (
                  <Select
                    value={pagination.pageSize.toString()}
                    onValueChange={(value) => pagination.onChange(1, parseInt(value))}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {(pagination.pageSizeOptions || [10, 20, 30, 50]).map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onChange(1, pagination.pageSize)}
                  disabled={pagination.current <= 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
                  disabled={pagination.current <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">Trang</span>
                  <span className="text-sm font-medium">{pagination.current}</span>
                  <span className="text-sm text-muted-foreground">trên {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
                  disabled={pagination.current >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onChange(totalPages, pagination.pageSize)}
                  disabled={pagination.current >= totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
