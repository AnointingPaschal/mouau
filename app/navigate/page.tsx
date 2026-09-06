'use client'
import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import CampusMap from '@/components/CampusMap'
import { getCampusLocations } from '@/lib/db'
import {
  MapPin, Navigation2, ArrowRight, Loader2, LocateFixed,
  ChevronDown, ChevronUp, CornerDownRight, MoveRight,
  AlertCircle, ExternalLink, MapPinOff, ShieldAlert,
  RefreshCw, X, Search
} from 'lucide-react'

type Loc = { id: string; name: string; description: string; lat: number; lng: number; category: string; hours: string; directions: string }
type Prediction = { description: string; place_id: string; structured_formatting?: { main_text: string; secondary_text: string } }
type Step = { html_instructions?: string; instructions?: string; distance?: { text: string }; duration?: { text: string }; maneuver?: string }

const COLORS: Record<string, string> = {
  academic: '#1a6b3a', admin: '#0a0a0a', hostel: '#6b6b6b',
  social: '#d97706', health: '#dc2626', worship: '#7c3aed', sport: '#2563eb'
}
const DEFAULT_SRC = 'https://maps.google.com/maps?q=Michael+Okpara+University+of+Agriculture+Umudike&output=embed&z=16'
const LOC_GRANTED_KEY = 'mouau_location_granted'

function stripHtml(h: string) { return h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() }

function ManeuverIcon({ m }: { m?: string }) {
  if (!m) return <MoveRight className="w-3.5 h-3.5"/>
  if (m.includes('left'))       return <CornerDownRight className="w-3.5 h-3.5 scale-x-[-1]"/>
  if (m.includes('right'))      return <CornerDownRight className="w-3.5 h-3.5"/>
  if (m.includes('uturn'))      return <span className="text-base leading-none">↩</span>
  if (m.includes('roundabout')) return <span className="text-sm leading-none">↻</span>
  return <MoveRight className="w-3.5 h-3.5"/>
}

