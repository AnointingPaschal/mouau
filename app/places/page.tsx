'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { getCampusLocations } from '@/lib/db'
import { useRouter } from 'next/navigation'
import {
  MapPin, Search, Navigation2, X, Loader2,
  GraduationCap, Building2, Heart, Home,
  Dumbbell, Library, ChevronRight, School,
  Mic2, Hotel, Utensils, BookOpen
} from 'lucide-react'

type Loc = { id:string; name:string; description:string; lat:number; lng:number; category:string; hours:string; directions:string }

const CAT_CONFIG: Record<string,{label:string;color:string;icon:any;bg:string}> = {
  college: { label:'Colleges',       color:'#1e3a8a', icon:GraduationCap, bg:'#1e3a8a' },
  admin:   { label:'Administration', color:'#0f172a', icon:Building2,     bg:'#0f172a' },
  hostel:  { label:'Hostels',        color:'#64748b', icon:School,        bg:'#64748b' },
  lodge:   { label:'Lodges',         color:'#6366f1', icon:Hotel,         bg:'#6366f1' },
  social:  { label:'Social & Shops', color:'#d97706', icon:Utensils,      bg:'#d97706' },
  health:  { label:'Health',         color:'#b91c1c', icon:Heart,         bg:'#b91c1c' },
  library: { label:'Libraries',      color:'#0891b2', icon:Library,       bg:'#0891b2' },
  lecture: { label:'Lecture Halls',  color:'#c2410c', icon:Mic2,          bg:'#c2410c' },
  worship: { label:'Worship',        color:'#7c3aed', icon:BookOpen,      bg:'#7c3aed' },
  sport:   { label:'Sports',         color:'#059669', icon:Dumbbell,      bg:'#059669' },
}
const CAT_ORDER = ['college','admin','hostel','lodge','social','health','library','lecture','worship','sport']

