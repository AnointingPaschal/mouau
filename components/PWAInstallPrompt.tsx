'use client'
import { useState, useEffect, useCallback } from 'react'
import { Download, X, Share, Plus, MoreVertical, ChevronRight } from 'lucide-react'

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
    // @ts-ignore
    (window.navigator as any).standalone === true
  )
}

const STORAGE_KEY = 'pwa_install_dismissed'
const DISMISS_DAYS = 7 // re-show after 7 days

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const ts = parseInt(raw, 10)
    const age = (Date.now() - ts) / 86_400_000
    return age < DISMISS_DAYS
  } catch {
    return false
  }
}

function markDismissed() {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
}

/* ═══════════════════════════════════════════════════════════════ */
export default function PWAInstallPrompt() {
  const [step, setStep]         = useState<Step | null>(null)
  const [platform, setPlatform] = useState<Platform>('other')
  const [deferredEvt, setDeferredEvt] = useState<BeforeInstallPromptEvent | null>(null)

  /* capture the install prompt on Android/Chrome */
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredEvt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  /* decide whether + when to show */
  useEffect(() => {
    if (isInStandaloneMode()) return        // already installed
    if (wasDismissedRecently()) return      // user said "not now" recently

    const p = detectPlatform()
    setPlatform(p)

    // show after 8s (after notification prompt at 3s)
    const t = setTimeout(() => {
      if (p === 'android' || p === 'ios') setStep('prompt')
    }, 8000)
    return () => clearTimeout(t)
  }, [])

  const dismiss = useCallback(() => {
    markDismissed()
    setStep('done')
  }, [])

  /* Android: trigger native browser prompt */
  const installAndroid = useCallback(async () => {
    if (!deferredEvt) return
    await deferredEvt.prompt()
    const { outcome } = await deferredEvt.userChoice
    if (outcome === 'accepted') {
      setStep('done')
    } else {
      dismiss()
    }
    setDeferredEvt(null)
  }, [deferredEvt, dismiss])

  /* iOS: show step-by-step guide */
  const showIOSGuide = useCallback(() => setStep('ios-guide'), [])

  if (!step || step === 'done') return null

  /* ── Android prompt ─────────────────────────────────────────── */
  if (step === 'prompt' && platform === 'android') {
    return (
      <div className="fixed bottom-20 left-3 right-3 z-[59] animate-slide-up lg:bottom-6 lg:left-auto lg:right-6 lg:w-80">
        <div className="bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#1e3a8a] via-[#C9A227] to-[#1a6b3a]" />
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                {/* App icon preview */}
                <img
                  src="/icon-192.png"
                  alt="PDM MOUAU"
                  className="w-12 h-12 rounded-xl flex-shrink-0 shadow-lg"
                />
                <div>
                  <p className="text-white font-bold text-sm">Install PDM MOUAU</p>
                  <p className="text-white/50 text-[10px] mt-0.5">Add to Home Screen for quick access</p>
                </div>
              </div>
              <button onClick={dismiss} className="text-white/30 hover:text-white/60 flex-shrink-0 mt-0.5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Benefits row */}
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
                <Download className="w-3 h-3" />
                Install App
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── iOS prompt ─────────────────────────────────────────────── */
  if (step === 'prompt' && platform === 'ios') {
    return (
      <div className="fixed bottom-20 left-3 right-3 z-[59] animate-slide-up lg:bottom-6 lg:left-auto lg:right-6 lg:w-80">
        <div className="bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#1e3a8a] via-[#C9A227] to-[#1a6b3a]" />
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <img src="/icon-192.png" alt="PDM MOUAU" className="w-12 h-12 rounded-xl flex-shrink-0 shadow-lg" />
                <div>
                  <p className="text-white font-bold text-sm">Add to Home Screen</p>
                  <p className="text-white/50 text-[10px] mt-0.5">Install PDM MOUAU like a native app</p>
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
              <button onClick={showIOSGuide}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#1a6b3a] rounded-xl hover:bg-[#145530] active:scale-95 transition-all flex items-center justify-center gap-1.5">
                <Plus className="w-3 h-3" />
                How to Install
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── iOS step-by-step guide ─────────────────────────────────── */
  if (step === 'ios-guide') {
    return (
      <div className="fixed inset-0 z-[70] flex items-end">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

        {/* Sheet */}
        <div className="relative w-full bg-[#0f0f0f] rounded-t-3xl overflow-hidden animate-slide-up">
          <div className="h-1 bg-gradient-to-r from-[#1e3a8a] via-[#C9A227] to-[#1a6b3a]" />

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>

          <div className="px-5 pb-8 pt-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-xl shadow" />
                <div>
                  <p className="text-white font-bold text-sm">Install PDM MOUAU</p>
                  <p className="text-white/40 text-[10px]">Follow the steps below</p>
                </div>
              </div>
              <button onClick={dismiss} className="text-white/30 hover:text-white/60 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-3.5">
                <div className="w-9 h-9 bg-[#1e3a8a] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Share className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold">Tap the Share icon</p>
                  <p className="text-white/40 text-[10px] mt-0.5">
                    The <span className="text-white/70 font-medium">↑</span> icon at the bottom of Safari
                  </p>
                </div>
                <span className="w-6 h-6 rounded-full bg-[#1e3a8a] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ChevronRight className="w-4 h-4 text-white/20 rotate-90" />
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-3.5">
                <div className="w-9 h-9 bg-[#C9A227] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold">Tap "Add to Home Screen"</p>
                  <p className="text-white/40 text-[10px] mt-0.5">Scroll down in the share sheet to find it</p>
                </div>
                <span className="w-6 h-6 rounded-full bg-[#C9A227] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ChevronRight className="w-4 h-4 text-white/20 rotate-90" />
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-3.5">
                <div className="w-9 h-9 bg-[#1a6b3a] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold">Tap "Add" to confirm</p>
                  <p className="text-white/40 text-[10px] mt-0.5">The app icon will appear on your home screen</p>
                </div>
                <span className="w-6 h-6 rounded-full bg-[#1a6b3a] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
              </div>
            </div>

            {/* Footer note */}
            <p className="text-center text-white/25 text-[10px] mt-4">
              Must be opened in Safari · Works on iPhone & iPad
            </p>

            {/* Dismiss */}
            <button
              onClick={dismiss}
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
