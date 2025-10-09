import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/auth-provider'
import { LanguageProvider } from '@/components/providers/language-provider'

import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'Patrol Management',
  description: 'Hệ thống giám sát và điều hành tuần tra',
  generator: 'v0.dev',
  icons: {
    icon: '/images/icon-web.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body>
        <LanguageProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
