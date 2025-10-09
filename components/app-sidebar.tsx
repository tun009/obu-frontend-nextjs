"use client"

import { Car, Users, Smartphone, LayoutDashboard, Settings, LogOut, Radio, Calendar, HelpCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"

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

export function AppSidebar() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [helpOpen, setHelpOpen] = useState(false)

  const menuItems = [
    {
      title: t('sidebar.live'),
      url: "/dashboard/map",
      icon: Radio,
    },
    {
      title: t('sidebar.vehicles'),
      url: "/dashboard/vehicles",
      icon: Car,
    },
    {
      title: t('sidebar.users'),
      url: "/dashboard/drivers",
      icon: Users,
    },
    {
      title: t('sidebar.devices'),
      url: "/dashboard/devices",
      icon: Smartphone,
    },
    {
      title: t('sidebar.shifts'),
      url: "/dashboard/journey-sessions",
      icon: Calendar,
    }
  ]

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
              <h2 className="font-semibold">Patrol Management</h2>
              <p className="text-xs text-muted-foreground">{t('sidebar.subtitle')}</p>
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
                <span>{t('sidebar.help')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/settings">
                  <Settings className="h-4 w-4" />
                  <span>{t('sidebar.settings')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Button variant="ghost" className="w-full justify-start p-2 h-8" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('sidebar.logout')}
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <HelpPanel open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  )
}
