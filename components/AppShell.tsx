'use client'
import NotificationPrompt from './NotificationPrompt'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { student, loading } = useAuth()
  const router = useRouter()

  useEffect(() => { if (!loading && !student) router.replace('/') }, [student, loading, router])

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
    </div>
  )
}
