'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { getCampusLocations } from '@/lib/db'
import {
  Search, X, MapPin, Clock, Navigation2, ArrowRight,
  Loader2, LocateFixed, ChevronDown, ChevronUp,
  CornerUpRight, CornerDownRight, MoveRight, AlertCircle,
  Map, Compass
} from 'lucide-react'
import dynamic from 'next/dynamic'

const CampusMap = dynamic(() => import('@/components/CampusMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#f9f9f7]">
      <div className="text-center">
        <div className="w-5 h-5 border-2 border-[#1a6b3a] border-t-transparent rounded-full animate-spin mx-auto mb-2"/>
        <p className="text-xs text-[#aaa]">Loading map...</p>
      </div>
    </div>
  )
})

type Loc = { id: string; name: string; description: string; lat: number; lng: number; category: string; hours: string; directions: string }
type Suggestion = { description: string; place_id: string; structured_formatting?: { main_text: string; secondary_text: string } }
type RouteStep = { html_instructions?: string; instructions?: string; distance?: { text: string }; duration?: { text: string }; maneuver?: string; start_location?: { lat: number; lng: number }; end_location?: { lat: number; lng: number } }

const COLORS: Record<string, string> = {
  academic: '#1a6b3a', admin: '#0a0a0a', hostel: '#6b6b6b',
  social: '#d97706', health: '#dc2626', worship: '#7c3aed', sport: '#2563eb'
}
const CATS = ['all', 'academic', 'admin', 'hostel', 'social', 'health', 'sport']

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function maneuverIcon(maneuver?: string) {
  if (!maneuver) return <MoveRight className="w-3.5 h-3.5"/>
  if (maneuver.includes('left')) return <CornerDownRight className="w-3.5 h-3.5 scale-x-[-1]"/>
  if (maneuver.includes('right')) return <CornerDownRight className="w-3.5 h-3.5"/>
  if (maneuver.includes('roundabout')) return <span className="text-xs">↻</span>
  return <MoveRight className="w-3.5 h-3.5"/>
}

