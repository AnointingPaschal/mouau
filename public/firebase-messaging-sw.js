importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

let initialized = false

async function initFirebase() {
  if (initialized) return
  try {
    const res = await fetch('/api/config')
    const { firebase } = await res.json()
    firebase.initializeApp(firebase)
    initialized = true
  } catch(e) { console.warn('SW Firebase init failed:', e) }
}

self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); initFirebase() })

self.addEventListener('push', async e => {
  await initFirebase()
  if (!e.data) return
  const data = e.data.json()
  e.waitUntil(
    self.registration.showNotification(data.title || 'MOUAU FreshStart', {
      body:    data.body  || '',
      icon:    '/icon-192.png',
      badge:   '/icon-192.png',
      data:    { url: data.url || '/dashboard' },
      vibrate: [200, 100, 200],
      tag:     'freshstart',
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

// Background FCM messages
self.addEventListener('message', e => {
  if (e.data?.type === 'FIREBASE_CONFIG') {
    try { firebase.initializeApp(e.data.config); initialized = true } catch {}
  }
})
