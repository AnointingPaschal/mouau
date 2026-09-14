'use client'
import { useState, useEffect, useRef } from 'react'
import { Download, Share, Plus, X, ChevronRight, CheckCircle2 } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function detect() {
  if (typeof navigator === 'undefined') return { ios: false, android: false }
  const ua = navigator.userAgent
  return { ios: /iphone|ipad|ipod/i.test(ua), android: /android/i.test(ua) }
}
function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
}

export default function InstallButtons({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const deferredRef  = useRef<BeforeInstallPromptEvent | null>(null)
  const [ready,      setReady]      = useState(false)    // component mounted
  const [hasPrompt,  setHasPrompt]  = useState(false)    // Android install event captured
  const [installed,  setInstalled]  = useState(false)
  const [showIOS,    setShowIOS]    = useState(false)
  const [platform,   setPlatform]   = useState<'android'|'ios'|'other'>('other')

  useEffect(() => {
    setReady(true)
    if (isStandalone()) { setInstalled(true); return }
    const { ios, android } = detect()
    setPlatform(ios ? 'ios' : android ? 'android' : 'other')

    const onPrompt = (e: Event) => {
      e.preventDefault()
      deferredRef.current = e as BeforeInstallPromptEvent
      setHasPrompt(true)
    }
    const onInstalled = () => { setInstalled(true); setHasPrompt(false) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const installAndroid = async () => {
    if (deferredRef.current) {
      await deferredRef.current.prompt()
      const { outcome } = await deferredRef.current.userChoice
      if (outcome === 'accepted') setInstalled(true)
      deferredRef.current = null
      setHasPrompt(false)
    }
    // If no prompt: Chrome already shows its own Add to Home Screen in the browser menu
    // Just open the app in a context where the prompt can fire
  }

  const py   = size === 'sm' ? 'py-2.5 px-5 text-xs' : size === 'lg' ? 'py-4 px-8 text-base' : 'py-3 px-6 text-sm'

  if (!ready) return <div className="h-12"/>

  if (installed) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-white/50">
        <CheckCircle2 className="w-4 h-4 text-[#4ade80]"/> App installed
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2.5 w-full max-w-xs mx-auto">
        {/* Android / primary */}
        <button
          onClick={platform === 'ios' ? () => setShowIOS(true) : installAndroid}
          className={`flex items-center justify-center gap-2.5 bg-[#1a6b3a] hover:bg-[#145530] active:scale-[0.98] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#1a6b3a]/25 ${py}`}>
          <Download className="w-4 h-4 flex-shrink-0"/>
          {platform === 'ios' ? 'Download for iPhone' : 'Download for Android'}
        </button>

        {/* iOS / secondary — shown on non-iOS */}
        {platform !== 'ios' && (
          <button
            onClick={() => setShowIOS(true)}
            className={`flex items-center justify-center gap-2.5 bg-white/8 hover:bg-white/12 active:scale-[0.98] text-white font-bold rounded-xl border border-white/15 transition-all ${py}`}>
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Download for iPhone
          </button>
        )}
      </div>

      {/* iOS guide modal */}
      {showIOS && (
        <div className="fixed inset-0 z-[80] flex items-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowIOS(false)}/>
          <div className="relative w-full max-w-lg mx-auto bg-[#111] rounded-t-3xl overflow-hidden animate-slide-up">
            <div className="h-1 bg-gradient-to-r from-[#1e3a8a] via-[#C9A227] to-[#1a6b3a]"/>
            <div className="flex justify-center pt-3"><div className="w-10 h-1 bg-white/20 rounded-full"/></div>
            <div className="px-5 pb-10 pt-4">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <img src="/icon-192.png" alt="PDM MOUAU" className="w-9 h-9 rounded-xl"/>
                  <div>
                    <p className="text-white font-bold text-sm">Install PDM MOUAU</p>
                    <p className="text-white/40 text-[10px]">3 steps · Safari only</p>
                  </div>
                </div>
                <button onClick={() => setShowIOS(false)} className="text-white/30 hover:text-white/60"><X className="w-5 h-5"/></button>
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: Share,    bg:'#1e3a8a', n:1, label:'Tap the Share button',        sub:'The ↑ icon at the bottom of Safari' },
                  { icon: Plus,     bg:'#C9A227', n:2, label:'Tap "Add to Home Screen"',    sub:'Scroll down in the share sheet' },
                  { icon: Download, bg:'#1a6b3a', n:3, label:'Tap "Add" to confirm',        sub:'The app appears on your home screen' },
                ].map(({ icon: Icon, bg, n, label, sub }) => (
                  <div key={n}>
                    {n > 1 && <div className="flex justify-center py-0.5"><ChevronRight className="w-4 h-4 text-white/15 rotate-90"/></div>}
                    <div className="flex items-center gap-3.5 bg-white/5 rounded-2xl p-3.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:bg}}><Icon className="w-4 h-4 text-white"/></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold">{label}</p>
                        <p className="text-white/40 text-[10px] mt-0.5">{sub}</p>
                      </div>
                      <span className="w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center flex-shrink-0" style={{background:bg}}>{n}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowIOS(false)} className="mt-4 w-full py-2.5 text-xs font-semibold text-white/30 border border-white/10 rounded-xl hover:border-white/20 transition-all">Got it</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
