'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import {
  LayoutDashboard, MapPin, ClipboardList, BookOpen, MessageCircle,
  MessageSquare, User, LogOut, LayoutGrid, TrendingUp, Layers,
  Award, Clock, GraduationCap
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const { student, logout } = useAuth()
  const s = student as any
  const isFresher = !s?.studentType || s.studentType === 'fresher'

  const fresherNav = [
    { href: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
    { href: '/navigate',   label: 'Campus Map',   icon: MapPin },
    { href: '/places',     label: 'All Places',   icon: LayoutGrid },
    { href: '/register',   label: 'Registration', icon: ClipboardList },
    { href: '/library',    label: 'Library',      icon: BookOpen },
    { href: '/events',     label: 'Events',       icon: Clock },
    { href: '/forum',      label: 'Forum',        icon: MessageSquare },
    { href: '/chat',       label: 'AI Assistant', icon: MessageCircle },
    { href: '/profile',    label: 'My Profile',   icon: User },
  ]

  const returningNav = [
    { href: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
    { href: '/cgpa',       label: 'CGPA',         icon: TrendingUp },
    { href: '/courses',    label: 'My Courses',   icon: Layers },
    { href: '/results',    label: 'Results',      icon: Award },
    { href: '/timetable',  label: 'Timetable',    icon: Clock },
    { href: '/library',    label: 'Library',      icon: BookOpen },
    { href: '/events',     label: 'Events',       icon: GraduationCap },
    { href: '/navigate',   label: 'Campus Map',   icon: MapPin },
    { href: '/forum',      label: 'Forum',        icon: MessageSquare },
    { href: '/chat',       label: 'AI Assistant', icon: MessageCircle },
    { href: '/profile',    label: 'My Profile',   icon: User },
  ]

  const nav = isFresher ? fresherNav : returningNav
  const typeLabel = isFresher ? '🎓 Fresher' : '📚 Returning'
  const typeColor = isFresher ? 'text-[#4ade80]' : 'text-[#60a5fa]'

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-52 bg-[#0a0a0a] z-50 border-r border-white/5">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/5">
        <div className="w-7 h-7 bg-[#1a6b3a] rounded-md flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-xs">M</span>
        </div>
        <div>
          <p className="text-white font-black text-sm leading-none tracking-tight">MOUAU Campus</p>
          <p className={`text-[10px] mt-0.5 font-semibold ${typeColor}`}>{typeLabel}</p>
        </div>
      </div>
      {student && (
        <div className="px-3 py-3 border-b border-white/5">
          <div className="flex items-center gap-2.5 px-2.5 py-2 bg-white/5 rounded-lg">
            <div className="w-7 h-7 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {s?.avatar
                ? <img src={s.avatar} alt={student.name} className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-[10px]">{student.name.split(' ').map((w: string) => w[0]).slice(0,2).join('')}</span>
              }
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-xs truncate">{student.name}</p>
              <p className="text-white/30 text-[10px] truncate font-mono">{s?.matricNumber || student.idNumber}</p>
            </div>
          </div>
        </div>
      )}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href + label} href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${active ? 'bg-[#1a6b3a] text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-2 border-t border-white/5">
        <button onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </aside>
  )
}
