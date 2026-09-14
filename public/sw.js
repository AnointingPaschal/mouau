// PDM MOUAU Service Worker
// Bump this version to force all clients to get the new worker immediately
const CACHE_VERSION = 'pdm-mouau-v3'
const OFFLINE_URL   = '/'

// Only cache guaranteed-static assets — no auth-required pages, no deleted files
const PRECACHE_ASSETS = [
  '/icon-192.png',
  '/icon-512.png',
  '/notification-icon.png',
  '/badge-icon.png',
  '/apple-touch-icon.png',
]

// ── Install — precache static assets, NEVER block on failure ──────────────
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION)
      // Use allSettled so a single 404 never hangs the install
      await Promise.allSettled(
        PRECACHE_ASSETS.map(url =>
          cache.add(url).catch(e => console.warn('[SW] precache skip:', url, e.message))
        )
      )
      // Immediately take control — don't wait for old SW to unload
      await self.skipWaiting()
    })()
  )
})

// ── Activate — delete old caches & claim all clients ─────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION)
          .map(k => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

// ── Fetch — network-first, static assets cached on the fly ───────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests; skip API calls
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/')
  ) return

  // Static assets: cache-first
  const isStatic = /\.(png|jpg|jpeg|svg|webp|ico|woff2?|css|js)$/.test(url.pathname)
  if (isStatic) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_VERSION).then(c => c.put(request, clone))
          }
          return res
        }).catch(() => new Response('', { status: 503 }))
      })
    )
    return
  }

  // Navigation: network-first, fall back to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then(cached => cached || new Response('Offline', { status: 503 }))
      )
    )
    return
  }
})

// ── Push notifications ────────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return
  try {
    const payload = event.data.json()
    const notif   = payload.notification || {}
    const data    = payload.data         || payload
    const title   = notif.title  || data.title  || 'PDM MOUAU'
    const body    = notif.body   || data.body   || ''
    const icon    = notif.icon   || data.icon   || '/notification-icon.png'
    const badge   = notif.badge  || data.badge  || '/badge-icon.png'
    const destUrl = (notif.data && notif.data.url) || data.url || '/dashboard'

    event.waitUntil(
      self.registration.showNotification(title, {
        body, icon, badge,
        tag:      'pdm-mouau',
        renotify: true,
        vibrate:  [200, 100, 200],
        data:     { url: destUrl },
        actions:  [{ action: 'open', title: 'Open App' }],
      })
    )
  } catch (e) {
    console.warn('[SW] push parse error:', e)
  }
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const win = list.find(c => c.url.startsWith(self.location.origin))
      if (win) { win.focus(); win.navigate(url) }
      else clients.openWindow(url)
    })
  )
})