export default function PlacesPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<Loc[]>([])
  const [loading,   setLoading]   = useState(true)
  const [query,     setQuery]     = useState('')
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
    return l.name.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q)
  })

  const grouped = CAT_ORDER.reduce((acc,c) => {
    const items = filtered.filter(l=>l.category===c).sort((a,b)=>a.name.localeCompare(b.name))
    if(items.length>0) acc[c]=items
    return acc
  },{} as Record<string,Loc[]>)
  const other = filtered.filter(l=>!CAT_ORDER.includes(l.category)).sort((a,b)=>a.name.localeCompare(b.name))
  if(other.length>0) grouped['other']=other

  const getDir = (loc:Loc) => {
    const dest = loc.lat&&loc.lng ? `${loc.lat},${loc.lng}` : encodeURIComponent(loc.name+', MOUAU Umudike')
    router.push(`/navigate?to=${dest}&directions=1`)
  }
  const viewMap = (loc:Loc) => router.push(`/navigate?to=${encodeURIComponent(loc.name+', MOUAU Umudike')}`)

  const activeCfg = activeCat !== 'all' ? CAT_CONFIG[activeCat] : null

  return (
    <AppShell>
      <TopBar title="Campus Places" subtitle="All MOUAU locations"/>
      <div className="pb-24">

        {/* Hero */}
        <div style={{background:'#0a0a0a'}} className="px-4 pt-5 pb-4">
          <p className="text-white/40 text-[9px] font-bold tracking-widest uppercase mb-1">MOUAU Campus</p>
          <h1 className="text-white font-black text-2xl leading-tight mb-0.5">
            Campus <span style={{background:'linear-gradient(90deg,#60a5fa,#f87171)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Places</span>
          </h1>
          <p className="text-white/40 text-xs mb-4">{locations.length} locations · tap any to get directions</p>

          {/* Search */}
          <div className="flex items-center bg-white/10 border border-white/10 rounded-2xl px-3 py-2.5 gap-2 focus-within:bg-white/15 transition-all mb-4">
            <Search className="w-4 h-4 text-white/40 flex-shrink-0"/>
            <input value={query} onChange={e=>setQuery(e.target.value)}
              placeholder="Search colleges, buildings, facilities..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30"/>
            {query && <button onClick={()=>setQuery('')}><X className="w-4 h-4 text-white/40"/></button>}
          </div>

          {/* Category pills on dark bg */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
            <button onClick={()=>setActiveCat('all')}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${activeCat==='all'?'bg-white text-[#0a0a0a]':'text-white/50 border border-white/15'}`}>
              All
            </button>
            {CAT_ORDER.filter(c=>locations.some(l=>l.category===c)).map(c=>{
              const cfg=CAT_CONFIG[c]
              return (
                <button key={c} onClick={()=>setActiveCat(activeCat===c?'all':c)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${activeCat===c?'border-transparent text-white':'border-white/15 text-white/50'}`}
                  style={activeCat===c?{background:cfg.color}:{}}>
                  <cfg.icon className="w-3 h-3"/>{cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div style={{background:'#f5f5f3'}} className="min-h-screen">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{color:'#1e3a8a'}}/></div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center px-8">
              <MapPin className="w-10 h-10 text-[#ddd] mb-3"/>
              <p className="font-bold text-[#0a0a0a] text-sm">No places found</p>
              <button onClick={()=>{setQuery('');setActiveCat('all')}} className="text-xs mt-2" style={{color:'#1e3a8a'}}>Clear filters</button>
            </div>
          ) : (
            <div className="px-4 pt-5 space-y-6">
              {Object.entries(grouped).map(([cat,items])=>{
                const cfg = CAT_CONFIG[cat] || {label:cat,color:'#6b6b6b',icon:MapPin,bg:'#6b6b6b'}
                const Icon = cfg.icon
                return (
                  <div key={cat}>
                    {/* Section header */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{background:cfg.color}}>
                        <Icon className="w-3.5 h-3.5 text-white"/>
                      </div>
                      <p className="text-xs font-black text-[#0a0a0a] uppercase tracking-widest">{cfg.label}</p>
                      <div className="flex-1 h-px bg-[#e8e8e8]"/>
                      <span className="text-[10px] font-bold text-[#aaa]">{items.length}</span>
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {items.map(loc=>(
                        <div key={loc.id} className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col">
                          {/* Top color strip */}
                          <div className="h-0.5 w-full" style={{background:cfg.color}}/>

                          <div className="p-3 flex flex-col flex-1">
                            {/* Icon */}
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 flex-shrink-0"
                              style={{background:cfg.color+'15'}}>
                              <Icon className="w-3.5 h-3.5" style={{color:cfg.color}}/>
                            </div>

                            {/* Name */}
                            <h3 className="font-bold text-[#0a0a0a] text-[11px] leading-snug mb-0.5 line-clamp-2 flex-shrink-0">{loc.name}</h3>

                            {/* Address */}
                            {loc.description && (
                              <p className="text-[9px] text-[#bbb] line-clamp-1 flex-shrink-0 mb-0.5">{loc.description}</p>
                            )}

                            {/* Hours */}
                            {loc.hours && (
                              <p className="text-[9px] font-semibold flex-shrink-0 mb-1" style={{color:cfg.color+'cc'}}>{loc.hours}</p>
                            )}

                            {/* Spacer */}
                            <div className="flex-1"/>

                            {/* Buttons */}
                            <div className="flex gap-1.5 mt-2">
                              <button onClick={()=>viewMap(loc)}
                                className="flex-1 flex items-center justify-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold border border-[#e8e8e8] text-[#6b6b6b] hover:border-[#0a0a0a] hover:text-[#0a0a0a] transition-all">
                                <MapPin className="w-2.5 h-2.5"/> View
                              </button>
                              <button onClick={()=>getDir(loc)}
                                className="flex-1 flex items-center justify-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold text-white transition-all"
                                style={{background:cfg.color}}>
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
