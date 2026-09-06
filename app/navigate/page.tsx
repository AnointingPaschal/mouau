'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import CampusMap from '@/components/CampusMap'
import { getCampusLocations } from '@/lib/db'
import {
  Search, X, MapPin, Clock, Navigation2, ArrowRight,
  Loader2, LocateFixed, ChevronDown, ChevronUp,
  CornerUpRight, CornerDownRight, MoveRight,
  AlertCircle, Map, Compass, ExternalLink,
  MapPinOff, ShieldAlert, RefreshCw
} from 'lucide-react'

type Loc = { id: string; name: string; description: string; lat: number; lng: number; category: string; hours: string; directions: string }
type Prediction = { description: string; place_id: string; structured_formatting?: { main_text: string; secondary_text: string } }
type Step = { html_instructions?: string; instructions?: string; distance?: { text: string }; duration?: { text: string }; maneuver?: string }

const COLORS: Record<string, string> = {
  academic: '#1a6b3a', admin: '#0a0a0a', hostel: '#6b6b6b',
  social: '#d97706', health: '#dc2626', worship: '#7c3aed', sport: '#2563eb'
}
const CATS = ['all', 'academic', 'admin', 'hostel', 'social', 'health', 'sport']
const DEFAULT_SRC = 'https://maps.google.com/maps?q=Michael+Okpara+University+of+Agriculture+Umudike&output=embed&z=16'

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
function ManeuverIcon({ m }: { m?: string }) {
  if (!m) return <MoveRight className="w-3.5 h-3.5"/>
  if (m.includes('left'))  return <CornerDownRight className="w-3.5 h-3.5 scale-x-[-1]"/>
  if (m.includes('right')) return <CornerDownRight className="w-3.5 h-3.5"/>
  if (m.includes('uturn')) return <span className="text-base leading-none">↩</span>
  if (m.includes('roundabout')) return <span className="text-sm leading-none">↻</span>
  if (m.includes('merge') || m.includes('ramp')) return <CornerUpRight className="w-3.5 h-3.5"/>
  return <MoveRight className="w-3.5 h-3.5"/>
}

