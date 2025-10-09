"use client"

import { Bell, Search, User, LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"

import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuthContext } from "@/components/providers/auth-provider"

export function Header() {
  const { t } = useTranslation()
  const { user, logout } = useAuthContext()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  return (
    <header className="border-b bg-white px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          {/* <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm kiếm xe, tài xế, thiết bị..." className="pl-10 w-80" />
          </div> */}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">3</Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.full_name || t('header.account')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>{t('header.profile')}</DropdownMenuItem>
              <DropdownMenuItem>{t('header.settings')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                {t('header.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
