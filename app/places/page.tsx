'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { getCampusLocations } from '@/lib/db'
import { useRouter } from 'next/navigation'
import {
  MapPin, Search, Navigation2, X, Loader2,
  GraduationCap, Building2, Heart, Home, Utensils,
  Dumbbell, BookOpen, Library, ChevronRight,
  School, Mic2, Hotel, Users
} from 'lucide-react'

type Loc = { id:string; name:string; description:string; lat:number; lng:number; category:string; hours:string; directions:string }

const CAT_CONFIG: Record<string,{label:string;color:string;icon:any;gradient:string}> = {
  college: { label:'Colleges',       color:'#1a6b3a', icon:GraduationCap, gradient:'from-[#1a6b3a] to-[#0d4a26]' },
  admin:   { label:'Administration', color:'#1e293b', icon:Building2,     gradient:'from-[#1e293b] to-[#0f172a]' },
  hostel:  { label:'Hostels',        color:'#6b6b6b', icon:School,        gradient:'from-[#6b6b6b] to-[#4b4b4b]' },
  lodge:   { label:'Lodges',         color:'#6366f1', icon:Hotel,         gradient:'from-[#6366f1] to-[#4f46e5]' },
  social:  { label:'Social & Shops', color:'#d97706', icon:Utensils,      gradient:'from-[#d97706] to-[#b45309]' },
  health:  { label:'Health',         color:'#dc2626', icon:Heart,         gradient:'from-[#dc2626] to-[#b91c1c]' },
  library: { label:'Libraries',      color:'#0891b2', icon:Library,       gradient:'from-[#0891b2] to-[#0369a1]' },
  lecture: { label:'Lecture Halls',  color:'#ea580c', icon:Mic2,          gradient:'from-[#ea580c] to-[#c2410c]' },
  worship: { label:'Worship',        color:'#7c3aed', icon:BookOpen,      gradient:'from-[#7c3aed] to-[#6d28d9]' },
  sport:   { label:'Sports',         color:'#2563eb', icon:Dumbbell,      gradient:'from-[#2563eb] to-[#1d4ed8]' },
}
const CAT_ORDER = ['college','admin','hostel','lodge','social','health','library','lecture','worship','sport']