function NavigateContent() {
  const searchParams = useSearchParams()
  const paramTo   = searchParams.get('to') || ''
  const autoDir   = searchParams.get('directions') === '1'

  // ── Location permission state ──────────────────────────────
  type LocState = 'checking' | 'requesting' | 'granted' | 'denied' | 'skipped'
  const [locState, setLocState]   = useState<LocState>('checking')
  const [userLat, setUserLat]     = useState<number | null>(null)
  const [userLng, setUserLng]     = useState<number | null>(null)

  // ── Map state ──────────────────────────────────────────────
  const [mode, setMode]           = useState<'explore' | 'directions'>('explore')
  const [locations, setLocations] = useState<Loc[]>([])
  const [selected, setSelected]   = useState<Loc | null>(null)
  const [catFilter, setCatFilter] = useState('all')
  const [mapSrc, setMapSrc]       = useState(DEFAULT_SRC)
  const [mapKey, setMapKey]       = useState(0)

  // ── Explore search ─────────────────────────────────────────
  const [query, setQuery]         = useState('')
  const [suggestions, setSugg]    = useState<Prediction[]>([])
  const [loadingSugg, setLoadingSugg] = useState(false)
  const suggTimer = useRef<any>(null)

  // ── Directions state ───────────────────────────────────────
  const [fromText, setFromText]   = useState('')
  const [toText, setToText]       = useState('')
  const [fromId, setFromId]       = useState('')
  const [toId, setToId]           = useState('')
  const [fromSugg, setFromSugg]   = useState<Prediction[]>([])
  const [toSugg, setToSugg]       = useState<Prediction[]>([])
  const [loadingDir, setLoadingDir] = useState(false)
  const [dirError, setDirError]   = useState('')
  const [dirResult, setDirResult] = useState<any>(null)
  const [showSteps, setShowSteps] = useState(true)
  const fromTimer = useRef<any>(null)
  const toTimer   = useRef<any>(null)

  // ── 1. REQUEST LOCATION ON MOUNT ──────────────────────────
  useEffect(() => {
    getCampusLocations().then(({ data }) => { if (data) setLocations(data as Loc[]) })

    // Read URL params from Places page
    if (paramTo) {
      setToText(paramTo); setToId('')
      if (autoDir) setMode('directions')
    }

    if (!navigator.geolocation) { setLocState('denied'); return }

    const doGetLocation = () => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude: lat, longitude: lng } = pos.coords
          setUserLat(lat); setUserLng(lng)
          setLocState('granted')
          setFromText(`${lat.toFixed(6)},${lng.toFixed(6)}`)
          updateMap(`https://maps.google.com/maps?q=${lat},${lng}&output=embed&z=17&t=k`)
        },
        () => setLocState('denied'),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
      )
    }

    // Check if permission already granted — skip overlay if so
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then(result => {
          if (result.state === 'granted') {
            setLocState('granted') // Hide overlay immediately
            doGetLocation()
          } else if (result.state === 'denied') {
            setLocState('denied')
          } else {
            setLocState('requesting') // Show overlay
            doGetLocation()
          }
        })
        .catch(() => { setLocState('requesting'); doGetLocation() })
    } else {
      setLocState('requesting')
      doGetLocation()
    }
  }, [])

  const updateMap = (src: string) => { setMapSrc(src); setMapKey(k => k + 1) }

  // ── Autocomplete helpers ───────────────────────────────────
  const fetchSugg = async (val: string): Promise<Prediction[]> => {
    if (val.length < 2) return []
    try {
      const r = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(val)}`)
      return (await r.json()).predictions || []
    } catch { return [] }
  }

  const onQueryChange = (val: string) => {
    setQuery(val)
    clearTimeout(suggTimer.current)
    if (val.length < 2) { setSugg([]); return }
    setLoadingSugg(true)
    suggTimer.current = setTimeout(async () => { setSugg(await fetchSugg(val)); setLoadingSugg(false) }, 350)
  }
  const onFromChange = (val: string) => {
    setFromText(val); setFromId(''); setDirResult(null)
    clearTimeout(fromTimer.current)
    fromTimer.current = setTimeout(async () => setFromSugg(await fetchSugg(val)), 350)
  }
  const onToChange = (val: string) => {
    setToText(val); setToId(''); setDirResult(null)
    clearTimeout(toTimer.current)
    toTimer.current = setTimeout(async () => setToSugg(await fetchSugg(val)), 350)
  }

  const pickSuggestion = (s: Prediction) => {
    setQuery(s.description); setSugg([])
    updateMap(`https://maps.google.com/maps?q=${encodeURIComponent(s.description)}&output=embed&z=17`)
  }
  const pickLocation = (loc: Loc) => {
    setSelected(loc === selected ? null : loc)
    updateMap(`https://maps.google.com/maps?q=${encodeURIComponent(loc.name + ' MOUAU Umudike')}&output=embed&ll=${loc.lat},${loc.lng}&z=18&t=k`)
  }
  const directTo = (loc: Loc) => {
    setMode('directions'); setToText(loc.name + ', MOUAU Umudike'); setToId(''); setToSugg([]); setDirResult(null)
  }

  // ── 2. GET DIRECTIONS → AUTO-OPEN GOOGLE MAPS APP ─────────
  const getDirections = async () => {
    if (!fromText.trim() || !toText.trim()) {
      setDirError('Please enter both a starting point and destination.'); return
    }
    setDirError(''); setLoadingDir(true); setDirResult(null)

    // Build the Google Maps directions URL (opens app on mobile)
    const origin = userLat && fromText.includes(String(userLat.toFixed(4)))
      ? `${userLat},${userLng}`
      : fromText
    const gmapsAppUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(toText)}&travelmode=driving`

    // Show route in iframe simultaneously
    updateMap(`https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(toText)}&output=embed&dirflg=d`)

    // Auto-open Google Maps app
    window.open(gmapsAppUrl, '_blank')

    // Also fetch SerpAPI text steps for reference panel
    try {
      let url = `/api/maps/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(toText)}`
      if (fromId) url += `&origin_place_id=${fromId}`
      if (toId)   url += `&destination_place_id=${toId}`
      const res  = await fetch(url)
      const data = await res.json()
      if (data.directions || data.routes) { setDirResult(data); setShowSteps(true) }
      else setDirResult({ _noSteps: true })
    } catch { setDirResult({ _noSteps: true }) }
    setLoadingDir(false)
  }

  const retrylocation = () => {
    setLocState('requesting')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserLat(lat); setUserLng(lng); setLocState('granted')
        setFromText(`${lat.toFixed(6)},${lng.toFixed(6)}`)
        updateMap(`https://maps.google.com/maps?q=${lat},${lng}&output=embed&z=17&t=k`)
      },
      () => setLocState('denied'),
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }

  const skipLocation = () => { setLocState('skipped'); updateMap(DEFAULT_SRC) }

  const openInGoogleMapsApp = () => {
    if (mode === 'directions' && fromText && toText) {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(fromText)}&destination=${encodeURIComponent(toText)}&travelmode=driving`, '_blank')
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
    return l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
  })

  const leg   = dirResult?.directions?.[0]?.legs?.[0] || dirResult?.routes?.[0]?.legs?.[0]
  const steps: Step[] = leg?.steps || []
  const totalDist = leg?.distance?.text || ''
  const totalDur  = leg?.duration?.text  || ''

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <AppShell>
      <TopBar title="Campus Navigation" subtitle="Powered by Google Maps"/>

      <div className="flex flex-col h-[calc(100vh-104px)] lg:h-[calc(100vh-60px)]">

        {/* Mode tabs */}
        <div className="flex bg-white border-b border-[#e8e8e8]">
          {(['explore', 'directions'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); if (m === 'explore') { updateMap(DEFAULT_SRC); setDirResult(null) } }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${mode === m ? 'border-[#1a6b3a] text-[#1a6b3a]' : 'border-transparent text-[#aaa] hover:text-[#6b6b6b]'}`}>
              {m === 'explore' ? <><Map className="w-3.5 h-3.5"/>Explore Campus</> : <><Compass className="w-3.5 h-3.5"/>Get Directions</>}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white border-b border-[#e8e8e8] px-3 py-2.5 space-y-2 z-20 relative">
          {mode === 'explore' ? (
            <>
              <div className="relative">
                <div className="flex items-center border border-[#e8e8e8] rounded-xl px-3 py-2 bg-[#f9f9f7] gap-2 focus-within:border-[#1a6b3a] transition-colors">
                  <Search className="w-3.5 h-3.5 text-[#aaa] flex-shrink-0"/>
                  <input value={query} onChange={e => onQueryChange(e.target.value)} placeholder="Search any location..."
                    className="flex-1 text-xs outline-none bg-transparent text-[#0a0a0a] placeholder-[#aaa]"/>
                  {loadingSugg && <Loader2 className="w-3.5 h-3.5 text-[#1a6b3a] animate-spin flex-shrink-0"/>}
                  {query && <button onClick={() => { setQuery(''); setSugg([]); updateMap(DEFAULT_SRC) }}><X className="w-3.5 h-3.5 text-[#aaa]"/></button>}
                </div>
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e8e8e8] rounded-xl shadow-xl overflow-hidden z-30">
                    {suggestions.slice(0, 5).map((s, i) => (
                      <button key={i} onClick={() => pickSuggestion(s)}
                        className="w-full flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-[#f9f9f7] text-left border-b border-[#f5f5f5] last:border-0">
                        <MapPin className="w-3 h-3 text-[#4285f4] mt-0.5 flex-shrink-0"/>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#0a0a0a] truncate">{s.structured_formatting?.main_text || s.description.split(',')[0]}</p>
                          <p className="text-[10px] text-[#aaa] truncate">{s.structured_formatting?.secondary_text || s.description}</p>
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
            <div className="space-y-2">
              {/* From field */}
              <div className="relative">
                <div className="flex items-center border border-[#e8e8e8] rounded-xl bg-white focus-within:border-[#1a6b3a] transition-colors">
                  <div className="px-3 flex-shrink-0"><div className="w-2.5 h-2.5 rounded-full bg-[#1a6b3a]"/></div>
                  <input value={fromText} onChange={e => onFromChange(e.target.value)} placeholder="From: your location or address..."
                    className="flex-1 py-2.5 text-xs outline-none text-[#0a0a0a] placeholder-[#aaa]"/>
                  {locState === 'granted' && userLat && (
                    <button onClick={() => { setFromText(`${userLat!.toFixed(6)},${userLng!.toFixed(6)}`); setFromSugg([]) }}
                      title="Use my location" className="px-3 text-[#1a6b3a] hover:text-[#145530] flex-shrink-0">
                      <LocateFixed className="w-4 h-4"/>
                    </button>
                  )}
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

              {/* To field */}
              <div className="relative">
                <div className="flex items-center border border-[#e8e8e8] rounded-xl bg-white focus-within:border-[#dc2626] transition-colors">
                  <div className="px-3 flex-shrink-0"><div className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"/></div>
                  <input value={toText} onChange={e => onToChange(e.target.value)} placeholder="To: destination on campus..."
                    className="flex-1 py-2.5 text-xs outline-none text-[#0a0a0a] placeholder-[#aaa]"/>
                  {toText && <button onClick={() => { setToText(''); setToId(''); setToSugg([]); setDirResult(null) }} className="px-3"><X className="w-3.5 h-3.5 text-[#aaa]"/></button>}
                </div>
                {toSugg.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-[#e8e8e8] rounded-xl shadow-xl overflow-hidden">
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

              {/* Get Directions button — opens Google Maps app */}
              <button onClick={getDirections} disabled={loadingDir || !fromText.trim() || !toText.trim()}
                className="btn-primary w-full flex items-center justify-center gap-1.5">
                {loadingDir
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Opening Google Maps...</>
                  : <><ExternalLink className="w-3.5 h-3.5"/>Get Directions — Opens Google Maps</>}
              </button>
              <p className="text-[10px] text-center text-[#aaa]">Google Maps app will open automatically on your phone</p>
            </div>
          )}
        </div>

        {/* Map + sidebar */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Desktop location sidebar */}
          {mode === 'explore' && (
            <div className="hidden lg:flex flex-col w-72 border-r border-[#e8e8e8] bg-white overflow-y-auto flex-shrink-0">
              <div className="p-2.5 space-y-1">
                <p className="text-[9px] font-semibold text-[#aaa] uppercase tracking-widest px-2 py-1">{filtered.length} LOCATIONS</p>
                {filtered.map(loc => (
                  <button key={loc.id} onClick={() => pickLocation(loc)}
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

            {/* Open in Maps button */}
            <button onClick={openInGoogleMapsApp}
              className="absolute top-2 right-2 z-10 bg-white border border-[#e8e8e8] rounded-full px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-[#0a0a0a] shadow-md hover:shadow-lg transition-all">
              <ExternalLink className="w-3 h-3 text-[#4285f4]"/> Open in Maps
            </button>

            {/* ── LOCATION PERMISSION OVERLAY ──────────────────── */}
            {(locState === 'requesting' || locState === 'denied') && (
              <div className="absolute inset-0 z-20 flex items-center justify-center"
                style={{ backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.7)' }}>
                <div className="bg-white rounded-2xl shadow-2xl border border-[#e8e8e8] p-6 mx-4 max-w-xs w-full text-center animate-slide-up">

                  {locState === 'requesting' ? (
                    <>
                      <div className="w-16 h-16 bg-[#1a6b3a]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-[#1a6b3a]"/>
                      </div>
                      <h2 className="font-black text-[#0a0a0a] text-lg mb-2">Allow Location Access</h2>
                      <p className="text-[#6b6b6b] text-sm leading-relaxed mb-4">
                        FreshStart needs your location to show your position on campus and give precise directions.
                      </p>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-4 h-4 border-2 border-[#1a6b3a] border-t-transparent rounded-full animate-spin"/>
                        <p className="text-xs text-[#aaa] font-medium">Waiting for permission...</p>
                      </div>
                      <p className="text-[10px] text-[#aaa] mb-4 leading-relaxed">
                        A browser permission prompt should appear. Tap <strong>Allow</strong> to continue.
                      </p>
                      <button onClick={skipLocation}
                        className="w-full py-2 text-xs font-semibold text-[#aaa] hover:text-[#6b6b6b] transition-colors border border-[#e8e8e8] rounded-xl">
                        Skip — Browse without location
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPinOff className="w-8 h-8 text-red-500"/>
                      </div>
                      <h2 className="font-black text-[#0a0a0a] text-base mb-2">Location Access Denied</h2>
                      <p className="text-[#6b6b6b] text-sm leading-relaxed mb-4">
                        To enable location for precise directions, go to your browser settings and allow location for this site.
                      </p>
                      <div className="bg-[#f9f9f7] rounded-xl p-3 mb-4 text-left">
                        <p className="text-[10px] font-semibold text-[#0a0a0a] mb-1.5 flex items-center gap-1.5">
                          <ShieldAlert className="w-3 h-3 text-amber-500"/> How to enable:
                        </p>
                        <p className="text-[10px] text-[#6b6b6b] leading-relaxed">
                          Chrome: tap the lock icon in the address bar → Site settings → Location → Allow
                        </p>
                      </div>
                      <button onClick={retrylocation}
                        className="btn-primary w-full flex items-center justify-center gap-1.5 mb-2">
                        <RefreshCw className="w-3.5 h-3.5"/> Try Again
                      </button>
                      <button onClick={skipLocation}
                        className="w-full py-2 text-xs font-semibold text-[#aaa] hover:text-[#6b6b6b] border border-[#e8e8e8] rounded-xl transition-colors">
                        Continue Without Location
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Explore: selected location card */}
            {mode === 'explore' && selected && locState !== 'requesting' && (
              <div className="absolute bottom-4 left-3 right-3 z-10 animate-slide-up">
                <div className="bg-white rounded-2xl shadow-xl border border-[#e8e8e8] p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[selected.category] || '#1a6b3a' }}/>
                      <h3 className="font-black text-[#0a0a0a] text-sm">{selected.name}</h3>
                    </div>
                    <button onClick={() => { setSelected(null); updateMap(DEFAULT_SRC) }}
                      className="p-1 rounded-full bg-[#f9f9f7]"><X className="w-3.5 h-3.5 text-[#aaa]"/></button>
                  </div>
                  <p className="text-[#6b6b6b] text-xs leading-relaxed mb-2">{selected.description}</p>
                  {selected.hours && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Clock className="w-3 h-3 text-[#aaa]"/>
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
                    <button onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(selected.name + ' MOUAU Umudike')}`, '_blank')}
                      className="btn-outline flex items-center gap-1 text-xs px-3">
                      <ExternalLink className="w-3 h-3"/> Maps
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Directions text-step panel */}
            {mode === 'directions' && dirResult && !dirResult._noSteps && leg && locState !== 'requesting' && (
              <div className="absolute bottom-0 left-0 right-0 z-10">
                <div className="bg-white rounded-t-2xl shadow-2xl border-t border-[#e8e8e8] flex flex-col max-h-[50vh]">
                  <button onClick={() => setShowSteps(!showSteps)}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#f0f0f0] flex-shrink-0 w-full text-left">
                    <div className="w-9 h-9 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0">
                      <Navigation2 className="w-4 h-4 text-white"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[#0a0a0a] text-sm">Route Summary</p>
                      <div className="flex items-center gap-2">
                        {totalDist && <span className="text-xs font-bold text-[#0a0a0a]">{totalDist}</span>}
                        {totalDur  && <><span className="text-[#aaa] text-xs">·</span><span className="text-xs font-bold text-[#1a6b3a]">{totalDur}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); openInGoogleMapsApp() }}
                        className="text-[10px] text-[#4285f4] font-semibold flex items-center gap-0.5 border border-[#4285f4]/20 rounded-full px-2 py-0.5">
                        <ExternalLink className="w-2.5 h-2.5"/> Open
                      </button>
                      {showSteps ? <ChevronDown className="w-4 h-4 text-[#aaa]"/> : <ChevronUp className="w-4 h-4 text-[#aaa]"/>}
                    </div>
                  </button>
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#f9f9f7] border-b border-[#f0f0f0] flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#1a6b3a] flex-shrink-0"/>
                    <p className="text-[11px] text-[#6b6b6b] truncate flex-1">{fromText.split(',')[0]}</p>
                    <ArrowRight className="w-3 h-3 text-[#aaa] flex-shrink-0"/>
                    <p className="text-[11px] font-semibold text-[#0a0a0a] truncate flex-1 text-right">{toText.split(',')[0]}</p>
                    <div className="w-2 h-2 rounded-full bg-[#dc2626] flex-shrink-0"/>
                  </div>
                  {showSteps && (
                    <div className="overflow-y-auto flex-1">
                      {steps.map((step, i) => {
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
                      })}
                      <div className="flex items-center gap-2 px-4 py-3 bg-[#1a6b3a]/5">
                        <div className="w-3 h-3 rounded-full bg-[#dc2626] flex-shrink-0"/>
                        <p className="text-xs font-semibold text-[#0a0a0a] flex-1">{toText.split(',')[0]}</p>
                        <span className="text-[10px] text-[#1a6b3a] font-semibold">Destination</span>
                      </div>
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

            {/* Mobile horizontal location chips */}
            {mode === 'explore' && !selected && locState !== 'requesting' && (
              <div className="lg:hidden absolute bottom-4 left-0 right-0 z-10 px-3">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {filtered.map(loc => (
                    <button key={loc.id} onClick={() => pickLocation(loc)}
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

export default function NavigatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 border-2 border-[#1a6b3a] border-t-transparent rounded-full animate-spin"/>
      </div>
    }>
      <NavigateContent/>
    </Suspense>
  )
}
