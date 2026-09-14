// PDM MOUAU Service Worker v4
// Zero precaching — install completes in <100ms, no network calls during install
const CACHE_NAME = 'pdm-mouau-v4'

// ── Install: nothing to prefetch, just activate immediately ──────────────
self.addEventListener('install', event => {
  // skipWaiting MUST be in waitUntil so it runs before the handler exits
  event.waitUntil(self.skipWaiting())
})

// ── Activate: clean old caches, claim all clients ─────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// ── Fetch: cache static assets on first use, network-first for everything else ─
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET, cross-origin, API calls
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  // Cache-first for static image/font/icon assets
  const isStatic = /\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname)
  if (isStatic) {
    event.respondWith(
      caches.match(request).then(hit => hit || fetch(request).then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(request, res.clone()))
        return res
      }))
    )
    return
  }

  // Navigation: network-first, fall back to cached landing page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then(c => c || new Response('Offline', { status: 503 }))
      )
    )
  }
})

// ── Push notification ─────────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return
  try {
    const p    = event.data.json()
    const n    = p.notification || {}
    const d    = p.data || p
    const title = n.title || d.title || 'PDM MOUAU'
    const body  = n.body  || d.body  || ''
    const icon  = n.icon  || d.icon  || '/notification-icon.png'
    const badge = n.badge || d.badge || '/badge-icon.png'
    const url   = (n.data && n.data.url) || d.url || '/dashboard'
    event.waitUntil(
      self.registration.showNotification(title, {
        body, icon, badge, tag: 'pdm-mouau', renotify: true,
        vibrate: [200, 100, 200], data: { url },
        actions: [{ action: 'open', title: 'Open App' }],
      })
    )
  } catch {}
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const win = list.find(c => c.url.startsWith(self.location.origin))
      if (win) { win.focus(); win.navigate(url) } else clients.openWindow(url)
    })
  )
})
