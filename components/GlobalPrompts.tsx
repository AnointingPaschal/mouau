'use client'
import dynamic from 'next/dynamic'

// Lazy-load both prompts so they don't block page render
const PWAInstallPrompt   = dynamic(() => import('./PWAInstallPrompt'),   { ssr: false })
const NotificationPrompt = dynamic(() => import('./NotificationPrompt'), { ssr: false })

export default function GlobalPrompts() {
  return (
    <>
      <PWAInstallPrompt />
      <NotificationPrompt />
    </>
  )
}
