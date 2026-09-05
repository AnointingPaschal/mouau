'use client'
import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { student, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !student) router.replace('/')
  }, [student, loading, router])

  if (loading) return (
    <div className="min-h-screen bg-mouau-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-mouau border-t-transparent rounded-full animate-spin"/>
        <p className="text-mouau text-xs font-medium">Loading...</p>
      </div>
    </div>
  )
  if (!student) return null

  return (
    <div className="flex min-h-screen bg-mouau-bg">
      <Sidebar/>
      <main className="flex-1 lg:ml-52 min-w-0">
        <div className="pb-20 lg:pb-6">{children}</div>
      </main>
      <BottomNav/>
    </div>
  )
}
