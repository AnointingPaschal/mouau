'use client'
// Unified notification helper — FCM push + Gmail email + in-app DB

export async function subscribeToPush(studentId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false

  try {
    const { app, getMessaging, getToken } = await import('@/lib/firebase')
    const messaging = getMessaging(app)

    // Register Firebase service worker
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    await navigator.serviceWorker.ready

    const token = await getToken(messaging, {
      vapidKey:          process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: reg,
    })

    if (!token) return false

    // Save FCM token to DB
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, studentId }),
    })
    return true
  } catch (e) {
    console.warn('FCM subscribe failed:', e)
    return false
  }
}

export async function unsubscribeFromPush(studentId: string): Promise<void> {
  try {
    const { app, getMessaging, getToken } = await import('@/lib/firebase')
    const messaging = getMessaging(app)
    const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY })
    if (token) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
    }
  } catch {}
}
