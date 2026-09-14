importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

let initialized = false
let messaging = null

async function initFirebase() {
  if (initialized) return true
  try {
    const res  = await fetch('/api/config')
    const data = await res.json()
    const cfg  = data.firebase || data
    if (!cfg.projectId) { console.warn('SW: no Firebase config'); return false }
    firebase.initializeApp(cfg)
    messaging = firebase.messaging()
    initialized = true
    return true
  } catch(e) { console.warn('SW: Firebase init failed:', e); return false }
}

self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); initFirebase() })

// Background push — FCM delivers notification+data payloads here
self.addEventListener('push', async e => {
  await initFirebase()
  if (!e.data) return

  let payload = {}
  try { payload = e.data.json() } catch { return }

  // FCM sends the message in different shapes depending on the platform:
  // - webpush.notification fields arrive in payload.notification
  // - data fields arrive in payload.data
  // Try notification first, then data fallback
  const notif   = payload.notification || {}
  const data    = payload.data         || payload

  const title   = notif.title  || data.title  || 'PDM MOUAU'
  const body    = notif.body   || data.body   || ''
  const icon    = notif.icon   || data.icon   || '/notification-icon.png'
  const badge   = notif.badge  || data.badge  || '/badge-icon.png'
  const destUrl = (notif.data && notif.data.url) || data.url || '/dashboard'

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag:     'pdm-mouau',
      renotify: true,
      data:    { url: destUrl },
      vibrate: [200, 100, 200],
      actions: [{ action: 'open', title: 'Open App' }],
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/dashboard'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const origin = self.location.origin
      const win = list.find(c => c.url.startsWith(origin))
      if (win) { win.focus(); win.navigate(url) }
      else clients.openWindow(url)
    })
  )
})
