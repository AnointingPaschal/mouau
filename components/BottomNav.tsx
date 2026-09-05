'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MapPin, BookOpen, MessageCircle, Grid3X3 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { ClipboardList, Users, User, LogOut, X } from 'lucide-react'

const primary = [
  { href:'/dashboard', label:'Home', icon:LayoutDashboard },
  { href:'/navigate', label:'Map', icon:MapPin },
  { href:'/library', label:'Library', icon:BookOpen },
  { href:'/chat', label:'Chat', icon:MessageCircle },
]

const more = [
  { href:'/register', label:'Registration', icon:ClipboardList },
  { href:'/forum', label:'Community', icon:Users },
  { href:'/profile', label:'Profile', icon:User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [showMore, setShowMore] = useState(false)

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* More Modal */}
      {showMore && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-mouau text-lg">More Options</h3>
              <button onClick={() => setShowMore(false)} className="p-2 rounded-full bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {more.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setShowMore(false)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
                    isActive(href) ? 'bg-mouau text-white' : 'bg-gray-50 text-gray-700 hover:bg-mouau-surface'
                  }`}>
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              ))}
            </div>
            <button onClick={() => { setShowMore(false); logout() }}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-red-50 text-red-600 font-medium">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-xl bottom-nav-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {primary.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-150 ${
                  active ? 'bg-mouau-surface text-mouau' : 'text-gray-400'
                }`}>
                <Icon className={`w-5 h-5 ${active ? 'text-mouau' : ''}`} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] font-medium ${active ? 'text-mouau' : ''}`}>{label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-mouau" />}
              </Link>
            )
          })}
          <button onClick={() => setShowMore(true)}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl text-gray-400 transition-all duration-150">
            <Grid3X3 className="w-5 h-5" strokeWidth={2} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
