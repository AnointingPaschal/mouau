'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { getCampusLocations } from '@/lib/db'
import { useRouter } from 'next/navigation'
import { MapPin, Search, Navigation2, ChevronRight, X, GraduationCap, Building2, Heart, Home, Utensils, Dumbbell, BookOpen } from 'lucide-react'

type Loc = { id: string; name: string; description: string; lat: number; lng: number; category: string; hours: string; directions: string }

const CAT_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  academic: { label: 'Academic',  color: '#1a6b3a', bg: '#1a6b3a/10', Icon: GraduationCap },
  admin:    { label: 'Admin',     color: '#0a0a0a', bg: 'black/5',    Icon: Building2 },
  hostel:   { label: 'Hostel',    color: '#6b6b6b', bg: 'gray-100',   Icon: Home },
  social:   { label: 'Social',    color: '#d97706', bg: 'amber-50',   Icon: Utensils },
  health:   { label: 'Health',    color: '#dc2626', bg: 'red-50',     Icon: Heart },
  worship:  { label: 'Worship',   color: '#7c3aed', bg: 'violet-50',  Icon: BookOpen },
  sport:    { label: 'Sport',     color: '#2563eb', bg: 'blue-50',    Icon: Dumbbell },
}
const CATS = ['all', 'academic', 'admin', 'hostel', 'social', 'health', 'library', 'lecture', 'worship', 'sport']

export default function PlacesPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<Loc[]>([])
  const [loading, setLoading]     = useState(true)
  const [query, setQuery]         = useState('')
  const [cat, setCat]             = useState('all')
  const [selected, setSelected]   = useState<Loc | null>(null)

  useEffect(() => {
    getCampusLocations().then(({ data }) => {
      if (data) setLocations(data as Loc[])
      setLoading(false)
    })
  }, [])

  const filtered = locations.filter(l => {
    if (cat !== 'all' && l.category !== cat) return false
    if (!query) return true
    const q = query.toLowerCase()
    return l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
  })

  // Group by category
  const grouped = CATS.slice(1).reduce((acc, c) => {
    const items = filtered.filter(l => l.category === c)
    if (items.length > 0) acc[c] = items
    return acc
  }, {} as Record<string, Loc[]>)

  const goToMap = (loc: Loc, openDirections = false) => {
    const params = new URLSearchParams({
      to: loc.name + ', MOUAU Umudike',
      name: loc.name,
      lat: String(loc.lat),
      lng: String(loc.lng),
    })
    if (openDirections) params.set('directions', '1')
    router.push('/navigate?' + params.toString())
  }

  return (
    <AppShell>
      <TopBar title="Campus Places" subtitle="All MOUAU locations"/>
      <div className="p-4 lg:p-5 max-w-2xl mx-auto pb-24 lg:pb-6 space-y-5 animate-fade-in">

        {/* Header */}
        <div>
          <div className="section-label mb-3">MOUAU CAMPUS</div>
          <h1 className="text-xl font-black text-[#0a0a0a]">All campus places.</h1>
          <p className="text-[#6b6b6b] text-sm mt-1">Tap any location to view on map and get directions.</p>
        </div>

        {/* Search */}
        <div className="flex items-center border border-[#e8e8e8] rounded-xl px-3 py-2.5 bg-white gap-2 focus-within:border-[#1a6b3a] transition-colors">
          <Search className="w-3.5 h-3.5 text-[#aaa] flex-shrink-0"/>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search colleges, buildings, facilities..."
            className="flex-1 text-sm outline-none bg-transparent text-[#0a0a0a] placeholder-[#aaa]"/>
          {query && <button onClick={() => setQuery('')}><X className="w-3.5 h-3.5 text-[#aaa]"/></button>}
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize transition-all ${cat === c ? 'bg-[#0a0a0a] text-white' : 'bg-white border border-[#e8e8e8] text-[#6b6b6b] hover:border-[#0a0a0a]'}`}>
              {c === 'all' ? `All (${locations.length})` : (CAT_CONFIG[c]?.label || c)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-2.5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="w-8 h-8 bg-[#f0f0f0] rounded-lg mb-3"/>
                <div className="h-3 bg-[#f0f0f0] rounded w-3/4 mb-1.5"/>
                <div className="h-2.5 bg-[#f0f0f0] rounded w-full"/>
              </div>
            ))}
          </div>
        ) : cat === 'all' ? (
          /* Grouped view */
          <div className="space-y-5">
            {Object.entries(grouped).map(([catKey, items]) => {
              const cfg = CAT_CONFIG[catKey] || { label: catKey, color: '#1a6b3a', bg: '#f9f9f7', Icon: MapPin }
              return (
                <div key={catKey}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: cfg.color + '20' }}>
                      <cfg.Icon className="w-3.5 h-3.5" style={{ color: cfg.color }}/>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
                    <span className="text-[10px] text-[#aaa]">({items.length})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map(loc => (
                      <PlaceCard key={loc.id} loc={loc} cfg={cfg}
                        onView={() => { setSelected(loc); goToMap(loc) }}
                        onDirections={() => goToMap(loc, true)}/>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Single category flat grid */
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map(loc => {
              const cfg = CAT_CONFIG[loc.category] || { label: loc.category, color: '#1a6b3a', bg: '#f9f9f7', Icon: MapPin }
              return (
                <PlaceCard key={loc.id} loc={loc} cfg={cfg}
                  onView={() => goToMap(loc)}
                  onDirections={() => goToMap(loc, true)}/>
              )
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="card p-10 text-center">
            <MapPin className="w-8 h-8 text-[#ddd] mx-auto mb-3"/>
            <p className="font-semibold text-[#0a0a0a] text-sm">No places found</p>
            <p className="text-[#aaa] text-xs mt-1">Try a different search or category</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function PlaceCard({ loc, cfg, onView, onDirections }: { loc: any; cfg: any; onView: () => void; onDirections: () => void }) {
  return (
    <div className="card card-hover overflow-hidden">
      <button onClick={onView} className="w-full text-left p-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5" style={{ background: cfg.color + '15' }}>
          <cfg.Icon className="w-4 h-4" style={{ color: cfg.color }}/>
        </div>
        <p className="font-bold text-[#0a0a0a] text-xs leading-tight mb-1">{loc.name}</p>
        <p className="text-[#aaa] text-[10px] leading-relaxed line-clamp-2">{loc.description}</p>
        {loc.hours && (
          <p className="text-[10px] text-[#1a6b3a] font-medium mt-1.5">{loc.hours}</p>
        )}
      </button>
      <div className="border-t border-[#f0f0f0] flex">
        <button onClick={onView}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7] transition-colors border-r border-[#f0f0f0]">
          <MapPin className="w-3 h-3"/> View
        </button>
        <button onClick={onDirections}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold text-[#1a6b3a] hover:bg-[#1a6b3a]/5 transition-colors">
          <Navigation2 className="w-3 h-3"/> Directions
        </button>
      </div>
    </div>
  )
}
