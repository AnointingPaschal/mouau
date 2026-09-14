'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, BellOff, X, Check, Settings } from 'lucide-react'
import { useAuth } from './AuthProvider'

export default function NotificationPrompt() {
  const { student } = useAuth()
  const [show,    setShow]    = useState(false)
  const [status,  setStatus]  = useState<'idle'|'granted'|'denied'|'blocked'>('idle')
  const [loading, setLoading] = useState(false)
  const subscribedRef = useRef(false)

  /* ── Auto-subscribe whenever permission is 'granted' ── */
  const autoSubscribe = async (idNumber: string) => {
    if (subscribedRef.current) return
    subscribedRef.current = true
    try {
      const { subscribeToPush } = await import('@/lib/notifications')
      await subscribeToPush(idNumber)
    } catch { subscribedRef.current = false }
  }

  useEffect(() => {
    if (!student?.idNumber) return
    if (!('Notification' in window)) return

    const idNumber = student.idNumber

    // ── 1. Already granted: subscribe silently ──
    if (Notification.permission === 'granted') {
      autoSubscribe(idNumber)
      return
    }

    // ── 2. Explicitly blocked by browser: nothing to do ──
    if (Notification.permission === 'denied') return

    // ── 3. 'default' — check if user already dismissed our prompt ──
    if (localStorage.getItem('notif_dismissed') === 'yes') {
      // They dismissed before, but may have enabled in browser settings later.
      // Watch for permission changes (works in Chrome/Edge).
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'notifications' as PermissionName })
          .then(status => {
            if (status.state === 'granted') { autoSubscribe(idNumber); return }
            // Listen for change (e.g. user went to Settings and enabled)
            status.addEventListener('change', () => {
              if (status.state === 'granted') autoSubscribe(idNumber)
            })
          }).catch(() => {})
      }
      return
    }

    // ── 4. Show our prompt after 3 s ──
    const t = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(t)
  }, [student?.idNumber])

  /* ── Re-check on window focus (user came back from browser settings) ── */
  useEffect(() => {
    if (!student?.idNumber) return
    const check = () => {
      if (Notification.permission === 'granted') {
        autoSubscribe(student.idNumber)
        setShow(false)
      }
    }
    window.addEventListener('focus', check)
    return () => window.removeEventListener('focus', check)
  }, [student?.idNumber])

  /* ── Tap Allow in our prompt ── */
  const allow = async () => {
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        const { subscribeToPush } = await import('@/lib/notifications')
        const ok = await subscribeToPush(student!.idNumber)
        subscribedRef.current = true
        setStatus(ok ? 'granted' : 'denied')
        localStorage.setItem('notif_dismissed', 'yes')
        setTimeout(() => setShow(false), 2500)
      } else if (perm === 'denied') {
        // Browser blocked the request (auto-deny or user dismissed native prompt)
        setStatus('blocked')
        localStorage.setItem('notif_dismissed', 'yes')
        setTimeout(() => setShow(false), 4000)
      } else {
        setStatus('denied')
        localStorage.setItem('notif_dismissed', 'yes')
        setTimeout(() => setShow(false), 2000)
      }
    } catch {
      setStatus('denied')
    }
    setLoading(false)
  }

  const dismiss = () => { localStorage.setItem('notif_dismissed', 'yes'); setShow(false) }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[60] animate-slide-up lg:bottom-6 lg:left-auto lg:right-6 lg:w-80">
      <div className="bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#1a6b3a] to-[#4ade80]"/>

        {status === 'granted' ? (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-white"/>
            </div>
            <div>
              <p className="text-white text-sm font-bold">Notifications enabled!</p>
              <p className="text-white/50 text-[10px]">You'll get alerts for announcements & updates</p>
            </div>
          </div>

        ) : status === 'blocked' ? (
          /* Browser auto-blocked the permission — guide them to settings */
          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <BellOff className="w-4 h-4 text-amber-400"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold">Blocked by browser</p>
                <p className="text-white/50 text-[10px] mt-0.5 leading-relaxed">
                  Enable manually: tap the <strong className="text-white/70">lock icon</strong> in the address bar → Notifications → Allow
                </p>
              </div>
              <button onClick={dismiss} className="text-white/30 flex-shrink-0">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <a href="chrome://settings/content/notifications" target="_blank"
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-amber-500/20 text-amber-400 text-xs font-semibold"
              onClick={dismiss}>
              <Settings className="w-3 h-3"/> Open Browser Settings
            </a>
          </div>

        ) : status === 'denied' ? (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
              <BellOff className="w-4 h-4 text-white/50"/>
            </div>
            <p className="text-white/60 text-xs">Tap the lock icon in your browser bar → Notifications → Allow to get alerts.</p>
          </div>

        ) : (
          /* Default: ask for permission */
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1a6b3a] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-white"/>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Stay updated</p>
                  <p className="text-white/50 text-[10px] mt-0.5">Announcements, library updates &amp; more</p>
                </div>
              </div>
              <button onClick={dismiss} className="text-white/30 hover:text-white/60 flex-shrink-0 mt-0.5 transition-colors">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={dismiss}
                className="flex-1 py-2 text-xs font-semibold text-white/40 border border-white/10 rounded-xl hover:border-white/20 transition-colors">
                Not now
              </button>
              <button onClick={allow} disabled={loading}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#1a6b3a] rounded-xl hover:bg-[#145530] active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60">
                {loading
                  ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  : <><Bell className="w-3 h-3"/> Allow notifications</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
