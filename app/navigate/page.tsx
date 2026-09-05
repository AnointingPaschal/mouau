'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import CampusMap from '@/components/CampusMap'
import { getCampusLocations } from '@/lib/db'
import {
  Search, X, MapPin, Clock, Navigation2, ArrowRight,
  Loader2, LocateFixed, ChevronDown, ChevronUp,
  CornerUpRight, CornerDownRight, MoveRight,
  AlertCircle, Map, Compass, ExternalLink
} from 'lucide-react'

type Loc = {
  id: string; name: string; description: string
  lat: number; lng: number; category: string; hours: string; directions: string
}
type Prediction = {
  description: string; place_id: string
  structured_formatting?: { main_text: string; secondary_text: string }
}
type Step = {
  html_instructions?: string; instructions?: string
  distance?: { text: string }; duration?: { text: string }
  maneuver?: string
}

const COLORS: Record<string, string> = {
  academic: '#1a6b3a', admin: '#0a0a0a', hostel: '#6b6b6b',
  social: '#d97706', health: '#dc2626', worship: '#7c3aed', sport: '#2563eb'
}
const CATS = ['all', 'academic', 'admin', 'hostel', 'social', 'health', 'sport']

// Default map — MOUAU campus satellite view
const DEFAULT_SRC = 'https://maps.google.com/maps?q=Michael+Okpara+University+of+Agriculture+Umudike&output=embed&t=&z=16'

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function ManeuverIcon({ m }: { m?: string }) {
  if (!m) return <MoveRight className="w-3.5 h-3.5" />
  if (m.includes('turn-left') || m.includes('left')) return <CornerDownRight className="w-3.5 h-3.5 scale-x-[-1]" />
  if (m.includes('turn-right') || m.includes('right')) return <CornerDownRight className="w-3.5 h-3.5" />
  if (m.includes('uturn')) return <span className="text-base leading-none">↩</span>
  if (m.includes('roundabout')) return <span className="text-sm leading-none">↻</span>
  if (m.includes('merge') || m.includes('ramp')) return <CornerUpRight className="w-3.5 h-3.5" />
  return <MoveRight className="w-3.5 h-3.5" />
}

