'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MapPin, BookOpen, MessageCircle, Grid3X3, ClipboardList, Users, User, LogOut, X, LayoutGrid } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from './AuthProvider'

const primary = [
  { href:'/dashboard', label:'Home', icon:LayoutDashboard },
  { href:'/navigate', label:'Map', icon:MapPin },
  { href:'/library', label:'Library', icon:BookOpen },
  { href:'/chat', label:'Chat', icon:MessageCircle },
]
const more = [
  { href:'/places', label:'All Places', icon:LayoutGrid },
  { href:'/register', label:'Registration', icon:ClipboardList },
  { href:'/forum', label:'Community', icon:Users },
  { href:'/profile', label:'Profile', icon:User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [showMore, setShowMore] = useState(false)
  const active = (href: string) => pathname === href

  return (
    <>
      {showMore && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/50"/>
          <div className="relative w-full bg-white rounded-t-2xl p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-black text-sm text-[#0a0a0a]">More</p>
              <button onClick={() => setShowMore(false)} className="p-1 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4"/></button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {more.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setShowMore(false)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all ${active(href)?'bg-[#1a6b3a] text-white':'bg-[#f9f9f7] text-[#0a0a0a]'}`}>
                  <Icon className="w-4 h-4"/>{label}
                </Link>
              ))}
            </div>
            <button onClick={() => { setShowMore(false); logout() }}
              className="flex items-center justify-center gap-2 w-full py-2.5 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
              <LogOut className="w-3.5 h-3.5"/> Sign Out
            </button>
          </div>
        </div>
      )}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e8e8e8] bottom-safe">
        <div className="flex items-center justify-around px-1 py-2">
          {primary.map(({ href, label, icon: Icon }) => {
            const isActive = active(href)
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive?'text-[#1a6b3a]':'text-[#aaa]'}`}>
                <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2}/>
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
          <button onClick={() => setShowMore(true)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[#aaa]">
            <Grid3X3 className="w-4 h-4" strokeWidth={2}/>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
