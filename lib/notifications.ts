'use client'

export async function subscribeToPush(studentId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false

  try {
    // Fetch config + vapid key from DB settings
    const configRes = await fetch('/api/config')
    const config    = await configRes.json()
    const vapidKey  = config.vapidKey
    if (!vapidKey) { console.warn('VAPID key not configured'); return false }

    // Init Firebase with DB config
    const { initializeApp, getApps } = await import('firebase/app')
    const { getMessaging, getToken }  = await import('firebase/messaging')

    const firebaseApp = getApps().length === 0
      ? initializeApp(config.firebase)
      : getApps()[0]

    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    await navigator.serviceWorker.ready
    const messaging = getMessaging(firebaseApp)

    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg })
    if (!token) { console.warn('No FCM token obtained'); return false }

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, studentId }),
    })
    return true
  } catch (e) {
    console.warn('Push subscribe failed:', e)
    return false
  }
}

export async function unsubscribeFromPush(studentId: string): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()

    const configRes = await fetch('/api/config')
    const config    = await configRes.json()
    const { getApps, initializeApp } = await import('firebase/app')
    const { getMessaging, getToken, deleteToken } = await import('firebase/messaging')
    const app = getApps().length ? getApps()[0] : initializeApp(config.firebase)
    const messaging = getMessaging(app)
    await deleteToken(messaging)
  } catch {}
}
