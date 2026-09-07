'use client'
import { useState, useEffect } from 'react'
import { Bell, BellOff, X, Check } from 'lucide-react'
import { subscribeToPush } from '@/lib/notifications'
import { useAuth } from './AuthProvider'

export default function NotificationPrompt() {
  const { student } = useAuth()
  const [show,    setShow]    = useState(false)
  const [status,  setStatus]  = useState<'idle'|'asking'|'granted'|'denied'>('idle')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!student?.idNumber) return
    if (!('Notification' in window)) return
    const dismissed = localStorage.getItem('notif_dismissed')
    const perm = Notification.permission
    if (perm === 'granted') return           // already granted
    if (perm === 'denied')  return           // user blocked — don't ask again
    if (dismissed === 'yes') return          // user dismissed the card
    // Show after 3s on first visit
    const t = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(t)
  }, [student?.idNumber])

  const allow = async () => {
    setLoading(true)
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      const ok = await subscribeToPush(student!.idNumber)
      setStatus(ok ? 'granted' : 'idle')
      if (ok) {
        localStorage.setItem('notif_dismissed', 'yes')
        setTimeout(() => setShow(false), 2500)
      }
    } else {
      setStatus('denied')
      localStorage.setItem('notif_dismissed', 'yes')
      setTimeout(() => setShow(false), 2000)
    }
    setLoading(false)
  }

  const dismiss = () => {
    localStorage.setItem('notif_dismissed', 'yes')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[60] animate-slide-up lg:bottom-6 lg:left-auto lg:right-6 lg:w-80">
      <div className="bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden">
        {/* Green accent top */}
        <div className="h-1 bg-gradient-to-r from-[#1a6b3a] to-[#4ade80]"/>

        {status === 'granted' ? (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-white"/>
            </div>
            <p className="text-white text-sm font-semibold">Notifications enabled!</p>
          </div>
        ) : status === 'denied' ? (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <BellOff className="w-4 h-4 text-red-400"/>
            </div>
            <p className="text-white/70 text-xs">You can enable notifications later in your browser settings.</p>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1a6b3a] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-white"/>
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">Stay updated</p>
                  <p className="text-white/50 text-[10px] mt-0.5">Get notified for comments, reactions & announcements</p>
                </div>
              </div>
              <button onClick={dismiss} className="text-white/30 hover:text-white/60 flex-shrink-0 mt-0.5">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={dismiss}
                className="flex-1 py-2 text-xs font-semibold text-white/40 hover:text-white/60 border border-white/10 rounded-xl transition-colors">
                Not now
              </button>
              <button onClick={allow} disabled={loading}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#1a6b3a] rounded-xl hover:bg-[#145530] active:scale-95 transition-all flex items-center justify-center gap-1.5">
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                ) : (
                  <><Bell className="w-3 h-3"/> Allow</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
