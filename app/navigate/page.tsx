'use client'
import { useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { CAMPUS_LOCATIONS, CampusLocation } from '@/lib/data'
import { MapPin, Search, Clock, X, Filter } from 'lucide-react'
import dynamic from 'next/dynamic'

const CampusMap = dynamic(() => import('@/components/CampusMap'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-gray-100 rounded-xl flex items-center justify-center"><p className="text-xs text-gray-400">Loading map...</p></div>
})

const CATS = [{id:'all',l:'All'},{id:'academic',l:'Academic'},{id:'admin',l:'Admin'},{id:'hostel',l:'Hostel'},{id:'social',l:'Social'},{id:'health',l:'Health'},{id:'worship',l:'Worship'},{id:'sport',l:'Sport'}]
const CCAT: Record<string,string> = {academic:'bg-blue-100 text-blue-700',admin:'bg-purple-100 text-purple-700',hostel:'bg-amber-100 text-amber-700',social:'bg-pink-100 text-pink-700',health:'bg-red-100 text-red-700',worship:'bg-indigo-100 text-indigo-700',sport:'bg-green-100 text-green-700'}

export default function NavigatePage() {
  const [selected, setSelected] = useState<CampusLocation|null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const filtered = CAMPUS_LOCATIONS.filter(l => {
    const mC = category==='all'||l.category===category
    const mS = !search||l.name.toLowerCase().includes(search.toLowerCase())
    return mC&&mS
  })

  return (
    <AppShell>
      <TopBar title="Campus Map" subtitle="Navigate MOUAU campus"/>
      <div className="p-3 lg:p-4 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-120px)]">
          <div className="flex-1 card overflow-hidden relative" style={{minHeight:'320px'}}>
            <CampusMap locations={filtered} selected={selected} onSelect={setSelected}/>
            {/* Search overlay */}
            <div className="absolute top-3 left-3 right-3 z-10 flex gap-2">
              <div className="flex-1 bg-white rounded-lg shadow-md flex items-center gap-2 px-2.5 py-2">
                <Search className="w-3.5 h-3.5 text-gray-400"/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search locations..." className="flex-1 text-xs outline-none bg-transparent"/>
                {search&&<button onClick={()=>setSearch('')}><X className="w-3 h-3 text-gray-400"/></button>}
              </div>
            </div>
            {/* Category filter */}
            <div className="absolute bottom-3 left-3 right-3 z-10">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {CATS.map(c=>(
                  <button key={c.id} onClick={()=>setCategory(c.id)}
                    className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-sm transition-all ${category===c.id?'bg-mouau text-white':'bg-white text-gray-600'}`}>
                    {c.l}
                  </button>
                ))}
              </div>
            </div>
            {/* Selected card */}
            {selected&&(
              <div className="absolute top-14 left-3 right-3 z-10 animate-slide-up">
                <div className="card shadow-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 bg-mouau rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-white"/>
                      </div>
                      <div>
                        <p className="font-bold text-mouau-dark text-xs">{selected.name}</p>
                        <p className="text-gray-400 text-[10px] mt-0.5 leading-relaxed">{selected.description}</p>
                        {selected.hours&&<div className="flex items-center gap-1 mt-1"><Clock className="w-2.5 h-2.5 text-mouau"/><span className="text-[10px] text-mouau font-medium">{selected.hours}</span></div>}
                        <span className={`badge ${CCAT[selected.category]||'badge-green'} mt-1.5 text-[9px]`}>{selected.category}</span>
                      </div>
                    </div>
                    <button onClick={()=>setSelected(null)}><X className="w-3.5 h-3.5 text-gray-400"/></button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* List */}
          <div className="hidden lg:flex flex-col gap-2 w-60 overflow-y-auto">
            <p className="text-xs font-bold text-mouau-dark">{filtered.length} Locations</p>
            {filtered.map(loc=>(
              <button key={loc.id} onClick={()=>setSelected(loc)}
                className={`card card-hover p-2.5 text-left ${selected?.id===loc.id?'ring-1 ring-mouau':''}`}>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-mouau-surface rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3 h-3 text-mouau"/>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-mouau-dark text-[10px] leading-tight truncate">{loc.name}</p>
                    <span className={`badge ${CCAT[loc.category]||'badge-green'} mt-0.5 text-[9px]`}>{loc.category}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