export default function PlacesPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<Loc[]>([])
  const [loading, setLoading]     = useState(true)
  const [query, setQuery]         = useState('')
  const [activeCat, setActiveCat] = useState('all')

  useEffect(() => {
    getCampusLocations().then(({data}) => {
      if(data) setLocations(data as Loc[])
      setLoading(false)
    })
  },[])

  const filtered = locations.filter(l => {
    if(activeCat !== 'all' && l.category !== activeCat) return false
    if(!query) return true
    const q = query.toLowerCase()
    return l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
  })

  const grouped = CAT_ORDER.reduce((acc,c) => {
    const items = filtered.filter(l => l.category === c)
    if(items.length > 0) acc[c] = items
    return acc
  },{} as Record<string,Loc[]>)

  // Also catch uncategorized
  const knownCats = new Set(CAT_ORDER)
  const other = filtered.filter(l => !knownCats.has(l.category))
  if(other.length > 0) grouped['other'] = other

  const goToMap  = (loc: Loc) => router.push(`/navigate?to=${encodeURIComponent(loc.name+', MOUAU Umudike')}`)
  const getDir   = (loc: Loc) => router.push(`/navigate?to=${encodeURIComponent(loc.lat+','+loc.lng)}&directions=1`)

  return (
    <AppShell>
      <TopBar title="Campus Places" subtitle="All MOUAU locations"/>
      <div className="pb-24">

        {/* Hero */}
        <div className="bg-[#0a0a0a] px-4 pt-5 pb-5">
          <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">MOUAU CAMPUS</p>
          <h1 className="text-white font-black text-2xl leading-tight mb-0.5">All campus<br/><span className="text-[#4ade80]">places.</span></h1>
          <p className="text-white/40 text-xs mb-4">Tap any location to view on map and get directions.</p>

          {/* Search */}
          <div className="flex items-center bg-white/10 border border-white/10 rounded-2xl px-3 py-2.5 gap-2 focus-within:bg-white/15 focus-within:border-white/20 transition-all">
            <Search className="w-4 h-4 text-white/40 flex-shrink-0"/>
            <input value={query} onChange={e=>setQuery(e.target.value)}
              placeholder="Search colleges, buildings, facilities..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30"/>
            {query && <button onClick={()=>setQuery('')}><X className="w-4 h-4 text-white/40"/></button>}
          </div>
        </div>

        {/* Category pills */}
        <div className="bg-[#0a0a0a] border-b border-white/5">
          <div className="flex gap-2 overflow-x-auto px-4 pb-4">
            <button onClick={()=>setActiveCat('all')}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeCat==='all'?'bg-white text-[#0a0a0a]':'text-white/50 border border-white/20 hover:text-white/80'}`}>
              All ({locations.length})
            </button>
            {CAT_ORDER.filter(c=>locations.some(l=>l.category===c)).map(c=>{
              const cfg = CAT_CONFIG[c]
              const count = locations.filter(l=>l.category===c).length
              return (
                <button key={c} onClick={()=>setActiveCat(activeCat===c?'all':c)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${activeCat===c?'text-white border-transparent':'text-white/50 border-white/20 hover:text-white/80'}`}
                  style={activeCat===c?{background:cfg.color}:{}}>
                  <cfg.icon className="w-3 h-3"/>
                  {cfg.label} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-[#f5f5f3] min-h-screen">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-[#1a6b3a] animate-spin"/></div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center px-8">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <MapPin className="w-7 h-7 text-[#ddd]"/>
              </div>
              <p className="font-bold text-[#0a0a0a] text-sm">No places found</p>
              <p className="text-xs text-[#aaa] mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="px-4 pt-5 space-y-6">
              {Object.entries(grouped).map(([cat, items]) => {
                const cfg = CAT_CONFIG[cat] || {label:cat, color:'#6b6b6b', icon:MapPin, gradient:'from-[#6b6b6b] to-[#4b4b4b]'}
                const Icon = cfg.icon
                return (
                  <div key={cat}>
                    {/* Section header */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-3.5 h-3.5 text-white"/>
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <p className="text-xs font-black text-[#0a0a0a] uppercase tracking-widest">{cfg.label}</p>
                        <div className="flex-1 h-px bg-[#e8e8e8]"/>
                        <span className="text-[10px] font-bold text-[#aaa]">{items.length}</span>
                      </div>
                    </div>

                    {/* Cards grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {items.map(loc => (
                        <div key={loc.id}
                          className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                          {/* Colored top strip */}
                          <div className={`h-1 bg-gradient-to-r ${cfg.gradient}`}/>

                          <div className="p-3">
                            {/* Icon circle */}
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 flex-shrink-0"
                              style={{background: cfg.color + '15'}}>
                              <Icon className="w-4 h-4" style={{color: cfg.color}}/>
                            </div>

                            {/* Name */}
                            <h3 className="font-black text-[#0a0a0a] text-xs leading-tight mb-1 line-clamp-2">{loc.name}</h3>

                            {/* Address - subtle */}
                            {loc.description && (
                              <p className="text-[9px] text-[#aaa] leading-relaxed line-clamp-2 mb-3">{loc.description}</p>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-1.5">
                              <button onClick={()=>goToMap(loc)}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold border border-[#e8e8e8] text-[#6b6b6b] hover:border-[#0a0a0a] hover:text-[#0a0a0a] transition-all">
                                <MapPin className="w-2.5 h-2.5"/> View
                              </button>
                              <button onClick={()=>getDir(loc)}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all"
                                style={{background: cfg.color}}>
                                <Navigation2 className="w-2.5 h-2.5"/> Go
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              <div className="h-4"/>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
