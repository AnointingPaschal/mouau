import type { Metadata, Viewport } from 'next'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'

/* ─── Viewport ─── */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a6b3a',
  viewportFit: 'cover',          // iPhone notch / Dynamic Island
}

/* ─── Metadata ─── */
export const metadata: Metadata = {
  title: 'Pneuma Domain MOUAU',
  description: 'Student Companion App for Michael Okpara University of Agriculture, Umudike. Navigate campus, access study materials and connect with Pneuma Domain Ministry.',
  keywords: 'MOUAU, Michael Okpara University, Agriculture, Umudike, Pneuma Domain, freshers, student portal, PDM',
  applicationName: 'PDM MOUAU',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PDM MOUAU',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icon-192.png',
  },
  openGraph: {
    type: 'website',
    title: 'Pneuma Domain MOUAU',
    description: 'Your student companion app for MOUAU campus life.',
    siteName: 'PDM MOUAU',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA — register service worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .catch(function(err){ console.warn('SW reg failed:', err); });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-mouau-bg">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
