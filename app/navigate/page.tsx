'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { CAMPUS_LOCATIONS, CampusLocation } from '@/lib/data'
import { MapPin, Search, Clock, Filter, X, Navigation } from 'lucide-react'
import dynamic from 'next/dynamic'

const CampusMap = dynamic(() => import('@/components/CampusMap'), { ssr: false,
  loading: () => (
    <div className="flex-1 bg-gray-100 rounded-2xl flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-mouau border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-500 text-sm">Loading campus map...</p>
      </div>
    </div>
  )
})

const CATEGORIES = [
  { id:'all', label:'All' },
  { id:'academic', label:'Academic' },
  { id:'admin', label:'Admin' },
  { id:'hostel', label:'Hostels' },
  { id:'social', label:'Social' },
  { id:'health', label:'Health' },
  { id:'worship', label:'Worship' },
  { id:'sport', label:'Sports' },
]

const CAT_COLORS: Record<string, string> = {
  academic:'bg-blue-100 text-blue-700',
  admin:'bg-purple-100 text-purple-700',
  hostel:'bg-amber-100 text-amber-700',
  social:'bg-pink-100 text-pink-700',
  health:'bg-red-100 text-red-700',
  worship:'bg-indigo-100 text-indigo-700',
  sport:'bg-green-100 text-green-700',
}

export default function NavigatePage() {
  const [selected, setSelected] = useState<CampusLocation | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [showList, setShowList] = useState(false)

  const filtered = CAMPUS_LOCATIONS.filter(loc => {
    const matchCat = category === 'all' || loc.category === category
    const matchSearch = !search || loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <AppShell>
      <TopBar title="Campus Map" subtitle="Navigate MOUAU campus"/>
      <div className="p-4 lg:p-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)]">

          {/* Map */}
          <div className="flex-1 card overflow-hidden relative" style={{minHeight:'350px'}}>
            <CampusMap locations={filtered} selected={selected} onSelect={setSelected}/>

            {/* Map Controls */}
            <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
              <div className="flex-1 bg-white rounded-xl shadow-lg flex items-center gap-2 px-3 py-2.5">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0"/>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search locations..." className="flex-1 text-sm outline-none bg-transparent"/>
                {search && <button onClick={()=>setSearch('')}><X className="w-4 h-4 text-gray-400"/></button>}
              </div>
              <button onClick={()=>setShowList(!showList)}
                className="bg-white shadow-lg rounded-xl p-2.5 hover:bg-mouau-surface transition-all">
                <Filter className="w-5 h-5 text-mouau"/>
              </button>
            </div>

            {/* Category Filter */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map(c=>(
                  <button key={c.id} onClick={()=>setCategory(c.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all ${
                      category===c.id ? 'bg-mouau text-white' : 'bg-white text-gray-600 hover:bg-mouau-surface'
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Location Card */}
            {selected && (
              <div className="absolute top-16 left-4 right-4 z-10 animate-slide-up">
                <div className="card shadow-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-mouau rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-white"/>
                      </div>
                      <div>
                        <h3 className="font-bold text-mouau-dark text-sm">{selected.name}</h3>
                        <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{selected.description}</p>
                        {selected.hours && (
                          <div className="flex items-center gap-1 mt-2">
                            <Clock className="w-3 h-3 text-mouau"/>
                            <span className="text-xs text-mouau font-medium">{selected.hours}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={()=>setSelected(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <X className="w-4 h-4"/>
                    </button>
                  </div>
                  <span className={`badge ${CAT_COLORS[selected.category]||'badge-green'} mt-2`}>
                    {selected.category}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Location List - Desktop sidebar / Mobile sheet */}
          <div className={`lg:w-72 lg:flex flex-col gap-3 overflow-y-auto ${showList ? 'flex' : 'hidden lg:flex'}`}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-mouau-dark text-sm">{filtered.length} Locations</h2>
              <Navigation className="w-4 h-4 text-gray-400"/>
            </div>
            <div className="space-y-2">
              {filtered.map(loc=>(
                <button key={loc.id} onClick={()=>setSelected(loc)}
                  className={`w-full card card-hover p-3 text-left transition-all ${selected?.id===loc.id?'ring-2 ring-mouau':''}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-mouau-surface rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-mouau"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-mouau-dark text-xs leading-tight truncate">{loc.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{loc.description}</p>
                      <span className={`badge ${CAT_COLORS[loc.category]||'badge-green'} mt-1 text-[10px]`}>
                        {loc.category}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
