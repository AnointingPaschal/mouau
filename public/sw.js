// MOUAU FreshStart Service Worker — Push Notifications

self.addEventListener('install', e => { self.skipWaiting() })
self.addEventListener('activate', e => { e.waitUntil(clients.claim()) })

self.addEventListener('push', e => {
  if (!e.data) return
  const data = e.data.json()
  e.waitUntil(
    self.registration.showNotification(data.title || 'FreshStart', {
      body:    data.body  || '',
      icon:    '/icon-192.png',
      badge:   '/icon-192.png',
      tag:     data.tag   || 'freshstart',
      data:    { url: data.url || '/dashboard' },
      actions: [{ action:'open', title:'Open' }],
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/dashboard'
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin))
      if (existing) { existing.focus(); existing.navigate(url) }
      else clients.openWindow(url)
    })
  )
})
