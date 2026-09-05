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
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) { router.push(`/library?search=${encodeURIComponent(query)}`); setShowSearch(false); setQuery('') }
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-3 lg:px-4 py-2">
      <div className="flex items-center justify-between">
        <div>
          {title ? (
            <>
              <h1 className="font-bold text-mouau-dark text-sm leading-tight">{title}</h1>
              {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
            </>
          ) : (
            <>
              <p className="text-[10px] text-gray-400">{greeting},</p>
              <h1 className="font-bold text-mouau-dark text-sm">{student?.name?.split(' ')[0] || 'Student'} 👋</h1>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {showSearch ? (
            <form onSubmit={handleSearch} className="flex items-center">
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                onBlur={() => { if (!query) setShowSearch(false) }}
                placeholder="Search..." className="input w-36 lg:w-48 text-xs py-1.5"/>
            </form>
          ) : (
            <button onClick={() => setShowSearch(true)} className="p-1.5 rounded-lg hover:bg-mouau-surface text-gray-400 hover:text-mouau transition-all">
              <Search className="w-4 h-4"/>
            </button>
          )}
          <button className="relative p-1.5 rounded-lg hover:bg-mouau-surface text-gray-400 hover:text-mouau transition-all">
            <Bell className="w-4 h-4"/>
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-gold rounded-full"/>
          </button>
          <div className="w-7 h-7 bg-mouau rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">{student?.avatar||'S'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
