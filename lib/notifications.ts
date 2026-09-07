// Unified notification helper — sends push + email + in-app DB notification

const VAPID_PUBLIC = 'BHCnIlIks2ps2aMp_ufHTOjkZrwiRd9hL6u23Z1jAnFcClD-wy-vXCgQxHnQDfxohnQyZVfRadvJL4mRkYVezgo'

// Register service worker and subscribe to push
export async function subscribeToPush(studentId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const existing = await reg.pushManager.getSubscription()
    let sub = existing

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC
      })
    }

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), studentId })
    })
    return true
  } catch (e) {
    console.warn('Push subscribe failed:', e)
    return false
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint })
    })
    await sub.unsubscribe()
  }
}

// Send push + email notification to a student
export async function sendNotification(opts: {
  studentId: string
  email?: string
  title: string
  body: string
  url?: string
}) {
  // Push
  fetch('/api/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId: opts.studentId, title: opts.title, body: opts.body, url: opts.url })
  }).catch(() => {})

  // Email (if address provided)
  if (opts.email && opts.email !== 'N/A') {
    fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: opts.email,
        subject: opts.title,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
            <div style="background:#0a0a0a;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px">
              <h2 style="color:#4ade80;margin:0;font-size:20px">MOUAU FreshStart</h2>
            </div>
            <h3 style="color:#0a0a0a">${opts.title}</h3>
            <p style="color:#6b6b6b;line-height:1.6">${opts.body}</p>
            ${opts.url ? `<a href="https://mouau-rose.vercel.app${opts.url}" style="display:inline-block;background:#1a6b3a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px">Open in FreshStart</a>` : ''}
            <hr style="border:none;border-top:1px solid #e8e8e8;margin:20px 0"/>
            <p style="color:#aaa;font-size:12px">You received this because you're a MOUAU FreshStart student. <a href="https://mouau-rose.vercel.app/profile" style="color:#1a6b3a">Manage notifications</a></p>
          </div>
        `
      })
    }).catch(() => {})
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}
