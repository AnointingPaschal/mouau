'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MapPin, BookOpen, MessageSquare, User } from 'lucide-react'

const nav = [
  { href:'/dashboard', label:'Home',    icon:LayoutDashboard },
  { href:'/navigate',  label:'Map',     icon:MapPin          },
  { href:'/library',   label:'Library', icon:BookOpen        },
  { href:'/forum',     label:'Forum',   icon:MessageSquare   },
  { href:'/profile',   label:'Profile', icon:User            },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e8e8e8]">
      <div className="flex items-center justify-around px-1 py-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${active ? 'text-[#1a6b3a]' : 'text-[#aaa]'}`}>
              <Icon className="w-4.5 h-4.5" style={{width:'18px',height:'18px'}} strokeWidth={active ? 2.5 : 2}/>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