export default function NavigatePage() {
  const [mode, setMode] = useState<'explore' | 'directions'>('explore')
  const [locations, setLocations] = useState<Loc[]>([])
  const [selected, setSelected] = useState<Loc | null>(null)
  const [catFilter, setCatFilter] = useState('all')
  const [mapSrc, setMapSrc] = useState(DEFAULT_SRC)
  const [mapKey, setMapKey] = useState(0)

  // Explore search
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Prediction[]>([])
  const [loadingSugg, setLoadingSugg] = useState(false)
  const suggTimer = useRef<any>(null)

  // Directions
  const [fromText, setFromText] = useState('')
  const [toText, setToText] = useState('')
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [fromSugg, setFromSugg] = useState<Prediction[]>([])
  const [toSugg, setToSugg] = useState<Prediction[]>([])
  const [loadingDir, setLoadingDir] = useState(false)
  const [dirError, setDirError] = useState('')
  const [dirResult, setDirResult] = useState<any>(null)
  const [showSteps, setShowSteps] = useState(true)
  const [gettingLoc, setGettingLoc] = useState(false)
  const fromTimer = useRef<any>(null)
  const toTimer = useRef<any>(null)

  useEffect(() => {
    getCampusLocations().then(({ data }) => { if (data) setLocations(data as Loc[]) })
  }, [])

  const updateMap = (src: string) => {
    setMapSrc(src)
    setMapKey(k => k + 1)
  }

  // ── Autocomplete helpers ─────────────────────────────────────
  const fetchSugg = async (val: string) => {
    if (val.length < 2) return []
    try {
      const r = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(val)}`)
      const d = await r.json()
      return d.predictions || []
    } catch { return [] }
  }

  const handleQueryChange = (val: string) => {
    setQuery(val)
    clearTimeout(suggTimer.current)
    if (val.length < 2) { setSuggestions([]); return }
    setLoadingSugg(true)
    suggTimer.current = setTimeout(async () => {
      setSuggestions(await fetchSugg(val))
      setLoadingSugg(false)
    }, 350)
  }

  const handleFromChange = (val: string) => {
    setFromText(val); setFromId(''); setDirResult(null)
    clearTimeout(fromTimer.current)
    fromTimer.current = setTimeout(async () => setFromSugg(await fetchSugg(val)), 350)
  }

  const handleToChange = (val: string) => {
    setToText(val); setToId(''); setDirResult(null)
    clearTimeout(toTimer.current)
    toTimer.current = setTimeout(async () => setToSugg(await fetchSugg(val)), 350)
  }

  // ── Select explore suggestion ────────────────────────────────
  const selectSuggestion = (s: Prediction) => {
    setQuery(s.description)
    setSuggestions([])
    updateMap(`https://maps.google.com/maps?q=${encodeURIComponent(s.description)}&output=embed&z=17`)
  }

  // ── Select campus location from list ────────────────────────
  const selectLocation = (loc: Loc) => {
    setSelected(loc === selected ? null : loc)
    updateMap(
      `https://maps.google.com/maps?q=${encodeURIComponent(loc.name + ' MOUAU Umudike')}&output=embed&ll=${loc.lat},${loc.lng}&z=18&t=k`
    )
  }

  // ── "Get Directions Here" from location card ─────────────────
  const directTo = (loc: Loc) => {
    setMode('directions')
    setToText(loc.name + ', MOUAU Umudike')
    setToId('')
    setToSugg([])
    setDirResult(null)
  }

  // ── Use My Location ──────────────────────────────────────────
  const useMyLocation = () => {
    if (!navigator.geolocation) return
    setGettingLoc(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setFromText(`${lat.toFixed(6)},${lng.toFixed(6)}`)
        setFromId('')
        setFromSugg([])
        setGettingLoc(false)
      },
      () => {
        setFromText('MOUAU Main Gate, Umudike, Nigeria')
        setGettingLoc(false)
      },
      { timeout: 8000 }
    )
  }

  // ── Get Directions ───────────────────────────────────────────
  const getDirections = async () => {
    if (!fromText.trim() || !toText.trim()) {
      setDirError('Please enter both a starting point and a destination.')
      return
    }
    setDirError('')
    setLoadingDir(true)
    setDirResult(null)

    // Update Google Maps iframe to show the route
    const gmapDir = `https://maps.google.com/maps?saddr=${encodeURIComponent(fromText)}&daddr=${encodeURIComponent(toText)}&output=embed&dirflg=d`
    updateMap(gmapDir)

    // Also fetch text directions from SerpAPI
    try {
      let url = `/api/maps/directions?origin=${encodeURIComponent(fromText)}&destination=${encodeURIComponent(toText)}`
      if (fromId) url += `&origin_place_id=${fromId}`
      if (toId) url += `&destination_place_id=${toId}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.error && !data.directions && !data.routes) {
        setDirError('Directions not found. The route may be unavailable — check your locations.')
      } else {
        setDirResult(data)
        setShowSteps(true)
      }
    } catch {
      setDirError('Failed to fetch turn-by-turn directions.')
    }
    setLoadingDir(false)
  }

  // ── Open in Google Maps app ──────────────────────────────────
  const openInGoogleMaps = () => {
    if (mode === 'directions' && fromText && toText) {
      window.open(`https://www.google.com/maps/dir/${encodeURIComponent(fromText)}/${encodeURIComponent(toText)}`, '_blank')
    } else if (selected) {
      window.open(`https://www.google.com/maps/search/${encodeURIComponent(selected.name + ' MOUAU Umudike')}`, '_blank')
    } else {
      window.open('https://www.google.com/maps/place/Michael+Okpara+University+of+Agriculture/@5.48,7.546,16z', '_blank')
    }
  }

  const filtered = locations.filter(l => {
    if (catFilter !== 'all' && l.category !== catFilter) return false
    if (!query) return true
    const q = query.toLowerCase()
    return l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.category.toLowerCase().includes(q)
  })

  const leg = dirResult?.directions?.[0]?.legs?.[0] || dirResult?.routes?.[0]?.legs?.[0]
  const steps: Step[] = leg?.steps || dirResult?.directions?.[0]?.steps || []
  const totalDist = leg?.distance?.text || ''
  const totalDur = leg?.duration?.text || ''

  return (
    <AppShell>
      <TopBar title="Campus Navigation" subtitle="Powered by Google Maps"/>

      <div className="flex flex-col h-[calc(100vh-104px)] lg:h-[calc(100vh-60px)]">

        {/* Mode toggle */}
        <div className="flex bg-white border-b border-[#e8e8e8]">
          {(['explore', 'directions'] as const).map(m => (
            <button key={m} onClick={() => {
              setMode(m)
              if (m === 'explore') { updateMap(DEFAULT_SRC); setDirResult(null) }
            }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${mode === m ? 'border-[#1a6b3a] text-[#1a6b3a]' : 'border-transparent text-[#aaa] hover:text-[#6b6b6b]'}`}>
              {m === 'explore' ? <><Map className="w-3.5 h-3.5"/>Explore Campus</> : <><Compass className="w-3.5 h-3.5"/>Get Directions</>}
            </button>
          ))}
        </div>

        {/* Controls panel */}
        <div className="bg-white border-b border-[#e8e8e8] px-3 py-2.5 space-y-2 z-20 relative">

          {mode === 'explore' ? (
            <>
              {/* Search with Google autocomplete */}
              <div className="relative">
                <div className="flex items-center border border-[#e8e8e8] rounded-xl px-3 py-2 bg-[#f9f9f7] gap-2 focus-within:border-[#1a6b3a] transition-colors">
                  <Search className="w-3.5 h-3.5 text-[#aaa] flex-shrink-0"/>
                  <input value={query} onChange={e => handleQueryChange(e.target.value)}
                    placeholder="Search any location..."
                    className="flex-1 text-xs outline-none bg-transparent text-[#0a0a0a] placeholder-[#aaa]"/>
                  {loadingSugg && <Loader2 className="w-3.5 h-3.5 text-[#1a6b3a] animate-spin flex-shrink-0"/>}
                  {query && <button onClick={() => { setQuery(''); setSuggestions([]); updateMap(DEFAULT_SRC) }}><X className="w-3.5 h-3.5 text-[#aaa]"/></button>}
                </div>
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e8e8e8] rounded-xl shadow-xl overflow-hidden">
                    {suggestions.slice(0, 5).map((s, i) => (
                      <button key={i} onClick={() => selectSuggestion(s)}
                        className="w-full flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-[#f9f9f7] text-left border-b border-[#f5f5f5] last:border-0">
                        <MapPin className="w-3 h-3 text-[#4285f4] mt-0.5 flex-shrink-0"/>
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
                    <div className="px-3.5 py-1.5 flex items-center justify-end gap-1 bg-[#f9f9f7]">
                      <span className="text-[9px] text-[#aaa]">powered by</span>
                      <span className="text-[9px] font-bold text-[#4285f4]">Google</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Category filters */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {CATS.map(c => (
                  <button key={c} onClick={() => setCatFilter(c)}
                    className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize transition-all ${catFilter === c ? 'bg-[#0a0a0a] text-white' : 'bg-[#f9f9f7] text-[#6b6b6b] hover:bg-[#e8e8e8]'}`}>
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
                <div className="flex items-center border border-[#e8e8e8] rounded-xl bg-white focus-within:border-[#1a6b3a] transition-colors overflow-visible">
                  <div className="px-3 flex-shrink-0"><div className="w-2.5 h-2.5 rounded-full bg-[#1a6b3a]"/></div>
                  <input value={fromText} onChange={e => handleFromChange(e.target.value)}
                    placeholder="From: starting point..."
                    className="flex-1 py-2.5 text-xs outline-none text-[#0a0a0a] placeholder-[#aaa]"/>
                  <button onClick={useMyLocation} disabled={gettingLoc} title="Use my location"
                    className="px-3 text-[#1a6b3a] hover:text-[#145530] flex-shrink-0">
                    {gettingLoc ? <Loader2 className="w-4 h-4 animate-spin"/> : <LocateFixed className="w-4 h-4"/>}
                  </button>
                </div>
                {fromSugg.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-[#e8e8e8] rounded-xl shadow-xl overflow-hidden">
                    {fromSugg.slice(0, 4).map((s, i) => (
                      <button key={i} onClick={() => { setFromText(s.description); setFromId(s.place_id); setFromSugg([]) }}
                        className="w-full flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-[#f9f9f7] text-left border-b border-[#f5f5f5] last:border-0">
                        <MapPin className="w-3 h-3 text-[#4285f4] mt-0.5 flex-shrink-0"/>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#0a0a0a] truncate">{s.structured_formatting?.main_text || s.description.split(',')[0]}</p>
                          <p className="text-[10px] text-[#aaa] truncate">{s.structured_formatting?.secondary_text || ''}</p>
                        </div>
                      </button>
                    ))}
                    <div className="px-3.5 py-1 flex items-center justify-end gap-1 bg-[#f9f9f7]">
                      <span className="text-[9px] text-[#aaa]">powered by</span><span className="text-[9px] font-bold text-[#4285f4]">Google</span>
                    </div>
                  </div>
                )}
              </div>

              {/* To */}
              <div className="relative">
                <div className="flex items-center border border-[#e8e8e8] rounded-xl bg-white focus-within:border-[#dc2626] transition-colors">
                  <div className="px-3 flex-shrink-0"><div className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"/></div>
                  <input value={toText} onChange={e => handleToChange(e.target.value)}
                    placeholder="To: destination on campus..."
                    className="flex-1 py-2.5 text-xs outline-none text-[#0a0a0a] placeholder-[#aaa]"/>
                  {toText && <button onClick={() => { setToText(''); setToId(''); setToSugg([]); setDirResult(null) }} className="px-3"><X className="w-3.5 h-3.5 text-[#aaa]"/></button>}
                </div>
                {toSugg.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-[#e8e8e8] rounded-xl shadow-xl overflow-hidden">
                    {/* Campus DB locations first */}
                    {locations.filter(l => l.name.toLowerCase().includes(toText.toLowerCase())).slice(0, 2).map(l => (
                      <button key={l.id} onClick={() => { setToText(l.name + ', MOUAU Umudike'); setToId(''); setToSugg([]) }}
                        className="w-full flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-[#f0f9f4] text-left border-b border-[#f5f5f5]">
                        <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" style={{ background: COLORS[l.category] || '#1a6b3a' }}/>
                        <div>
                          <p className="text-xs font-semibold text-[#0a0a0a]">{l.name}</p>
                          <p className="text-[10px] text-[#1a6b3a] font-medium">On campus · {l.category}</p>
                        </div>
                      </button>
                    ))}
                    {toSugg.slice(0, 3).map((s, i) => (
                      <button key={i} onClick={() => { setToText(s.description); setToId(s.place_id); setToSugg([]) }}
                        className="w-full flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-[#f9f9f7] text-left border-b border-[#f5f5f5] last:border-0">
                        <MapPin className="w-3 h-3 text-[#4285f4] mt-0.5 flex-shrink-0"/>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#0a0a0a] truncate">{s.structured_formatting?.main_text || s.description.split(',')[0]}</p>
                          <p className="text-[10px] text-[#aaa] truncate">{s.structured_formatting?.secondary_text || ''}</p>
                        </div>
                      </button>
                    ))}
                    <div className="px-3.5 py-1 flex items-center justify-end gap-1 bg-[#f9f9f7]">
                      <span className="text-[9px] text-[#aaa]">powered by</span><span className="text-[9px] font-bold text-[#4285f4]">Google</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick campus destinations */}
              {!toText && (
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {locations.slice(0, 7).map(l => (
                    <button key={l.id} onClick={() => { setToText(l.name + ', MOUAU Umudike'); setToSugg([]) }}
                      className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f9f9f7] border border-[#e8e8e8] rounded-full text-[10px] font-semibold text-[#0a0a0a] hover:border-[#1a6b3a]/40 whitespace-nowrap transition-all">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: COLORS[l.category] || '#1a6b3a' }}/>
                      {l.name.replace('University ', '').replace('College of ', '')}
                    </button>
                  ))}
                </div>
              )}

              {dirError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-red-600 leading-relaxed">{dirError}</p>
                </div>
              )}

              <button onClick={getDirections} disabled={loadingDir || !fromText.trim() || !toText.trim()}
                className="btn-primary w-full flex items-center justify-center gap-1.5">
                {loadingDir
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Getting directions...</>
                  : <><Navigation2 className="w-3.5 h-3.5"/>Get Directions</>}
              </button>
            </div>
          )}
        </div>

        {/* Main content: map + sidebar */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Desktop sidebar — location list */}
          {mode === 'explore' && (
            <div className="hidden lg:flex flex-col w-72 border-r border-[#e8e8e8] bg-white overflow-y-auto flex-shrink-0">
              <div className="p-2.5 space-y-1">
                <p className="text-[9px] font-semibold text-[#aaa] uppercase tracking-widest px-2 py-1">{filtered.length} LOCATIONS</p>
                {filtered.map(loc => (
                  <button key={loc.id} onClick={() => selectLocation(loc)}
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

          {/* Google Maps iframe */}
          <div className="flex-1 relative">
            <CampusMap src={mapSrc} key={mapKey}/>

            {/* Open in Google Maps button */}
            <button onClick={openInGoogleMaps}
              className="absolute top-2 right-2 z-10 bg-white border border-[#e8e8e8] rounded-full px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-[#0a0a0a] shadow-sm hover:shadow-md transition-all">
              <ExternalLink className="w-3 h-3 text-[#4285f4]"/>
              Open in Maps
            </button>

            {/* Mobile: selected location card (explore mode) */}
            {mode === 'explore' && selected && (
              <div className="absolute bottom-4 left-3 right-3 z-10 animate-slide-up">
                <div className="bg-white rounded-2xl shadow-xl border border-[#e8e8e8] p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[selected.category] || '#1a6b3a' }}/>
                      <h3 className="font-black text-[#0a0a0a] text-sm">{selected.name}</h3>
                    </div>
                    <button onClick={() => { setSelected(null); updateMap(DEFAULT_SRC) }}
                      className="p-1 rounded-full bg-[#f9f9f7] flex-shrink-0"><X className="w-3.5 h-3.5 text-[#aaa]"/></button>
                  </div>
                  <p className="text-[#6b6b6b] text-xs leading-relaxed mb-2">{selected.description}</p>
                  {selected.hours && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Clock className="w-3 h-3 text-[#aaa] flex-shrink-0"/>
                      <p className="text-xs text-[#6b6b6b]">{selected.hours}</p>
                    </div>
                  )}
                  {selected.directions && (
                    <div className="flex items-start gap-1.5 p-2.5 bg-[#f9f9f7] rounded-xl mb-3">
                      <Navigation2 className="w-3 h-3 text-[#1a6b3a] flex-shrink-0 mt-0.5"/>
                      <p className="text-xs text-[#6b6b6b] leading-relaxed">{selected.directions}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => directTo(selected)} className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-xs">
                      <Navigation2 className="w-3.5 h-3.5"/> Directions
                    </button>
                    <button onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(selected.name + ' MOUAU')}`, '_blank')}
                      className="btn-outline flex items-center justify-center gap-1 text-xs px-3">
                      <ExternalLink className="w-3 h-3"/> Maps
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Directions result panel */}
            {mode === 'directions' && dirResult && (
              <div className="absolute bottom-0 left-0 right-0 z-10">
                <div className="bg-white rounded-t-2xl shadow-2xl border-t border-[#e8e8e8] flex flex-col max-h-[55vh]">

                  {/* Summary */}
                  <button onClick={() => setShowSteps(!showSteps)}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#f0f0f0] flex-shrink-0 w-full text-left">
                    <div className="w-9 h-9 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0">
                      <Navigation2 className="w-4 h-4 text-white"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[#0a0a0a] text-sm">Route Found</p>
                      <div className="flex items-center gap-2">
                        {totalDist && <span className="text-xs font-bold text-[#0a0a0a]">{totalDist}</span>}
                        {totalDist && totalDur && <span className="text-[#aaa] text-xs">·</span>}
                        {totalDur && <span className="text-xs font-bold text-[#1a6b3a]">{totalDur}</span>}
                        {!totalDist && !totalDur && <span className="text-xs text-[#aaa]">See route on map</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); openInGoogleMaps() }}
                        className="text-[10px] text-[#4285f4] font-semibold flex items-center gap-0.5">
                        <ExternalLink className="w-3 h-3"/> Open
                      </button>
                      {showSteps ? <ChevronDown className="w-4 h-4 text-[#aaa]"/> : <ChevronUp className="w-4 h-4 text-[#aaa]"/>}
                    </div>
                  </button>

                  {/* From → To bar */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#f9f9f7] border-b border-[#f0f0f0] flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#1a6b3a] flex-shrink-0"/>
                    <p className="text-[11px] text-[#6b6b6b] truncate flex-1">{fromText.split(',')[0]}</p>
                    <ArrowRight className="w-3 h-3 text-[#aaa] flex-shrink-0"/>
                    <p className="text-[11px] font-semibold text-[#0a0a0a] truncate flex-1 text-right">{toText.split(',')[0]}</p>
                    <div className="w-2 h-2 rounded-full bg-[#dc2626] flex-shrink-0"/>
                  </div>

                  {/* Steps */}
                  {showSteps && (
                    <div className="overflow-y-auto flex-1">
                      {steps.length > 0 ? steps.map((step, i) => {
                        const text = step.html_instructions ? stripHtml(step.html_instructions) : (step.instructions || '')
                        return (
                          <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-[#f9f9f7] last:border-0">
                            <div className="w-7 h-7 bg-[#f9f9f7] border border-[#e8e8e8] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[#1a6b3a]">
                              <ManeuverIcon m={step.maneuver}/>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[#0a0a0a] leading-relaxed">{text}</p>
                              <div className="flex gap-2 mt-0.5">
                                {step.distance?.text && <span className="text-[10px] text-[#aaa]">{step.distance.text}</span>}
                                {step.duration?.text && <span className="text-[10px] text-[#aaa]">· {step.duration.text}</span>}
                              </div>
                            </div>
                          </div>
                        )
                      }) : (
                        <div className="px-4 py-4 text-center">
                          <p className="text-xs text-[#aaa]">Route displayed on map. Open in Google Maps for full navigation.</p>
                          <button onClick={openInGoogleMaps} className="btn-primary mt-3 mx-auto flex items-center gap-1.5 text-xs">
                            <ExternalLink className="w-3 h-3"/> Open Google Maps
                          </button>
                        </div>
                      )}
                      {steps.length > 0 && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-[#1a6b3a]/5">
                          <div className="w-3 h-3 rounded-full bg-[#dc2626] flex-shrink-0"/>
                          <p className="text-xs font-semibold text-[#0a0a0a] flex-1">{toText.split(',')[0]}</p>
                          <span className="text-[10px] text-[#1a6b3a] font-semibold">You have arrived</span>
                        </div>
                      )}
                      <div className="px-4 py-2 flex items-center justify-end gap-1 border-t border-[#f0f0f0]">
                        <span className="text-[9px] text-[#aaa]">Directions by</span>
                        <span className="text-[9px] font-bold text-[#4285f4]">Google Maps</span>
                        <span className="text-[9px] text-[#aaa]">via SerpAPI</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile location list (explore, no selected) */}
            {mode === 'explore' && !selected && (
              <div className="lg:hidden absolute bottom-4 left-0 right-0 z-10 px-3">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {filtered.map(loc => (
                    <button key={loc.id} onClick={() => selectLocation(loc)}
                      className="flex-shrink-0 bg-white border border-[#e8e8e8] rounded-xl px-3 py-2 shadow-sm flex items-center gap-2 hover:border-[#1a6b3a]/40 transition-all">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[loc.category] || '#1a6b3a' }}/>
                      <p className="text-xs font-semibold text-[#0a0a0a] whitespace-nowrap max-w-[100px] truncate">{loc.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
