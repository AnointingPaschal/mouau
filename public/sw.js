const CACHE_NAME = 'pdm-mouau-v1'
const OFFLINE_URL = '/'

const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// Install — precache shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// Fetch — network-first with cache fallback
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET, cross-origin, and API requests
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/')
  ) return

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful navigation & static responses
        if (
          response.ok &&
          (request.mode === 'navigate' || url.pathname.match(/\.(png|jpg|svg|webp|ico|css|js|woff2?)$/))
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(request).then(cached => {
          if (cached) return cached
          // Offline fallback for navigation
          if (request.mode === 'navigate') return caches.match(OFFLINE_URL)
          return new Response('Offline', { status: 503 })
        })
      )
  )
})

// Push notifications (already handled by firebase-messaging-sw.js,
// but kept here as fallback for any direct web-push payloads)
self.addEventListener('push', event => {
  if (!event.data) return
  try {
    const data = event.data.json()
    event.waitUntil(
      self.registration.showNotification(data.title || 'PDM MOUAU', {
        body: data.body || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url: data.url || '/dashboard' }
      })
    )
  } catch {}
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const win = list.find(c => c.url.includes(self.location.origin))
      if (win) return win.focus().then(w => w.navigate(url))
      return clients.openWindow(url)
    })
  )
})
