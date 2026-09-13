import { MetadataRoute } from 'next'
import { getSetting } from '@/lib/settings'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const siteName = await getSetting('site_name', 'Pneuma Domain MOUAU')
  const logoUrl  = await getSetting('logo_url',  '')

  // Resolve logo: use uploaded logo if it's an absolute URL, else fall back to static icons
  const logoIcon = logoUrl && logoUrl.startsWith('http')
    ? [{ src: logoUrl, sizes: '512x512', type: 'image/png' as const, purpose: 'any' as const }]
    : []

  return {
    name: siteName || 'Pneuma Domain MOUAU',
    short_name: 'PDM MOUAU',
    description: 'Student Companion App for Michael Okpara University of Agriculture, Umudike.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#1a6b3a',
    theme_color: '#1a6b3a',
    categories: ['education', 'lifestyle'],
    lang: 'en',
    icons: [
      ...logoIcon,
      { src: '/icon-192.png',         sizes: '192x192', type: 'image/png', purpose: 'any'      },
      { src: '/icon-512.png',         sizes: '512x512', type: 'image/png', purpose: 'any'      },
      { src: '/icon-maskable-512.png',sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any'      },
    ],
    shortcuts: [
      {
        name: 'Campus Map',
        short_name: 'Map',
        url: '/navigate',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Library',
        short_name: 'Library',
        url: '/library',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'PDM',
        short_name: 'PDM',
        url: '/pdm',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  }
}
