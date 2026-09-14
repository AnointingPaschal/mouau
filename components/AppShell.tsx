'use client'
import NotificationPrompt from './NotificationPrompt'
import PWAInstallPrompt from './PWAInstallPrompt'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { student, loading } = useAuth()
  const router = useRouter()

  useEffect(() => { if (!loading && !student) router.replace('/') }, [student, loading, router])

  // Track PWA installs independently of notification permission
  useEffect(() => {
    if (!student?.idNumber) return
    const markInstalled = () => {
      fetch('/api/pwa/mark-installed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.idNumber }),
      }).catch(() => {})
    }
    // Already running as installed PWA (opened from home screen)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    if (standalone) markInstalled()
    // User taps Install right now in the browser
    window.addEventListener('appinstalled', markInstalled)
    return () => window.removeEventListener('appinstalled', markInstalled)
  }, [student?.idNumber])

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-[#1a6b3a] border-t-transparent rounded-full animate-spin"/>
    </div>
  )
  if (!student) return null

  return (
    <div className="flex min-h-screen bg-[#f9f9f7]">
      <Sidebar/>
      <div className="flex-1 lg:ml-52 min-w-0 pb-20 lg:pb-0">
        {children}
      </div>
      <BottomNav/>
      <NotificationPrompt/>
      <PWAInstallPrompt/>
    </div>
  )
}
