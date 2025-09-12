"use client"

import { Car, Users, Smartphone, LayoutDashboard, Settings, LogOut, Radio, Calendar, Phone } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Quản lý xe",
    url: "/dashboard/vehicles",
    icon: Car,
  },
  {
    title: "Quản lý tài xế",
    url: "/dashboard/drivers",
    icon: Users,
  },
  {
    title: "Quản lý thiết bị",
    url: "/dashboard/devices",
    icon: Smartphone,
  },
  {
    title: "Ca làm việc",
    url: "/dashboard/journey-sessions",
    icon: Calendar,
  },
  {
    title: "Live",
    url: "/dashboard/map",
    icon: Radio,
  },
  {
    title: "Đàm thoại",
    url: "/dashboard/call-group",
    icon: Phone,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    // Logout will be handled by Header component
    // This is kept for compatibility but not used
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Car className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Fleet Management</h2>
            <p className="text-xs text-muted-foreground">OBU Tracking System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4" />
                <span>Cài đặt</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button variant="ghost" className="w-full justify-start p-2 h-8" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
