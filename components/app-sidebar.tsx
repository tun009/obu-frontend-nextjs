"use client"

import { Car, Users, Smartphone, LayoutDashboard, Settings, LogOut, Radio, Calendar, HelpCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,

  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { HelpPanel } from "@/components/ui/help-panel"

const menuItems = [
  {
    title: "Live",
    url: "/dashboard/map",
    icon: Radio,
  },
  {
    title: "Quản lý xe tuần tra",
    url: "/dashboard/vehicles",
    icon: Car,
  },
  {
    title: "Quản lý người dùng",
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
  }
  //  {
  //   title: "Live Call",
  //   url: "/dashboard/map2",
  //   icon: Radio,
  // },
  // {
  //   title: "Đàm thoại",
  //   url: "/dashboard/call-group",
  //   icon: Phone,
  // },
]

export function AppSidebar() {
  const pathname = usePathname()

  const [helpOpen, setHelpOpen] = useState(false)

  const handleLogout = async () => {
    // Logout will be handled by Header component
    // This is kept for compatibility but not used
  }

  return (
    <>
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
              <SidebarMenuButton onClick={() => setHelpOpen(true)}>
                <HelpCircle className="h-4 w-4" />
                <span>Trợ giúp</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
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
      <HelpPanel open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  )
}
