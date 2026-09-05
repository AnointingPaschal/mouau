import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'MOUAU FreshStart - Student Navigator',
  description: 'Your complete guide to Michael Okpara University of Agriculture, Umudike. Navigate campus, complete registration, access materials, and connect with fellow students.',
  keywords: 'MOUAU, Michael Okpara University, Agriculture, Umudike, freshers, student portal',
  icons: { icon: '/favicon.ico' }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#1B5E20" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-mouau-bg">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
