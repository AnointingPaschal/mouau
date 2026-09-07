importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

let initialized = false
let messaging = null

async function initFirebase() {
  if (initialized) return true
  try {
    const res = await fetch('/api/config')
    const data = await res.json()                    // { firebase: {...}, vapidKey, siteName, logoUrl }
    const cfg  = data.firebase || data               // safety
    if (!cfg.projectId) { console.warn('SW: no Firebase config'); return false }
    firebase.initializeApp(cfg)                      // FIX: was firebase.initializeApp(firebase) — wrong!
    messaging = firebase.messaging()
    initialized = true
    return true
  } catch(e) { console.warn('SW: Firebase init failed:', e); return false }
}

self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); initFirebase() })

// Background push messages
self.addEventListener('push', async e => {
  const ok = await initFirebase()
  if (!ok || !e.data) return
  const data = e.data.json()
  e.waitUntil(
    self.registration.showNotification(data.title || 'MOUAU FreshStart', {
      body:    data.body  || '',
      icon:    data.icon  || '/icon-192.png',
      badge:   '/icon-192.png',
      image:   data.image || undefined,
      tag:     'freshstart',
      data:    { url: data.url || '/dashboard' },
      vibrate: [200, 100, 200],
      actions: [{ action:'open', title:'Open' }],
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/dashboard'
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
      const w = list.find(c => c.url.includes(self.location.origin))
      if (w) { w.focus(); w.navigate(url) } else clients.openWindow(url)
    })
  )
})
