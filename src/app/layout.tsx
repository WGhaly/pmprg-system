import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ToastProvider } from '@/components/ui/Toast'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import GlobalErrorHandler from '@/components/ui/GlobalErrorHandler'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AuthGuard from '@/components/auth/AuthGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PMPRG - Project Management & Resource Planning',
  description: 'Complete project and resource management solution for Progressio Solutions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <GlobalErrorHandler />
              <AuthGuard>
                <div className="min-h-screen bg-gray-50">
                  {children}
                </div>
              </AuthGuard>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}