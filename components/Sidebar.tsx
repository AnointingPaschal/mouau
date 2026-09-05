'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { LayoutDashboard, MapPin, ClipboardList, BookOpen, MessageCircle, Users, User, LogOut, Sprout } from 'lucide-react'

const nav = [
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
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-52 bg-mouau z-50 shadow-lg">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <div className="w-7 h-7 bg-gold rounded-lg flex items-center justify-center">
          <Sprout className="w-4 h-4 text-white" strokeWidth={2.5}/>
        </div>
        <div>
          <p className="text-white font-bold text-xs leading-none">MOUAU</p>
          <p className="text-white/60 text-[10px]">FreshStart</p>
        </div>
      </div>
      {student && (
        <div className="px-3 py-2 border-b border-white/10">
          <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
            <div className="w-7 h-7 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-[10px]">{student.avatar||'ST'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-xs truncate">{student.name}</p>
              <p className="text-white/60 text-[10px] truncate">{student.idNumber}</p>
            </div>
          </div>
        </div>
      )}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all text-xs ${
                active ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}>
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-gold' : ''}`} strokeWidth={2}/>
              <span className="font-medium">{label}</span>
              {active && <div className="ml-auto w-1 h-1 rounded-full bg-gold"/>}
            </Link>
          )
        })}
      </nav>
      <div className="p-2 border-t border-white/10">
        <button onClick={logout} className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all text-xs">
          <LogOut className="w-3.5 h-3.5"/> Sign Out
        </button>
      </div>
    </aside>
  )
}
