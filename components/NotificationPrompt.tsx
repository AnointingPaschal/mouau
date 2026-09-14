'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, BellOff, X, Check, Lock, ChevronRight } from 'lucide-react'
import { useAuth } from './AuthProvider'

/* Re-show "blocked" reminder after 3 days */
const BLOCKED_SNOOZE_KEY  = 'notif_blocked_snoozed'
const DISMISSED_KEY        = 'notif_dismissed'
const BLOCKED_SNOOZE_DAYS  = 3

function wasBlockedRecentlySnoozed() {
  try {
    const raw = localStorage.getItem(BLOCKED_SNOOZE_KEY)
    if (!raw) return false
    return (Date.now() - parseInt(raw, 10)) / 86_400_000 < BLOCKED_SNOOZE_DAYS
  } catch { return false }
}
function snoozeBlocked() {
  try { localStorage.setItem(BLOCKED_SNOOZE_KEY, String(Date.now())) } catch {}
}

export default function NotificationPrompt() {
  const { student } = useAuth()
  const [show,    setShow]    = useState(false)
  const [mode,    setMode]    = useState<'ask'|'blocked'|'granted'|'failed'>('ask')
  const [loading, setLoading] = useState(false)
  const subscribedRef = useRef(false)

  /* ── Silent FCM subscribe ── */
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
    const id = student.idNumber

    const perm = Notification.permission

    /* 1. Already granted → subscribe quietly, no banner */
    if (perm === 'granted') {
      autoSubscribe(id)
      return
    }

    /* 2. Blocked by browser → show guidance banner (unless recently snoozed) */
    if (perm === 'denied') {
      if (!wasBlockedRecentlySnoozed()) {
        setMode('blocked')
        setTimeout(() => setShow(true), 3000)
      }
      return
    }

    /* 3. 'default' and previously dismissed → watch for permission change */
    if (localStorage.getItem(DISMISSED_KEY) === 'yes') {
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'notifications' as PermissionName })
          .then(s => {
            if (s.state === 'granted') autoSubscribe(id)
            s.addEventListener('change', () => {
              if (s.state === 'granted') { autoSubscribe(id); setShow(false) }
              if (s.state === 'denied' && !wasBlockedRecentlySnoozed()) {
                setMode('blocked'); setShow(true)
              }
            })
          }).catch(() => {})
      }
      return
    }

    /* 4. 'default', never asked → show the ask banner after 3 s */
    setMode('ask')
    const t = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(t)
  }, [student?.idNumber])

  /* ── Re-check when user comes back from browser settings ── */
  useEffect(() => {
    if (!student?.idNumber) return
    const check = () => {
      const perm = Notification.permission
      if (perm === 'granted') { autoSubscribe(student.idNumber); setShow(false) }
      if (perm === 'denied'  && !wasBlockedRecentlySnoozed() && !show) {
        setMode('blocked'); setShow(true)
      }
    }
    window.addEventListener('focus', check)
    return () => window.removeEventListener('focus', check)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.idNumber])

  /* ── Tap "Allow" on our ask banner ── */
  const allow = async () => {
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        const { subscribeToPush } = await import('@/lib/notifications')
        await subscribeToPush(student!.idNumber)
        subscribedRef.current = true
        setMode('granted')
        localStorage.setItem(DISMISSED_KEY, 'yes')
        setTimeout(() => setShow(false), 2500)
      } else {
        /* denied or dismissed → show blocked guidance */
        setMode('blocked')
        localStorage.setItem(DISMISSED_KEY, 'yes')
      }
    } catch {
      setMode('blocked')
    }
    setLoading(false)
  }

  const dismissAsk     = () => { localStorage.setItem(DISMISSED_KEY, 'yes'); setShow(false) }
  const dismissBlocked = () => { snoozeBlocked(); setShow(false) }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[60] animate-slide-up lg:bottom-6 lg:left-auto lg:right-6 lg:w-80">
      <div className="bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Granted ── */}
        {mode === 'granted' && (
          <>
            <div className="h-1 bg-gradient-to-r from-[#1a6b3a] to-[#4ade80]"/>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white"/>
              </div>
              <div>
                <p className="text-white text-sm font-bold">Notifications enabled!</p>
                <p className="text-white/50 text-[10px]">You'll get alerts for announcements &amp; updates</p>
              </div>
            </div>
          </>
        )}

        {/* ── Blocked — show step-by-step guide ── */}
        {mode === 'blocked' && (
          <>
            <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-400"/>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-amber-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BellOff className="w-4 h-4 text-amber-400"/>
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold leading-tight">Notifications blocked</p>
                    <p className="text-white/40 text-[10px]">You're missing announcements &amp; updates</p>
                  </div>
                </div>
                <button onClick={dismissBlocked} className="text-white/25 hover:text-white/50 flex-shrink-0 ml-2 mt-0.5 transition-colors">
                  <X className="w-4 h-4"/>
                </button>
              </div>

              {/* Step-by-step */}
              <div className="bg-white/5 rounded-xl p-3 space-y-2.5 mb-3">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">How to enable</p>

                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#1a6b3a] flex items-center justify-center flex-shrink-0">
                    <Lock className="w-3 h-3 text-white"/>
                  </div>
                  <p className="text-white/70 text-[11px] leading-snug">
                    Tap the <span className="text-white font-semibold">🔒 lock icon</span> in your browser's address bar
                  </p>
                </div>

                <div className="flex items-center gap-2 pl-1">
                  <ChevronRight className="w-3 h-3 text-white/20 flex-shrink-0"/>
                  <p className="text-white/70 text-[11px]">
                    Tap <span className="text-white font-semibold">Notifications</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 pl-1">
                  <ChevronRight className="w-3 h-3 text-white/20 flex-shrink-0"/>
                  <p className="text-white/70 text-[11px]">
                    Change to <span className="text-amber-400 font-semibold">Allow</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 pl-1">
                  <ChevronRight className="w-3 h-3 text-white/20 flex-shrink-0"/>
                  <p className="text-white/70 text-[11px]">
                    Reload the page
                  </p>
                </div>
              </div>

              <button
                onClick={dismissBlocked}
                className="w-full py-2 text-[11px] font-semibold text-white/30 border border-white/10 rounded-xl hover:border-white/20 transition-colors">
                Remind me later
              </button>
            </div>
          </>
        )}

        {/* ── Ask (default) ── */}
        {mode === 'ask' && (
          <>
            <div className="h-1 bg-gradient-to-r from-[#1a6b3a] to-[#4ade80]"/>
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
                <button onClick={dismissAsk} className="text-white/30 hover:text-white/60 flex-shrink-0 mt-0.5 transition-colors">
                  <X className="w-4 h-4"/>
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={dismissAsk}
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
          </>
        )}

        {/* ── Failed ── */}
        {mode === 'failed' && (
          <>
            <div className="h-1 bg-white/10"/>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <BellOff className="w-4 h-4 text-white/30 flex-shrink-0"/>
              <p className="text-white/50 text-[11px]">
                Tap the lock icon in your browser bar → Notifications → Allow.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
