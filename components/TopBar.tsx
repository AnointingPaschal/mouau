'use client'
import { useAuth } from './AuthProvider'
import { Bell, Search, X } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { student } = useAuth()
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const h = new Date().getHours()
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) { router.push(`/library?search=${encodeURIComponent(query)}`); setShowSearch(false); setQuery('') }
  }

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#e8e8e8] px-4 lg:px-5 py-2.5">
      <div className="flex items-center justify-between">
        <div>
          {title ? (
            <>
              <h1 className="font-black text-[#0a0a0a] text-sm leading-tight">{title}</h1>
              {subtitle && <p className="text-[11px] text-[#aaa]">{subtitle}</p>}
            </>
          ) : (
            <>
              <p className="text-[11px] text-[#aaa]">{greet},</p>
              <h1 className="font-black text-[#0a0a0a] text-sm">{student?.name?.split(' ')[0]||'Student'}</h1>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {showSearch ? (
            <form onSubmit={search} className="flex items-center">
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                onBlur={() => { if (!query) setShowSearch(false) }}
                placeholder="Search library..." className="input w-40 lg:w-52 text-xs py-1.5"/>
            </form>
          ) : (
            <button onClick={() => setShowSearch(true)} className="p-1.5 rounded-lg hover:bg-[#f9f9f7] text-[#aaa] hover:text-[#0a0a0a] transition-all">
              <Search className="w-4 h-4"/>
            </button>
          )}
          <button className="relative p-1.5 rounded-lg hover:bg-[#f9f9f7] text-[#aaa] transition-all">
            <Bell className="w-4 h-4"/>
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#1a6b3a] rounded-full"/>
          </button>
          <div className="w-7 h-7 bg-[#1a6b3a] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">{student?.avatar||'S'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
