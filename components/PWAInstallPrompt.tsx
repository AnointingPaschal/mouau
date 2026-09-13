'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Download, X, Share, Plus, ChevronRight } from 'lucide-react'
import { useAppConfig } from '@/lib/useAppConfig'
import { usePathname } from 'next/navigation'

/* ─── types ─── */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

type Platform = 'android' | 'ios' | 'other'
type Step = 'prompt' | 'ios-guide' | 'done'

/* ─── helpers ─── */
function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  return 'other'
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

const DISMISSED_KEY = 'pwa_install_dismissed'
const INSTALLED_KEY = 'pwa_installed'
const DISMISS_DAYS  = 7

function isInstalledOrDismissedRecently(): boolean {
  try {
    // Permanently suppressed once actually installed
    if (localStorage.getItem(INSTALLED_KEY) === '1') return true
    // Temporarily dismissed
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return false
    return (Date.now() - parseInt(raw, 10)) / 86_400_000 < DISMISS_DAYS
  } catch { return false }
}

function markDismissed()  { try { localStorage.setItem(DISMISSED_KEY, String(Date.now())) } catch {} }
function markInstalled()  { try { localStorage.setItem(INSTALLED_KEY, '1'); localStorage.removeItem(DISMISSED_KEY) } catch {} }

/* ─── App Icon ─── */
function AppIcon({ url, size = 'md' }: { url: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-8 h-8' : 'w-12 h-12'
  return (
    <div className={`${cls} rounded-2xl overflow-hidden flex-shrink-0 shadow-lg bg-white`}>
      <img src={url || '/icon-192.png'} alt="PDM MOUAU" className="w-full h-full object-contain" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
export default function PWAInstallPrompt() {
  const [step, setStep]             = useState<Step | null>(null)
  const [platform, setPlatform]     = useState<Platform>('other')
  const deferredEvtRef              = useRef<BeforeInstallPromptEvent | null>(null)
  const [deferredEvt, setDeferredEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const { logoUrl, siteName }       = useAppConfig()
  const pathname                    = usePathname()

  // Pages where we must not show the banner (they have their own overlays / are critical flows)
  const isSuppressedPage = pathname === '/navigate'

  /* 1. Capture Android install prompt — if this fires, app is NOT yet installed */
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      deferredEvtRef.current = e as BeforeInstallPromptEvent
      setDeferredEvt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  /* 2. Listen for actual installation → suppress permanently */
  useEffect(() => {
    const handler = () => {
      markInstalled()
      setStep('done')
    }
    window.addEventListener('appinstalled', handler)
    return () => window.removeEventListener('appinstalled', handler)
  }, [])

  /* 3. Decide whether + when to show */
  useEffect(() => {
    if (isInStandaloneMode())           return  // already running as installed app
    if (isInstalledOrDismissedRecently()) return  // installed or recently dismissed

    const p = detectPlatform()
    setPlatform(p)

    // On the navigate page, suppress entirely (location overlay takes priority;
    // once they're navigating they shouldn't be interrupted)
    if (isSuppressedPage) return

    if (p === 'ios') {
      // iOS: we can't detect installation, show after 8s
      const t = setTimeout(() => setStep('prompt'), 8000)
      return () => clearTimeout(t)
    }

    if (p === 'android') {
      // Android: only show if Chrome actually fired beforeinstallprompt
      // (it does NOT fire if the app is already installed).
      // We wait 10s to give beforeinstallprompt time to arrive, then check.
      const t = setTimeout(() => {
        if (deferredEvtRef.current) setStep('prompt')
        // If no event → already installed or browser won't offer install; stay silent
      }, 10000)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuppressedPage])

  const dismiss = useCallback(() => { markDismissed(); setStep('done') }, [])

  const installAndroid = useCallback(async () => {
    if (!deferredEvt) return
    await deferredEvt.prompt()
    const { outcome } = await deferredEvt.userChoice
    if (outcome === 'accepted') {
      markInstalled()
      setStep('done')
    } else {
      dismiss()
    }
    deferredEvtRef.current = null
    setDeferredEvt(null)
  }, [deferredEvt, dismiss])

  if (!step || step === 'done') return null

  const appName = siteName || 'PDM MOUAU'

  /* ── Android prompt ─── */
  if (step === 'prompt' && platform === 'android') {
    return (
      <div className="fixed bottom-20 left-3 right-3 z-[59] animate-slide-up lg:bottom-6 lg:left-auto lg:right-6 lg:w-80">
        <div className="bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#1e3a8a] via-[#C9A227] to-[#1a6b3a]" />
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <AppIcon url={logoUrl} size="md" />
                <div>
                  <p className="text-white font-bold text-sm">Install {appName}</p>
                  <p className="text-white/50 text-[10px] mt-0.5">Add to Home Screen for quick access</p>
                </div>
              </div>
              <button onClick={dismiss} className="text-white/30 hover:text-white/60 flex-shrink-0 mt-0.5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mb-3">
              {['Works offline', 'Fast launch', 'No browser bar'].map(b => (
                <span key={b} className="flex-1 text-center text-[9px] text-white/40 bg-white/5 rounded-lg py-1.5 px-1">{b}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={dismiss}
                className="flex-1 py-2 text-xs font-semibold text-white/40 border border-white/10 rounded-xl hover:border-white/20 transition-colors">
                Not now
              </button>
              <button onClick={installAndroid}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#1e3a8a] rounded-xl hover:bg-[#1a327a] active:scale-95 transition-all flex items-center justify-center gap-1.5">
                <Download className="w-3 h-3" /> Install App
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── iOS prompt ─── */
  if (step === 'prompt' && platform === 'ios') {
    return (
      <div className="fixed bottom-20 left-3 right-3 z-[59] animate-slide-up lg:bottom-6 lg:left-auto lg:right-6 lg:w-80">
        <div className="bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#1e3a8a] via-[#C9A227] to-[#1a6b3a]" />
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <AppIcon url={logoUrl} size="md" />
                <div>
                  <p className="text-white font-bold text-sm">Add to Home Screen</p>
                  <p className="text-white/50 text-[10px] mt-0.5">Install {appName} like a native app</p>
                </div>
              </div>
              <button onClick={dismiss} className="text-white/30 hover:text-white/60 flex-shrink-0 mt-0.5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={dismiss}
                className="flex-1 py-2 text-xs font-semibold text-white/40 border border-white/10 rounded-xl hover:border-white/20 transition-colors">
                Not now
              </button>
              <button onClick={() => setStep('ios-guide')}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#1a6b3a] rounded-xl hover:bg-[#145530] active:scale-95 transition-all flex items-center justify-center gap-1.5">
                <Plus className="w-3 h-3" /> How to Install
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── iOS step-by-step guide ─── */
  if (step === 'ios-guide') {
    return (
      <div className="fixed inset-0 z-[70] flex items-end">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />
        <div className="relative w-full bg-[#0f0f0f] rounded-t-3xl overflow-hidden animate-slide-up">
          <div className="h-1 bg-gradient-to-r from-[#1e3a8a] via-[#C9A227] to-[#1a6b3a]" />
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>
          <div className="px-5 pb-8 pt-2">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <AppIcon url={logoUrl} size="sm" />
                <div>
                  <p className="text-white font-bold text-sm">Install {appName}</p>
                  <p className="text-white/40 text-[10px]">Follow the steps below</p>
                </div>
              </div>
              <button onClick={dismiss} className="text-white/30 hover:text-white/60 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { icon: Share,    bg: '#1e3a8a', label: 'Tap the Share icon',            sub: 'The ↑ icon at the bottom of Safari', n: 1 },
                { icon: Plus,     bg: '#C9A227', label: 'Tap "Add to Home Screen"',      sub: 'Scroll down in the share sheet to find it', n: 2 },
                { icon: Download, bg: '#1a6b3a', label: 'Tap "Add" to confirm',          sub: 'The app icon will appear on your home screen', n: 3 },
              ].map(({ icon: Icon, bg, label, sub, n }) => (
                <>
                  {n > 1 && <div key={`arr-${n}`} className="flex justify-center"><ChevronRight className="w-4 h-4 text-white/20 rotate-90" /></div>}
                  <div key={n} className="flex items-center gap-4 bg-white/5 rounded-2xl p-3.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold">{label}</p>
                      <p className="text-white/40 text-[10px] mt-0.5">{sub}</p>
                    </div>
                    <span className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: bg }}>{n}</span>
                  </div>
                </>
              ))}
            </div>
            <p className="text-center text-white/25 text-[10px] mt-4">Must be opened in Safari · Works on iPhone & iPad</p>
            <button onClick={dismiss}
              className="mt-3 w-full py-3 text-sm font-semibold text-white/50 border border-white/10 rounded-2xl hover:border-white/20 active:scale-95 transition-all">
              Got it
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