function NavigateContent() {
  const searchParams = useSearchParams()
  const paramTo = searchParams.get('to') || ''

  const alreadyGranted = typeof window !== 'undefined' && localStorage.getItem(LOC_GRANTED_KEY) === '1'

  type LocState = 'granted' | 'requesting' | 'denied' | 'skipped'
  const [locState, setLocState] = useState<LocState>(alreadyGranted ? 'granted' : 'requesting')
  const [userLat, setUserLat]   = useState<number | null>(null)
  const [userLng, setUserLng]   = useState<number | null>(null)

  const [locations, setLocations] = useState<Loc[]>([])
  const [mapSrc, setMapSrc]       = useState(DEFAULT_SRC)
  const [mapKey, setMapKey]       = useState(0)

  // From field
  const [fromText, setFromText]   = useState('')
  const [fromId, setFromId]       = useState('')
  const [fromSugg, setFromSugg]   = useState<Prediction[]>([])
  const [fromLoading, setFromLoading] = useState(false)
  const [fromFocus, setFromFocus] = useState(false)
  const fromTimer = useRef<any>(null)

  // To field
  const [toText, setToText]       = useState('')
  const [toId, setToId]           = useState('')
  const [toSugg, setToSugg]       = useState<Prediction[]>([])
  const [toLoading, setToLoading] = useState(false)
  const [toFocus, setToFocus]     = useState(false)
  const toTimer = useRef<any>(null)

  // Directions
  const [loadingDir, setLoadingDir] = useState(false)
  const [gettingLoc, setGettingLoc] = useState(false)
  const [dirError, setDirError]     = useState('')
  const [dirResult, setDirResult]   = useState<any>(null)
  const [showSteps, setShowSteps]   = useState(true)

  const updateMap = (src: string) => { setMapSrc(src); setMapKey(k => k + 1) }

  useEffect(() => {
    getCampusLocations().then(({ data }) => { if (data) setLocations(data as Loc[]) })
    if (paramTo) setToText(paramTo)
  }, [paramTo])

  // Auto-request GPS on mount
  const doGetLocation = useCallback((silent = false): Promise<{lat: number; lng: number} | null> => {
    return new Promise(resolve => {
      if (!navigator.geolocation) { if (!silent) setLocState('denied'); resolve(null); return }
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude: lat, longitude: lng } = pos.coords
          setUserLat(lat); setUserLng(lng); setLocState('granted')
          setFromText(`${lat.toFixed(6)},${lng.toFixed(6)}`)
          localStorage.setItem(LOC_GRANTED_KEY, '1')
          updateMap(`https://maps.google.com/maps?q=${lat},${lng}&output=embed&z=17&t=k`)
          resolve({ lat, lng })
        },
        err => {
          console.warn('Location:', err.message)
          if (!silent) setLocState('denied')
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    })
  }, [])

  useEffect(() => {
    if (alreadyGranted) { doGetLocation(true); return }
    if (!navigator.geolocation) { setLocState('denied'); return }
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then(result => {
          if (result.state === 'granted') { setLocState('granted'); localStorage.setItem(LOC_GRANTED_KEY, '1'); doGetLocation(true) }
          else if (result.state === 'denied') { setLocState('denied') }
          else { setLocState('requesting'); doGetLocation(false) }
          result.onchange = () => {
            if (result.state === 'granted') { setLocState('granted'); localStorage.setItem(LOC_GRANTED_KEY, '1'); doGetLocation(true) }
            else if (result.state === 'denied') setLocState('denied')
          }
        })
        .catch(() => { setLocState('requesting'); doGetLocation(false) })
    } else { doGetLocation(false) }
  }, [alreadyGranted, doGetLocation])

  // Autocomplete via SerpAPI
  const fetchSugg = async (val: string): Promise<Prediction[]> => {
    if (val.length < 2) return []
    try {
      const r = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(val + ' MOUAU Umudike')}`)
      const d = await r.json()
      return d.predictions || []
    } catch { return [] }
  }

  const onFromChange = (val: string) => {
    setFromText(val); setFromId(''); setDirResult(null)
    clearTimeout(fromTimer.current)
    if (val.length < 2) { setFromSugg([]); return }
    setFromLoading(true)
    fromTimer.current = setTimeout(async () => {
      setFromSugg(await fetchSugg(val)); setFromLoading(false)
    }, 400)
  }

  const onToChange = (val: string) => {
    setToText(val); setToId(''); setDirResult(null)
    clearTimeout(toTimer.current)
    if (val.length < 2) { setToSugg([]); return }
    setToLoading(true)
    toTimer.current = setTimeout(async () => {
      setToSugg(await fetchSugg(val)); setToLoading(false)
    }, 400)
  }

  // Get Directions — auto-gets location if From is empty, shows inline + option to open app
  const getDirections = async () => {
    if (!toText.trim()) { setDirError('Enter a destination.'); return }
    setDirError(''); setLoadingDir(true); setDirResult(null)

    let origin = fromText.trim()

    // Auto-get GPS if From field is empty
    if (!origin) {
      setGettingLoc(true)
      const pos = await doGetLocation(false)
      setGettingLoc(false)
      if (pos) {
        origin = `${pos.lat},${pos.lng}`
      } else {
        // Fallback to MOUAU main gate
        origin = 'Michael Okpara University of Agriculture Main Gate, Umudike'
      }
    }

    const dest = toText.trim()

    // Update iframe to show route
    updateMap(`https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(dest)}&output=embed&dirflg=d`)

    // Fetch turn-by-turn from SerpAPI
    try {
      let url = `/api/maps/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`
      if (fromId) url += `&origin_place_id=${fromId}`
      if (toId)   url += `&destination_place_id=${toId}`
      const data = await (await fetch(url)).json()
      setDirResult((data.directions || data.routes) ? data : { _noSteps: true })
      setShowSteps(true)
    } catch { setDirResult({ _noSteps: true }) }

    setLoadingDir(false)
  }

  const openInApp = () => {
    const from = fromText || (userLat ? `${userLat},${userLng}` : 'Michael Okpara University, Umudike')
    const to   = toText || 'Michael Okpara University of Agriculture, Umudike'
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=driving`, '_blank')
  }

  const retryLocation = () => { setLocState('requesting'); doGetLocation(false) }
  const skipLocation  = () => { setLocState('skipped'); updateMap(DEFAULT_SRC) }

  const leg        = dirResult?.directions?.[0]?.legs?.[0] || dirResult?.routes?.[0]?.legs?.[0]
  const steps: Step[] = leg?.steps || []
  const totalDist  = leg?.distance?.text || ''
  const totalDur   = leg?.duration?.text  || ''
  const showOverlay = locState === 'requesting' || locState === 'denied'

  return (
    <AppShell>
      <TopBar title="Campus Navigation" subtitle="Find your way around MOUAU"/>

      <div className={`relative flex flex-col h-[calc(100vh-104px)] lg:h-[calc(100vh-60px)] transition-all duration-300 ${showOverlay ? 'blur-md pointer-events-none select-none brightness-95' : ''}`}>

        {/* Inputs */}
        <div className="bg-white border-b border-[#e8e8e8] px-3 py-3 space-y-2 z-20 relative">

          {/* FROM */}
          <div className="relative">
            <div className={`flex items-center border rounded-xl bg-white transition-colors shadow-sm ${fromFocus ? 'border-[#1a6b3a]' : 'border-[#e8e8e8]'}`}>
              <div className="px-3 flex-shrink-0"><div className="w-2.5 h-2.5 rounded-full bg-[#1a6b3a]"/></div>
              <input
                value={fromText}
                onChange={e => onFromChange(e.target.value)}
                onFocus={() => setFromFocus(true)}
                onBlur={() => setTimeout(() => { setFromFocus(false); setFromSugg([]) }, 200)}
                placeholder="From: your current location..."
                className="flex-1 py-3 text-xs outline-none text-[#0a0a0a] placeholder-[#aaa] bg-transparent"
              />
              {fromLoading && <Loader2 className="w-3.5 h-3.5 text-[#1a6b3a] animate-spin mr-2 flex-shrink-0"/>}
              {locState === 'granted' && userLat && !fromLoading && (
                <button onClick={() => { setFromText(`${userLat!.toFixed(6)},${userLng!.toFixed(6)}`); setFromSugg([]) }}
                  className="px-2 text-[#1a6b3a] flex-shrink-0" title="Use my location">
                  <LocateFixed className="w-4 h-4"/>
                </button>
              )}
              {fromText && <button onClick={() => { setFromText(''); setFromSugg([]) }} className="px-2 flex-shrink-0"><X className="w-3.5 h-3.5 text-[#aaa]"/></button>}
            </div>
            {fromSugg.length > 0 && fromFocus && (
              <div className="absolute top-full left-0 right-0 z-40 mt-1 bg-white border border-[#e8e8e8] rounded-xl shadow-2xl overflow-hidden">
                {fromSugg.slice(0, 5).map((s, i) => (
                  <button key={i} onMouseDown={() => { setFromText(s.description); setFromId(s.place_id); setFromSugg([]) }}
                    className="w-full flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-[#f9f9f7] text-left border-b border-[#f5f5f5] last:border-0">
                    <MapPin className="w-3 h-3 text-[#1a6b3a] mt-0.5 flex-shrink-0"/>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0a0a0a] truncate">{s.structured_formatting?.main_text || s.description.split(',')[0]}</p>
                      <p className="text-[10px] text-[#aaa] truncate">{s.structured_formatting?.secondary_text || ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TO */}
          <div className="relative">
            <div className={`flex items-center border rounded-xl bg-white transition-colors shadow-sm ${toFocus ? 'border-[#dc2626]' : 'border-[#e8e8e8]'}`}>
              <div className="px-3 flex-shrink-0"><div className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"/></div>
              <input
                value={toText}
                onChange={e => onToChange(e.target.value)}
                onFocus={() => setToFocus(true)}
                onBlur={() => setTimeout(() => { setToFocus(false); setToSugg([]) }, 200)}
                placeholder="To: destination on campus..."
                className="flex-1 py-3 text-xs outline-none text-[#0a0a0a] placeholder-[#aaa] bg-transparent"
              />
              {toLoading && <Loader2 className="w-3.5 h-3.5 text-[#1a6b3a] animate-spin mr-2 flex-shrink-0"/>}
              {toText && <button onClick={() => { setToText(''); setToId(''); setToSugg([]); setDirResult(null) }} className="px-2 flex-shrink-0"><X className="w-3.5 h-3.5 text-[#aaa]"/></button>}
            </div>
            {(toSugg.length > 0 || locations.filter(l => toText.length > 1 && l.name.toLowerCase().includes(toText.toLowerCase())).length > 0) && toFocus && (
              <div className="absolute top-full left-0 right-0 z-40 mt-1 bg-white border border-[#e8e8e8] rounded-xl shadow-2xl overflow-hidden">
                {/* DB campus locations first */}
                {locations.filter(l => toText.length > 1 && l.name.toLowerCase().includes(toText.toLowerCase())).slice(0, 3).map(l => (
                  <button key={l.id} onMouseDown={() => { setToText(l.name + ', MOUAU Umudike'); setToId(''); setToSugg([]) }}
                    className="w-full flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-[#f0f9f4] text-left border-b border-[#f5f5f5]">
                    <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" style={{ background: COLORS[l.category] || '#1a6b3a' }}/>
                    <div>
                      <p className="text-xs font-semibold text-[#0a0a0a]">{l.name}</p>
                      <p className="text-[10px] text-[#1a6b3a] font-medium">On campus · {l.category}</p>
                    </div>
                  </button>
                ))}
                {/* SerpAPI suggestions */}
                {toSugg.slice(0, 4).map((s, i) => (
                  <button key={i} onMouseDown={() => { setToText(s.description); setToId(s.place_id); setToSugg([]) }}
                    className="w-full flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-[#f9f9f7] text-left border-b border-[#f5f5f5] last:border-0">
                    <MapPin className="w-3 h-3 text-[#aaa] mt-0.5 flex-shrink-0"/>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0a0a0a] truncate">{s.structured_formatting?.main_text || s.description.split(',')[0]}</p>
                      <p className="text-[10px] text-[#aaa] truncate">{s.structured_formatting?.secondary_text || ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick campus destination chips */}
          {!toText && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
              {locations.slice(0, 8).map(l => (
                <button key={l.id} onClick={() => { setToText(l.name + ', MOUAU Umudike'); setToSugg([]) }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f9f9f7] border border-[#e8e8e8] rounded-full text-[10px] font-semibold text-[#0a0a0a] hover:border-[#1a6b3a]/50 whitespace-nowrap transition-all">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: COLORS[l.category] || '#1a6b3a' }}/>
                  {l.name.replace('University ', '').replace('College of ', '')}
                </button>
              ))}
            </div>
          )}

          {dirError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-red-600">{dirError}</p>
            </div>
          )}

          {/* Get Directions — never faded, auto-gets location if From is empty */}
          <button onClick={getDirections} disabled={loadingDir}
            className="btn-primary w-full flex items-center justify-center gap-1.5">
            {loadingDir ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin"/>
                {gettingLoc ? 'Getting your location...' : 'Finding route...'}
              </>
            ) : (
              <><Navigation2 className="w-3.5 h-3.5"/>Get Directions</>
            )}
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <CampusMap src={mapSrc} key={mapKey}/>

          <button onClick={openInApp}
            className="absolute top-2 right-2 z-10 bg-white border border-[#e8e8e8] rounded-full px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-[#0a0a0a] shadow-md">
            <ExternalLink className="w-3 h-3 text-[#1a6b3a]"/> Open in Maps
          </button>

          {/* Scrollable campus chips at bottom when no result */}
          {!dirResult && (
            <div className="lg:hidden absolute bottom-4 left-0 right-0 z-10 px-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {locations.map(loc => (
                  <button key={loc.id} onClick={() => setToText(loc.name + ', MOUAU Umudike')}
                    className="flex-shrink-0 bg-white border border-[#e8e8e8] rounded-xl px-3 py-2 shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[loc.category] || '#1a6b3a' }}/>
                    <p className="text-xs font-semibold text-[#0a0a0a] whitespace-nowrap max-w-[110px] truncate">{loc.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inline directions panel */}
          {dirResult && !dirResult._noSteps && leg && (
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <div className="bg-white rounded-t-2xl shadow-2xl border-t border-[#e8e8e8] flex flex-col max-h-[52vh]">

                <button onClick={() => setShowSteps(!showSteps)}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#f0f0f0] flex-shrink-0 w-full text-left">
                  <div className="w-9 h-9 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0">
                    <Navigation2 className="w-4 h-4 text-white"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[#0a0a0a] text-sm">Route Found</p>
                    <div className="flex items-center gap-2">
                      {totalDist && <span className="text-xs font-bold">{totalDist}</span>}
                      {totalDur  && <><span className="text-[#aaa] text-xs">·</span><span className="text-xs font-bold text-[#1a6b3a]">{totalDur}</span></>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); openInApp() }}
                      className="text-[10px] text-[#1a6b3a] font-semibold border border-[#1a6b3a]/20 rounded-full px-2.5 py-1 flex items-center gap-0.5">
                      <ExternalLink className="w-2.5 h-2.5"/> Open
                    </button>
                    {showSteps ? <ChevronDown className="w-4 h-4 text-[#aaa]"/> : <ChevronUp className="w-4 h-4 text-[#aaa]"/>}
                  </div>
                </button>

                <div className="flex items-center gap-2 px-4 py-2 bg-[#f9f9f7] border-b border-[#f0f0f0] flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#1a6b3a] flex-shrink-0"/>
                  <p className="text-[11px] text-[#6b6b6b] truncate flex-1">{fromText.split(',')[0] || 'Your location'}</p>
                  <ArrowRight className="w-3 h-3 text-[#aaa] flex-shrink-0"/>
                  <p className="text-[11px] font-semibold text-[#0a0a0a] truncate flex-1 text-right">{toText.split(',')[0]}</p>
                  <div className="w-2 h-2 rounded-full bg-[#dc2626] flex-shrink-0"/>
                </div>

                {showSteps && (
                  <div className="overflow-y-auto flex-1">
                    {steps.length === 0 ? (
                      <div className="px-4 py-5 text-center">
                        <p className="text-xs text-[#aaa]">Route shown on map. Tap "Open" for turn-by-turn navigation.</p>
                        <button onClick={openInApp} className="btn-primary mt-3 mx-auto flex items-center gap-1.5 text-xs">
                          <ExternalLink className="w-3 h-3"/> Open Navigation
                        </button>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No steps fallback — route shown on map but no text steps */}
          {dirResult?._noSteps && (
            <div className="absolute bottom-4 left-3 right-3 z-10">
              <div className="bg-white rounded-2xl shadow-xl border border-[#e8e8e8] p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0">
                  <Navigation2 className="w-4 h-4 text-white"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#0a0a0a] text-xs">Route shown on map</p>
                  <p className="text-[#aaa] text-[10px] mt-0.5">Tap Open for turn-by-turn navigation</p>
                </div>
                <button onClick={openInApp}
                  className="flex items-center gap-1 text-[10px] font-semibold text-white bg-[#1a6b3a] rounded-xl px-3 py-2 flex-shrink-0">
                  <ExternalLink className="w-3 h-3"/> Open
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location permission overlay */}
      {showOverlay && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/10">
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
                <p className="text-[10px] text-[#aaa] mb-5 leading-relaxed">
                  A browser prompt should appear. Tap <strong>Allow</strong> to continue.
                </p>
                <button onClick={skipLocation}
                  className="w-full py-2.5 text-xs font-semibold text-[#aaa] hover:text-[#6b6b6b] border border-[#e8e8e8] rounded-xl transition-colors">
                  Skip — Browse without location
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPinOff className="w-8 h-8 text-red-500"/>
                </div>
                <h2 className="font-black text-[#0a0a0a] text-base mb-2">Location Access Denied</h2>
                <p className="text-[#6b6b6b] text-sm leading-relaxed mb-3">Enable location for precise campus directions.</p>
                <div className="bg-[#f9f9f7] rounded-xl p-3 mb-4 text-left">
                  <p className="text-[10px] font-semibold text-[#0a0a0a] mb-1.5 flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3 text-amber-500"/> How to enable:
                  </p>
                  <p className="text-[10px] text-[#6b6b6b] leading-relaxed mb-1">1. Tap the lock icon in your browser → Allow Location.</p>
                  <p className="text-[10px] text-[#6b6b6b] leading-relaxed">2. Make sure your phone GPS is ON in quick settings.</p>
                </div>
                <button onClick={retryLocation}
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
    </AppShell>
  )
}

export default function NavigatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-5 h-5 border-2 border-[#1a6b3a] border-t-transparent rounded-full animate-spin"/></div>}>
      <NavigateContent/>
    </Suspense>
  )
}
