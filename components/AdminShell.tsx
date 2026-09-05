'use client'
import { useAdmin } from './AdminProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Type, BookOpen, Bell, MapPin, Brain, Users, User, LogOut, ChevronRight } from 'lucide-react'

const nav = [
  { href:'/admin/dashboard', label:'Dashboard', icon:LayoutDashboard },
  { href:'/admin/content', label:'Site Content', icon:Type },
  { href:'/admin/library', label:'Library', icon:BookOpen },
  { href:'/admin/announcements', label:'Announcements', icon:Bell },
  { href:'/admin/map', label:'Campus Map', icon:MapPin },
  { href:'/admin/ai-training', label:'AI Training', icon:Brain },
  { href:'/admin/students', label:'Students', icon:User },
  { href:'/admin/admins', label:'Admin Accounts', icon:Users },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, loading, logout } = useAdmin()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => { if (!loading && !admin) router.replace('/admin') }, [admin, loading, router])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#1a6b3a] border-t-transparent rounded-full animate-spin"/>
    </div>
  )
  if (!admin) return null

  return (
    <div className="flex min-h-screen bg-[#f9f9f7]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-56 bg-[#0a0a0a] z-50">
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/5">
          <div className="w-6 h-6 bg-[#1a6b3a] rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-[10px]">M</span>
          </div>
          <div>
            <p className="text-white font-black text-xs tracking-tight">Admin Panel</p>
            <p className="text-white/30 text-[9px]">MOUAU FreshStart</p>
          </div>
        </div>
        <div className="px-3 py-2.5 border-b border-white/5">
          <div className="px-2.5 py-2 bg-white/5 rounded-lg">
            <p className="text-white text-xs font-medium truncate">{admin.name}</p>
            <p className="text-white/30 text-[10px] truncate">{admin.email}</p>
            {admin.is_super && <span className="inline-block mt-1 text-[9px] font-semibold text-[#1a6b3a] bg-[#1a6b3a]/10 px-1.5 py-0.5 rounded-full">Super Admin</span>}
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            if (href === '/admin/admins' && !admin.is_super) return null
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className={`admin-nav-item ${active ? 'active' : ''}`}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2}/>
                <span className="text-xs">{label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-2 border-t border-white/5">
          <Link href="/dashboard" className="admin-nav-item mb-0.5 text-xs"><ChevronRight className="w-3.5 h-3.5"/>Student View</Link>
          <button onClick={logout} className="admin-nav-item w-full text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10">
            <LogOut className="w-3.5 h-3.5"/> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a] px-4 py-3 flex items-center justify-between">
        <p className="text-white font-black text-sm">Admin Panel</p>
        <button onClick={logout} className="text-white/40 hover:text-red-400 transition-colors">
          <LogOut className="w-4 h-4"/>
        </button>
      </header>

      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 min-w-0">
        {children}
      </main>
    </div>
  )
}
