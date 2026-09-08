'use client'
import { useAdmin } from './AdminProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Type, BookOpen, Bell, MapPin, Brain,
  Users, User, LogOut, ChevronRight, ClipboardList, Menu, X,
  Settings2, BellRing, MessageSquare, Calendar, Flag
} from 'lucide-react'

const nav = [
  { href: '/admin/dashboard',    label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/admin/events',       label: 'Events',            icon: Calendar },
  { href: '/admin/forum',        label: 'Forum',             icon: MessageSquare },
  { href: '/admin/content',      label: 'Site Content',      icon: Type },
  { href: '/admin/library',      label: 'Library',           icon: BookOpen },
  { href: '/admin/places',       label: 'Campus Places',     icon: MapPin },
  { href: '/admin/announcements',label: 'Announcements',     icon: Bell },
  { href: '/admin/map',          label: 'Campus Map',        icon: MapPin },
  { href: '/admin/settings/app', label: 'App Settings',      icon: Settings2 },
  { href: '/admin/settings',     label: 'Notif. Settings',   icon: BellRing },
  { href: '/admin/notifications', label: 'Notif. Rules',     icon: BellRing },
  { href: '/admin/ai-training',  label: 'AI Training',       icon: Brain },
  { href: '/admin/registration', label: 'Registration Guide',icon: ClipboardList },
  { href: '/admin/students',     label: 'Students',          icon: User },
  { href: '/admin/admins',       label: 'Admin Accounts',    icon: Users },
]

function NavContent({ onClose }: { onClose?: () => void }) {
  const { admin, logout } = useAdmin()
  const pathname = usePathname()
  return (
    <>
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/5">
        <div className="w-6 h-6 bg-[#1a6b3a] rounded flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-[10px]">M</span>
        </div>
        <div className="flex-1">
          <p className="text-white font-black text-xs tracking-tight">Admin Panel</p>
          <p className="text-white/30 text-[9px]">MOUAU FreshStart</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/30 hover:text-white lg:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="px-3 py-2.5 border-b border-white/5">
        <div className="px-2.5 py-2 bg-white/5 rounded-lg">
          <p className="text-white text-xs font-medium truncate">{admin?.name}</p>
          <p className="text-white/30 text-[10px] truncate">{admin?.email}</p>
          {admin?.is_super && (
            <span className="inline-block mt-1 text-[9px] font-semibold text-[#1a6b3a] bg-[#1a6b3a]/10 px-1.5 py-0.5 rounded-full">
              Super Admin
            </span>
          )}
        </div>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          if (href === '/admin/admins' && !admin?.is_super) return null
          const active = pathname === href
          return (
            <Link key={href} href={href} onClick={onClose}
              className={`admin-nav-item ${active ? 'active' : ''}`}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
              <span className="text-xs">{label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-3 border-t border-white/5">
        <button onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-xs">Sign Out</span>
        </button>
      </div>
    </>
  )
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdmin()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !admin) router.replace('/admin/auth')
  }, [admin, loading, router])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-[#1a6b3a] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!admin) return null

  return (
    <div className="flex min-h-screen bg-[#f9f9f7]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-52 bg-[#111] flex-col fixed inset-y-0 left-0 z-30">
        <NavContent />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-52 bg-[#111] flex flex-col z-50 lg:hidden">
            <NavContent onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-52 min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-[#e8e8e8] sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-[#f0f0f0]">
            <Menu className="w-5 h-5 text-[#0a0a0a]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#1a6b3a] rounded flex items-center justify-center">
              <span className="text-white font-black text-[8px]">M</span>
            </div>
            <span className="font-black text-[#0a0a0a] text-sm">Admin Panel</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
