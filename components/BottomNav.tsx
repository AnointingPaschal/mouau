'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { LayoutDashboard, MapPin, BookOpen, MessageSquare, User, TrendingUp, Layers } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()
  const { student } = useAuth()
  const s = student as any
  const isFresher = !s?.studentType || s.studentType === 'fresher'

  const fresherNav = [
    { href: '/dashboard', label: 'Home',    icon: LayoutDashboard },
    { href: '/navigate',  label: 'Map',     icon: MapPin },
    { href: '/library',   label: 'Library', icon: BookOpen },
    { href: '/forum',     label: 'Forum',   icon: MessageSquare },
    { href: '/profile',   label: 'Profile', icon: User },
  ]

  const returningNav = [
    { href: '/dashboard', label: 'Home',    icon: LayoutDashboard },
    { href: '/cgpa',      label: 'CGPA',    icon: TrendingUp },
    { href: '/courses',   label: 'Courses', icon: Layers },
    { href: '/forum',     label: 'Forum',   icon: MessageSquare },
    { href: '/profile',   label: 'Profile', icon: User },
  ]

  const nav = isFresher ? fresherNav : returningNav

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e8e8e8]">
      <div className="flex items-center justify-around px-1 py-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${active ? 'text-[#1a6b3a]' : 'text-[#aaa]'}`}>
              <Icon style={{ width: '18px', height: '18px' }} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