export default function NavigatePage() {
  const [mode, setMode] = useState<'explore' | 'directions'>('explore')
  const [locations, setLocations] = useState<Loc[]>([])
  const [selected, setSelected] = useState<Loc | null>(null)
  const [catFilter, setCatFilter] = useState('all')

  // Explore search
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loadingSugg, setLoadingSugg] = useState(false)
  const suggTimer = useRef<any>(null)

  // Directions
  const [fromText, setFromText] = useState('')
  const [toText, setToText] = useState('')
  const [fromSugg, setFromSugg] = useState<Suggestion[]>([])
  const [toSugg, setToSugg] = useState<Suggestion[]>([])
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [loadingDir, setLoadingDir] = useState(false)
  const [dirError, setDirError] = useState('')
  const [dirResult, setDirResult] = useState<any>(null)
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
  const [showSteps, setShowSteps] = useState(true)
  const [gettingLocation, setGettingLocation] = useState(false)
  const fromTimer = useRef<any>(null)
  const toTimer = useRef<any>(null)

  useEffect(() => {
    getCampusLocations().then(({ data }) => { if (data) setLocations(data as Loc[]) })
  }, [])

  // Autocomplete for explore search
  const searchSuggestions = useCallback(async (val: string) => {
    if (val.length < 2) { setSuggestions([]); return }
    setLoadingSugg(true)
    try {
      const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(val)}`)
      const data = await res.json()
      setSuggestions(data.predictions || [])
    } catch { setSuggestions([]) }
    setLoadingSugg(false)
  }, [])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    clearTimeout(suggTimer.current)
    suggTimer.current = setTimeout(() => searchSuggestions(val), 350)
  }

  // Autocomplete for directions
  const handleFromChange = (val: string) => {
    setFromText(val); setFromId(''); setDirResult(null); setRouteCoords([])
    clearTimeout(fromTimer.current)
    fromTimer.current = setTimeout(async () => {
      if (val.length < 2) { setFromSugg([]); return }
      const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(val)}`).catch(() => null)
      if (res) { const d = await res.json(); setFromSugg(d.predictions || []) }
    }, 350)
  }

  const handleToChange = (val: string) => {
    setToText(val); setToId(''); setDirResult(null); setRouteCoords([])
    clearTimeout(toTimer.current)
    toTimer.current = setTimeout(async () => {
      if (val.length < 2) { setToSugg([]); return }
      const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(val)}`).catch(() => null)
      if (res) { const d = await res.json(); setToSugg(d.predictions || []) }
    }, 350)
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setFromText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        setFromId('')
        setFromSugg([])
        setGettingLocation(false)
      },
      () => {
        setFromText('MOUAU Main Gate, Umudike')
        setGettingLocation(false)
      }
    )
  }

  // Fill "To" from a DB campus location
  const selectCampusLocationAsDest = (loc: Loc) => {
    setToText(loc.name + ', MOUAU Umudike')
    setToId('')
    setToSugg([])
    setSelected(loc)
  }

  const getDirections = async () => {
    if (!fromText.trim() || !toText.trim()) {
      setDirError('Enter both a starting point and destination'); return
    }
    setDirError(''); setLoadingDir(true); setDirResult(null); setRouteCoords([])
    try {
      let url = `/api/maps/directions?origin=${encodeURIComponent(fromText)}&destination=${encodeURIComponent(toText)}`
      if (fromId) url += `&origin_place_id=${fromId}`
      if (toId) url += `&destination_place_id=${toId}`
      const res = await fetch(url)
      const data = await res.json()

      if (data.error) { setDirError('Could not find directions. Try more specific locations.'); setLoadingDir(false); return }

      setDirResult(data)

      // Extract route coordinates from steps
      const coords: [number, number][] = []
      const legs = data.directions?.[0]?.legs || data.routes?.[0]?.legs || []
      if (legs.length > 0) {
        const steps: RouteStep[] = legs[0].steps || []
        steps.forEach((step: RouteStep) => {
          if (step.start_location) coords.push([step.start_location.lat, step.start_location.lng])
          if (step.end_location) coords.push([step.end_location.lat, step.end_location.lng])
        })
      }
      // Fallback: use geocoded start/end from legs
      if (coords.length === 0) {
        const leg = legs[0]
        if (leg?.start_location) coords.push([leg.start_location.lat, leg.start_location.lng])
        if (leg?.end_location) coords.push([leg.end_location.lat, leg.end_location.lng])
      }
      setRouteCoords(coords)
    } catch {
      setDirError('Failed to get directions. Please try again.')
    }
    setLoadingDir(false)
  }

  // Filtered locations for explore
  const filtered = locations.filter(l => {
    if (catFilter !== 'all' && l.category !== catFilter) return false
    if (!query) return true
    const q = query.toLowerCase()
    return l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
  })

  const leg = dirResult?.directions?.[0]?.legs?.[0] || dirResult?.routes?.[0]?.legs?.[0]
  const steps: RouteStep[] = leg?.steps || []
  const totalDist = leg?.distance?.text || ''
  const totalDur = leg?.duration?.text || ''

  return (
    <AppShell>
      <TopBar title="Campus Navigation" subtitle="Powered by Google Maps"/>
      <div className="flex flex-col h-[calc(100vh-104px)] lg:h-[calc(100vh-60px)]">

        {/* Mode toggle */}
        <div className="flex border-b border-[#e8e8e8] bg-white">
          {(['explore', 'directions'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setDirResult(null); setRouteCoords([]) }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${mode === m ? 'border-[#1a6b3a] text-[#1a6b3a]' : 'border-transparent text-[#aaa] hover:text-[#6b6b6b]'}`}>
              {m === 'explore' ? <><Map className="w-3.5 h-3.5"/> Explore Campus</> : <><Compass className="w-3.5 h-3.5"/> Get Directions</>}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white border-b border-[#e8e8e8] px-3 py-2.5 space-y-2">
          {mode === 'explore' ? (
            <>
              {/* Explore search */}
              <div className="relative">
                <div className="flex items-center border border-[#e8e8e8] rounded-xl px-3 py-2 bg-[#f9f9f7] gap-2 focus-within:border-[#1a6b3a] transition-colors">
                  <Search className="w-3.5 h-3.5 text-[#aaa] flex-shrink-0"/>
                  <input value={query} onChange={e => handleQueryChange(e.target.value)}
                    placeholder="Search any location on campus..."
                    className="flex-1 text-xs outline-none bg-transparent text-[#0a0a0a] placeholder-[#aaa]"/>
                  {loadingSugg && <Loader2 className="w-3.5 h-3.5 text-[#1a6b3a] animate-spin flex-shrink-0"/>}
                  {query && <button onClick={() => { setQuery(''); setSuggestions([]) }}><X className="w-3.5 h-3.5 text-[#aaa]"/></button>}
                </div>
                {/* Google suggestions dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-[#e8e8e8] rounded-xl shadow-lg overflow-hidden">
                    {suggestions.slice(0, 5).map((s, i) => (
                      <button key={i} onClick={() => { setQuery(s.description); setSuggestions([]) }}
                        className="w-full flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-[#f9f9f7] text-left border-b border-[#f0f0f0] last:border-0 transition-colors">
                        <MapPin className="w-3 h-3 text-[#1a6b3a] mt-0.5 flex-shrink-0"/>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#0a0a0a] truncate">
                            {s.structured_formatting?.main_text || s.description.split(',')[0]}
                          </p>
                          <p className="text-[10px] text-[#aaa] truncate">
                            {s.structured_formatting?.secondary_text || s.description}
                          </p>
                        </div>
                      </button>
                    ))}
                    <div className="px-3.5 py-1.5 flex items-center justify-end gap-1">
                      <span className="text-[9px] text-[#aaa]">powered by</span>
                      <span className="text-[9px] font-semibold text-[#4285f4]">Google</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Category filters */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {CATS.map(c => (
                  <button key={c} onClick={() => setCatFilter(c)}
                    className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all capitalize ${catFilter === c ? 'bg-[#0a0a0a] text-white' : 'bg-[#f9f9f7] text-[#6b6b6b] hover:bg-[#e8e8e8]'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Directions inputs */
            <div className="space-y-2">
              {/* From */}
              <div className="relative">
                <div className="flex items-center border border-[#e8e8e8] rounded-xl bg-white overflow-hidden focus-within:border-[#1a6b3a] transition-colors">
                  <div className="px-3 flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1a6b3a] border-2 border-[#1a6b3a]/30"/>
                  </div>
                  <input value={fromText} onChange={e => handleFromChange(e.target.value)}
                    placeholder="Starting point..."
                    className="flex-1 py-2.5 text-xs outline-none text-[#0a0a0a] placeholder-[#aaa]"/>
                  <button onClick={useMyLocation} disabled={gettingLocation} title="Use my location"
                    className="px-3 text-[#1a6b3a] hover:text-[#145530] transition-colors flex-shrink-0">
                    {gettingLocation ? <Loader2 className="w-4 h-4 animate-spin"/> : <LocateFixed className="w-4 h-4"/>}
                  </button>
                </div>
                {fromSugg.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-[#e8e8e8] rounded-xl shadow-lg overflow-hidden">
                    {fromSugg.slice(0, 4).map((s, i) => (
                      <button key={i} onClick={() => { setFromText(s.description); setFromId(s.place_id); setFromSugg([]) }}
                        className="w-full flex items-start gap-2.5 px-3.5 py-2 hover:bg-[#f9f9f7] text-left border-b border-[#f0f0f0] last:border-0">
                        <MapPin className="w-3 h-3 text-[#1a6b3a] mt-0.5 flex-shrink-0"/>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#0a0a0a] truncate">{s.structured_formatting?.main_text || s.description.split(',')[0]}</p>
                          <p className="text-[10px] text-[#aaa] truncate">{s.structured_formatting?.secondary_text || ''}</p>
                        </div>
                      </button>
                    ))}
                    <div className="px-3.5 py-1 flex items-center justify-end gap-1">
                      <span className="text-[9px] text-[#aaa]">powered by</span><span className="text-[9px] font-semibold text-[#4285f4]">Google</span>
                    </div>
                  </div>
                )}
              </div>

              {/* To */}
              <div className="relative">
                <div className="flex items-center border border-[#e8e8e8] rounded-xl bg-white overflow-hidden focus-within:border-[#dc2626] transition-colors">
                  <div className="px-3 flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"/>
                  </div>
                  <input value={toText} onChange={e => handleToChange(e.target.value)}
                    placeholder="Destination on campus..."
                    className="flex-1 py-2.5 text-xs outline-none text-[#0a0a0a] placeholder-[#aaa]"/>
                  {toText && <button onClick={() => { setToText(''); setToId(''); setToSugg([]) }} className="px-3"><X className="w-3.5 h-3.5 text-[#aaa]"/></button>}
                </div>
                {toSugg.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-[#e8e8e8] rounded-xl shadow-lg overflow-hidden">
                    {/* Campus locations first */}
                    {locations.filter(l => l.name.toLowerCase().includes(toText.toLowerCase())).slice(0, 3).map(l => (
                      <button key={l.id} onClick={() => selectCampusLocationAsDest(l)}
                        className="w-full flex items-start gap-2.5 px-3.5 py-2 hover:bg-[#f9f9f7] text-left border-b border-[#f0f0f0]">
                        <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" style={{ background: COLORS[l.category] || '#1a6b3a' }}/>
                        <div>
                          <p className="text-xs font-semibold text-[#0a0a0a]">{l.name}</p>
                          <p className="text-[10px] text-[#1a6b3a]">On Campus · {l.category}</p>
                        </div>
                      </button>
                    ))}
                    {toSugg.slice(0, 3).map((s, i) => (
                      <button key={i} onClick={() => { setToText(s.description); setToId(s.place_id); setToSugg([]) }}
                        className="w-full flex items-start gap-2.5 px-3.5 py-2 hover:bg-[#f9f9f7] text-left border-b border-[#f0f0f0] last:border-0">
                        <MapPin className="w-3 h-3 text-[#aaa] mt-0.5 flex-shrink-0"/>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#0a0a0a] truncate">{s.structured_formatting?.main_text || s.description.split(',')[0]}</p>
                          <p className="text-[10px] text-[#aaa] truncate">{s.structured_formatting?.secondary_text || ''}</p>
                        </div>
                      </button>
                    ))}
                    <div className="px-3.5 py-1 flex items-center justify-end gap-1">
                      <span className="text-[9px] text-[#aaa]">powered by</span><span className="text-[9px] font-semibold text-[#4285f4]">Google</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick campus destinations */}
              {!toText && (
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {locations.slice(0, 6).map(l => (
                    <button key={l.id} onClick={() => selectCampusLocationAsDest(l)}
                      className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-[#f9f9f7] border border-[#e8e8e8] rounded-full text-[10px] font-semibold text-[#0a0a0a] hover:border-[#1a6b3a]/40 transition-colors whitespace-nowrap">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: COLORS[l.category] || '#1a6b3a' }}/>
                      {l.name.replace('University ', '').replace('College of ', '')}
                    </button>
                  ))}
                </div>
              )}

              <button onClick={getDirections} disabled={loadingDir || !fromText || !toText}
                className="btn-primary w-full flex items-center justify-center gap-1.5">
                {loadingDir ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Getting directions...</> : <><Navigation2 className="w-3.5 h-3.5"/>Get Directions</>}
              </button>

              {dirError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0"/>
                  <p className="text-xs text-red-600">{dirError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar (desktop) / bottom panel (mobile - directions result) */}
          {mode === 'explore' && (
            <div className="hidden lg:flex flex-col w-72 border-r border-[#e8e8e8] bg-white overflow-y-auto flex-shrink-0">
              <div className="p-2.5 space-y-1">
                <p className="text-[9px] font-semibold text-[#aaa] uppercase tracking-widest px-2 py-1">{filtered.length} LOCATIONS</p>
                {filtered.map(loc => (
                  <button key={loc.id} onClick={() => setSelected(loc === selected ? null : loc)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all ${selected?.id === loc.id ? 'bg-[#0a0a0a] text-white' : 'hover:bg-[#f9f9f7]'}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[loc.category] || '#1a6b3a' }}/>
                      <div className="min-w-0">
                        <p className={`font-semibold text-xs truncate ${selected?.id === loc.id ? 'text-white' : 'text-[#0a0a0a]'}`}>{loc.name}</p>
                        <p className={`text-[10px] truncate ${selected?.id === loc.id ? 'text-white/50' : 'text-[#aaa]'}`}>{loc.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          <div className="flex-1 relative overflow-hidden">
            <CampusMap
              locations={mode === 'explore' ? filtered : locations}
              selected={selected}
              onSelect={setSelected}
              colors={COLORS}
              route={routeCoords}
              routeOriginLabel={fromText.split(',')[0]}
              routeDestLabel={toText.split(',')[0]}
            />

            {/* Explore: Selected location detail card */}
            {mode === 'explore' && selected && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-white rounded-2xl shadow-xl border border-[#e8e8e8] p-4 z-10 animate-slide-up">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[selected.category] || '#1a6b3a' }}/>
                    <h3 className="font-black text-[#0a0a0a] text-sm">{selected.name}</h3>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-1 rounded-full bg-[#f9f9f7] flex-shrink-0"><X className="w-3.5 h-3.5 text-[#aaa]"/></button>
                </div>
                {selected.description && <p className="text-[#6b6b6b] text-xs mb-2 leading-relaxed">{selected.description}</p>}
                {selected.hours && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="w-3 h-3 text-[#aaa] flex-shrink-0"/>
                    <p className="text-xs text-[#6b6b6b]">{selected.hours}</p>
                  </div>
                )}
                {selected.directions && (
                  <div className="flex items-start gap-1.5 p-2.5 bg-[#f9f9f7] rounded-lg mb-3">
                    <Navigation2 className="w-3 h-3 text-[#1a6b3a] flex-shrink-0 mt-0.5"/>
                    <p className="text-xs text-[#6b6b6b] leading-relaxed">{selected.directions}</p>
                  </div>
                )}
                <button onClick={() => {
                  setMode('directions')
                  setToText(selected.name + ', MOUAU Umudike')
                  setToId('')
                }} className="btn-primary w-full flex items-center justify-center gap-1.5">
                  <Navigation2 className="w-3.5 h-3.5"/> Get Directions Here
                </button>
              </div>
            )}

            {/* Directions: Route summary + steps */}
            {mode === 'directions' && dirResult && leg && (
              <div className="absolute bottom-0 left-0 right-0 z-10">
                <div className="bg-white rounded-t-2xl shadow-2xl border-t border-[#e8e8e8] max-h-[55vh] flex flex-col">
                  {/* Summary bar */}
                  <button onClick={() => setShowSteps(!showSteps)}
                    className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1a6b3a] rounded-full flex items-center justify-center">
                        <Navigation2 className="w-4 h-4 text-white"/>
                      </div>
                      <div>
                        <p className="font-black text-[#0a0a0a] text-sm">Route Found</p>
                        <div className="flex items-center gap-2 text-[11px] text-[#6b6b6b]">
                          {totalDist && <span className="font-semibold">{totalDist}</span>}
                          {totalDist && totalDur && <span>·</span>}
                          {totalDur && <span className="font-semibold text-[#1a6b3a]">{totalDur}</span>}
                        </div>
                      </div>
                    </div>
                    {showSteps ? <ChevronDown className="w-4 h-4 text-[#aaa]"/> : <ChevronUp className="w-4 h-4 text-[#aaa]"/>}
                  </button>

                  {/* Route: From → To */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#f9f9f7] border-b border-[#f0f0f0] flex-shrink-0">
                    <p className="text-[11px] text-[#6b6b6b] truncate flex-1">{fromText.split(',')[0]}</p>
                    <ArrowRight className="w-3.5 h-3.5 text-[#aaa] flex-shrink-0"/>
                    <p className="text-[11px] font-semibold text-[#0a0a0a] truncate flex-1 text-right">{toText.split(',')[0]}</p>
                  </div>

                  {/* Steps */}
                  {showSteps && steps.length > 0 && (
                    <div className="overflow-y-auto flex-1">
                      {steps.map((step, i) => {
                        const instruction = step.html_instructions ? stripHtml(step.html_instructions) : (step.instructions || '')
                        return (
                          <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-[#f9f9f7] last:border-0">
                            <div className="w-6 h-6 bg-[#f9f9f7] border border-[#e8e8e8] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[#1a6b3a]">
                              {maneuverIcon(step.maneuver)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[#0a0a0a] leading-relaxed">{instruction}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {step.distance?.text && <span className="text-[10px] text-[#aaa]">{step.distance.text}</span>}
                                {step.duration?.text && <span className="text-[10px] text-[#aaa]">· {step.duration.text}</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div className="flex items-center gap-2 px-4 py-3 bg-[#1a6b3a]/5">
                        <div className="w-3 h-3 rounded-full bg-[#dc2626]"/>
                        <p className="text-xs font-semibold text-[#0a0a0a]">{toText.split(',')[0]}</p>
                        <span className="text-[10px] text-[#1a6b3a] ml-auto font-semibold">Arrived</span>
                      </div>
                      <div className="px-4 py-2 flex items-center justify-end gap-1 border-t border-[#f0f0f0]">
                        <span className="text-[9px] text-[#aaa]">Directions by</span>
                        <span className="text-[9px] font-semibold text-[#4285f4]">Google Maps</span>
                        <span className="text-[9px] text-[#aaa]">via SerpAPI</span>
                      </div>
                    </div>
                  )}

                  {showSteps && steps.length === 0 && dirResult && (
                    <div className="p-4 text-center">
                      <p className="text-xs text-[#aaa]">Directions returned but no detailed steps available.</p>
                      <p className="text-[10px] text-[#aaa] mt-1">Follow the route on the map above.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
