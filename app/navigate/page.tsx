'use client'
import { useEffect, useState, useRef } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { getCampusLocations } from '@/lib/db'
import { Search, X, MapPin, Clock, Navigation2 } from 'lucide-react'
import dynamic from 'next/dynamic'

const CampusMap = dynamic(() => import('@/components/CampusMap'), { ssr: false, loading: () => (
  <div className="flex items-center justify-center h-full bg-[#f9f9f7]">
    <div className="text-center"><div className="w-5 h-5 border-2 border-[#1a6b3a] border-t-transparent rounded-full animate-spin mx-auto mb-2"/><p className="text-xs text-[#aaa]">Loading map...</p></div>
  </div>
)})

type Loc = { id:string; name:string; description:string; lat:number; lng:number; category:string; hours:string; directions:string }

const COLORS: Record<string,string> = { academic:'#1a6b3a', admin:'#0a0a0a', hostel:'#6b6b6b', social:'#d97706', health:'#dc2626', worship:'#7c3aed', sport:'#2563eb' }
const CATS = ['all','academic','admin','hostel','social','health','worship','sport']

export default function NavigatePage() {
  const [locations, setLocations] = useState<Loc[]>([])
  const [selected, setSelected] = useState<Loc|null>(null)
  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState('all')

  useEffect(() => {
    getCampusLocations().then(({ data }) => { if (data) setLocations(data as Loc[]) })
  }, [])

  const filtered = locations.filter(l => {
    const q = query.toLowerCase()
    if (catFilter !== 'all' && l.category !== catFilter) return false
    if (!q) return true
    return l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
  })

  return (
    <AppShell>
      <TopBar title="Campus Map" subtitle="Navigate MOUAU campus"/>
      <div className="flex flex-col h-[calc(100vh-100px)] lg:h-[calc(100vh-60px)]">
        {/* Search */}
        <div className="p-3 border-b border-[#e8e8e8] bg-white space-y-2.5">
          <div className="flex items-center border border-[#e8e8e8] rounded-lg px-3 py-2 bg-[#f9f9f7] gap-2">
            <Search className="w-3.5 h-3.5 text-[#aaa] flex-shrink-0"/>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search locations..." className="flex-1 text-xs outline-none bg-transparent text-[#0a0a0a] placeholder-[#aaa]"/>
            {query && <button onClick={() => setQuery('')}><X className="w-3.5 h-3.5 text-[#aaa]"/></button>}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {CATS.map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${catFilter===c?'bg-[#0a0a0a] text-white':'bg-[#f9f9f7] text-[#6b6b6b] hover:bg-[#e8e8e8]'}`}>
                {c.charAt(0).toUpperCase()+c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="hidden lg:flex flex-col w-72 border-r border-[#e8e8e8] bg-white overflow-y-auto flex-shrink-0">
            <div className="p-2.5 space-y-1">
              {filtered.map(loc => (
                <button key={loc.id} onClick={() => setSelected(loc === selected ? null : loc)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all ${selected?.id===loc.id?'bg-[#0a0a0a] text-white':'hover:bg-[#f9f9f7]'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:COLORS[loc.category]||'#aaa'}}/>
                    <div className="min-w-0">
                      <p className={`font-semibold text-xs truncate ${selected?.id===loc.id?'text-white':'text-[#0a0a0a]'}`}>{loc.name}</p>
                      <p className={`text-[10px] truncate ${selected?.id===loc.id?'text-white/50':'text-[#aaa]'}`}>{loc.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <CampusMap locations={filtered} selected={selected} onSelect={setSelected} colors={COLORS}/>

            {/* Detail panel */}
            {selected && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white rounded-xl shadow-lg border border-[#e8e8e8] p-4 z-10 animate-slide-up">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{background:COLORS[selected.category]||'#aaa'}}/>
                    <h3 className="font-black text-[#0a0a0a] text-sm">{selected.name}</h3>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-1 rounded-full bg-[#f9f9f7]"><X className="w-3.5 h-3.5 text-[#aaa]"/></button>
                </div>
                {selected.description && <p className="text-[#6b6b6b] text-xs mt-1.5 leading-relaxed">{selected.description}</p>}
                {selected.hours && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock className="w-3 h-3 text-[#aaa] flex-shrink-0"/>
                    <p className="text-xs text-[#6b6b6b]">{selected.hours}</p>
                  </div>
                )}
                {selected.directions && (
                  <div className="flex items-start gap-1.5 mt-2 p-2.5 bg-[#f9f9f7] rounded-lg">
                    <Navigation2 className="w-3 h-3 text-[#1a6b3a] flex-shrink-0 mt-0.5"/>
                    <p className="text-xs text-[#6b6b6b] leading-relaxed">{selected.directions}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
