importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// Config injected at runtime from meta tags — fallback to env vars baked in
firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY            || '__FIREBASE_API_KEY__',
  authDomain:        self.FIREBASE_AUTH_DOMAIN        || '__FIREBASE_AUTH_DOMAIN__',
  projectId:         self.FIREBASE_PROJECT_ID         || '__FIREBASE_PROJECT_ID__',
  storageBucket:     self.FIREBASE_STORAGE_BUCKET     || '__FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID|| '__FIREBASE_MESSAGING_SENDER_ID__',
  appId:             self.FIREBASE_APP_ID             || '__FIREBASE_APP_ID__',
})

const messaging = firebase.messaging()

// Background notifications
messaging.onBackgroundMessage(payload => {
  const { title, body, icon, url } = payload.notification || payload.data || {}
  self.registration.showNotification(title || 'MOUAU FreshStart', {
    body:    body || '',
    icon:    icon || '/icon-192.png',
    badge:   '/icon-192.png',
    data:    { url: url || '/dashboard' },
    vibrate: [200, 100, 200],
    tag:     'freshstart',
  })
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/dashboard'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const w = list.find(c => c.url.includes(self.location.origin))
      if (w) { w.focus(); w.navigate(url) } else clients.openWindow(url)
    })
  )
})
