'use client'
import { useAuth } from './AuthProvider'
import { Bell, Search } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { student } = useAuth()
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/library?search=${encodeURIComponent(query)}`)
      setShowSearch(false)
      setQuery('')
    }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between">
        <div>
          {title ? (
            <>
              <h1 className="font-bold text-mouau-dark text-lg leading-tight">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">{greeting},</p>
              <h1 className="font-bold text-mouau-dark text-lg leading-tight">{student?.name?.split(' ')[0] || 'Student'} 👋</h1>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showSearch ? (
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                onBlur={() => { if (!query) setShowSearch(false) }}
                placeholder="Search library..."
                className="input w-40 lg:w-64 text-sm py-2"
              />
            </form>
          ) : (
            <button onClick={() => setShowSearch(true)}
              className="p-2 rounded-xl hover:bg-mouau-surface text-gray-500 hover:text-mouau transition-all">
              <Search className="w-5 h-5" />
            </button>
          )}

          <button className="relative p-2 rounded-xl hover:bg-mouau-surface text-gray-500 hover:text-mouau transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold rounded-full" />
          </button>

          <div className="w-8 h-8 bg-mouau rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">{student?.avatar || 'S'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
