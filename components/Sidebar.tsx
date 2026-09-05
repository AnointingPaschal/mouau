'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import {
  LayoutDashboard, MapPin, ClipboardList, BookOpen,
  MessageCircle, Users, User, LogOut, Sprout
} from 'lucide-react'

const navItems = [
  { href:'/dashboard', label:'Dashboard', icon:LayoutDashboard },
  { href:'/navigate', label:'Campus Map', icon:MapPin },
  { href:'/register', label:'Registration', icon:ClipboardList },
  { href:'/library', label:'Library', icon:BookOpen },
  { href:'/chat', label:'AI Assistant', icon:MessageCircle },
  { href:'/forum', label:'Community', icon:Users },
  { href:'/profile', label:'My Profile', icon:User },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { student, logout } = useAuth()

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-mouau z-50 shadow-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shadow-md">
          <Sprout className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">MOUAU</p>
          <p className="text-white/60 text-xs">FreshStart</p>
        </div>
      </div>

      {/* Student info */}
      {student && (
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
            <div className="w-9 h-9 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{student.avatar || student.name.slice(0,2).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{student.name}</p>
              <p className="text-white/60 text-xs truncate">{student.idNumber}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                active
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-gold' : 'group-hover:text-gold-light'}`} strokeWidth={2} />
              <span className="font-medium text-sm">{label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all duration-150">
          <LogOut className="w-5 h-5" strokeWidth={2} />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
