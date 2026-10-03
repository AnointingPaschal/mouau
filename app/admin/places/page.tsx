'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import {
  Plus, Trash2, Edit2, X, Save, Loader2, MapPin, CheckCircle2,
  Image as ImageIcon, Video, Link2, Hash, Target, Eye, EyeOff, ChevronRight
} from 'lucide-react'

type Place = {
  id: string; name: string; description: string; category: string
  lat: number; lng: number; hours: string; directions: string; active: boolean
  images: string[] | null; video_url: string | null; plus_code: string | null; added_by: string | null
}
type FormState = {
  name: string; description: string; category: string
  lat: string; lng: string; hours: string; directions: string; active: boolean
  images: string[]; video_url: string; plus_code: string
}

const CATS = ['college','admin','hostel','lodge','social','health','library','lecture','worship','sport','other']
const CAT_COLORS: Record<string,string> = {
  college:'#1a6b3a', admin:'#1e293b', hostel:'#6b6b6b', lodge:'#6366f1',
  social:'#d97706', health:'#dc2626', library:'#0891b2',
  lecture:'#ea580c', worship:'#7c3aed', sport:'#2563eb', other:'#aaa'
}

// Open Location Code (Google Plus Codes) encoder — standalone, no API needed
function encodePlusCode(lat: number, lng: number, codeLength = 10): string {
  const ALPHABET = '23456789CFGHJMPQRVWX'
  const SEPARATOR = '+'
  const SEPARATOR_POS = 8
  let latVal = lat + 90
  let lngVal = lng + 180
  let code = ''
  const pairs = Math.ceil(codeLength / 2)
  let latPairs = pairs
  let lngPairs = pairs
  for (let i = 0; i < latPairs; i++) {
    const latDigit = Math.floor(latVal / Math.pow(20, 4 - i))
    const lngDigit = Math.floor(lngVal / Math.pow(20, 4 - i))
    code += ALPHABET[latDigit] + ALPHABET[lngDigit]
    latVal -= latDigit * Math.pow(20, 4 - i)
    lngVal -= lngDigit * Math.pow(20, 4 - i)
  }
  if (code.length < SEPARATOR_POS) code = code.padEnd(SEPARATOR_POS, '0')
  return code.slice(0, SEPARATOR_POS) + SEPARATOR + code.slice(SEPARATOR_POS)
}

// Fetch locality name via reverse geocoding (Nominatim, free)
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
    const d = await r.json()
    // Get suburb/village/town
    const locality = d.address?.suburb || d.address?.village || d.address?.town || d.address?.city || ''
    const short = encodePlusCode(lat, lng)
    return locality ? `${short} ${locality}` : short
  } catch {
    return encodePlusCode(lat, lng)
  }
}

// ─── Leaflet Map Picker (loaded lazily so Next.js SSR doesn't crash) ──────────
function MapPicker({ lat, lng, onPick }: { lat: number; lng: number; onPick: (lat: number, lng: number) => void }) {
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    // Dynamic import to avoid SSR issues
    import('leaflet').then(L => {
      // Fix default marker icon
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current!, { zoomControl: true }).setView([lat, lng], 17)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19,
      }).addTo(map)

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onPick(pos.lat, pos.lng)
      })
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng)
        onPick(e.latlng.lat, e.latlng.lng)
      })

      mapRef.current = map
      markerRef.current = marker
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null }
    }
  }, [])

  // Update marker when lat/lng change from outside
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
      mapRef.current?.setView([lat, lng])
    }
  }, [lat, lng])

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider">
        Map Picker — click map or drag pin to set location
      </p>
      <div ref={containerRef} style={{ height: 260, borderRadius: 12, overflow: 'hidden', border: '1px solid #e8e8e8' }}/>
      <p className="text-[9px] text-[#bbb] text-center">© OpenStreetMap contributors</p>
    </div>
  )
}

// ─── Image Manager ─────────────────────────────────────────────────────────────
function ImageManager({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const [newUrl, setNewUrl] = useState('')
  const add = () => {
    const url = newUrl.trim()
    if (!url) return
    onChange([...images, url]); setNewUrl('')
  }
  const remove = (i: number) => onChange(images.filter((_,idx) => idx !== i))
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider flex items-center gap-1.5">
        <ImageIcon className="w-3 h-3"/> Images ({images.length})
      </p>
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-[#e8e8e8]">
              <img src={src} alt="" className="w-full h-full object-cover"/>
              <button onClick={() => remove(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white">
                <X className="w-2.5 h-2.5"/>
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input value={newUrl} onChange={e => setNewUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Paste image URL and press Enter or +"
          className="input flex-1 text-xs"/>
        <button onClick={add} className="px-3 py-2 bg-[#1a6b3a] text-white rounded-xl text-sm font-bold flex-shrink-0">
          <Plus className="w-4 h-4"/>
        </button>
      </div>
      <p className="text-[9px] text-[#bbb]">Tip: Upload to ImgBB, Cloudinary or any CDN — paste the direct image URL here</p>
    </div>
  )
}

export default function AdminPlacesPage() {
  const [places,    setPlaces]    = useState<Place[]>([])
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState<Place | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const { token, admin: me } = useAdmin()
  const adminEmail = me?.email || ''
  const [generatingCode, setGeneratingCode] = useState(false)

  const [form, setForm] = useState<FormState>({
    name:'', description:'', category:'college',
    lat:'5.4800', lng:'7.5455', hours:'', directions:'', active:true,
    images:[], video_url:'', plus_code:''
  })

  const authH = () => ({ Authorization: `Bearer ${token}` })
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/locations', { headers: authH() })
    const d = await r.json()
    setPlaces((d.data as Place[]) || [])
    setLoading(false)
  }
  useEffect(() => { if (token) load() }, [token])

  const isActive = (p: Place) => p.active !== false

  const openAdd = () => {
    setEditing(null)
    setForm({ name:'', description:'', category:'college', lat:'5.4800', lng:'7.5455', hours:'', directions:'', active:true, images:[], video_url:'', plus_code:'' })
    setShowForm(true)
  }
  const openEdit = (p: Place) => {
    setEditing(p)
    setForm({
      name: p.name, description: p.description, category: p.category,
      lat: String(p.lat), lng: String(p.lng), hours: p.hours || '',
      directions: p.directions || '', active: p.active !== false,
      images: Array.isArray(p.images) ? p.images : [],
      video_url: p.video_url || '', plus_code: p.plus_code || ''
    })
    setShowForm(true)
  }

  // Called by MapPicker when user clicks/drags
  const handleMapPick = useCallback(async (lat: number, lng: number) => {
    const latStr = lat.toFixed(6)
    const lngStr = lng.toFixed(6)
    setForm(f => ({ ...f, lat: latStr, lng: lngStr, plus_code: '' }))
    // Auto-generate plus code
    setGeneratingCode(true)
    const code = await reverseGeocode(lat, lng)
    setForm(f => ({ ...f, plus_code: code }))
    setGeneratingCode(false)
  }, [])

  const generatePlusCode = async () => {
    const lat = parseFloat(form.lat)
    const lng = parseFloat(form.lng)
    if (isNaN(lat) || isNaN(lng)) { showToast('Enter valid coordinates first'); return }
    setGeneratingCode(true)
    const code = await reverseGeocode(lat, lng)
    setForm(f => ({ ...f, plus_code: code }))
    setGeneratingCode(false)
  }

  const save = async () => {
    if (!form.name.trim()) { showToast('Name is required'); return }
    setSaving(true)
    const payload: any = {
      name: form.name.trim(), description: form.description.trim(),
      category: form.category, lat: parseFloat(form.lat) || 5.48, lng: parseFloat(form.lng) || 7.5455,
      hours: form.hours.trim(), directions: form.directions.trim(), active: form.active,
      images: form.images.filter(Boolean),
      video_url: form.video_url.trim() || null,
      plus_code: form.plus_code.trim() || null,
    }
    if (!editing) payload.added_by = adminEmail || null   // only set on insert, not edit
    if (editing) {
      await fetch('/api/admin/locations', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authH() },
        body: JSON.stringify({ id: editing.id, ...payload })
      })
      showToast('Place updated')
    } else {
      await fetch('/api/admin/locations', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authH() },
        body: JSON.stringify(payload)
      })
      showToast('Place added')
    }
    setSaving(false); setShowForm(false); load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this place?')) return
    await fetch('/api/admin/locations', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', ...authH() },
      body: JSON.stringify({ id })
    })
    showToast('Deleted'); load()
  }

  const toggle = async (p: Place) => {
    await fetch('/api/admin/locations', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authH() },
      body: JSON.stringify({ id: p.id, active: !isActive(p) })
    })
    load()
  }

  const deduplicate = async () => {
    if (!confirm('Remove duplicate places? Keeps oldest entry per name.')) return
    const seen: Record<string,boolean> = {}; const toDelete: string[] = []
    places.slice().sort((a,b) => a.id.localeCompare(b.id)).forEach(p => {
      const key = p.name.trim().toLowerCase()
      if (seen[key]) toDelete.push(p.id); else seen[key] = true
    })
    if (!toDelete.length) { showToast('No duplicates found'); return }
    await Promise.all(toDelete.map(id => fetch('/api/admin/locations', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', ...authH() },
      body: JSON.stringify({ id })
    })))
    showToast(`Removed ${toDelete.length} duplicate${toDelete.length > 1 ? 's' : ''}`); load()
  }

  const filtered = places.filter(p => {
    if (catFilter !== 'all' && p.category !== catFilter) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const grouped = CATS.reduce((acc,c) => {
    const items = filtered.filter(p => p.category === c)
    if (items.length > 0) acc[c] = items
    return acc
  }, {} as Record<string,Place[]>)
  const uncategorized = filtered.filter(p => !CATS.includes(p.category))
  if (uncategorized.length > 0) grouped['other'] = [...(grouped['other'] || []), ...uncategorized]

  const PlaceCard = ({ p }: { p: Place }) => {
    const imgCount  = Array.isArray(p.images) ? p.images.length : 0
    const hasVid    = !!p.video_url
    const hasPlusCode = !!p.plus_code
    return (
      <div className={`card p-3 ${!isActive(p) ? 'opacity-50' : ''}`}>
        <div className="flex items-start gap-2.5">
          <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{background:CAT_COLORS[p.category]||'#aaa',minHeight:36,width:3}}/>

          {/* Thumbnail */}
          {imgCount > 0 && (
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[#e8e8e8]">
              <img src={(p.images as string[])[0]} alt="" className="w-full h-full object-cover"/>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="font-bold text-[#0a0a0a] text-sm truncate flex-1">{p.name}</p>
              {!isActive(p) && <span className="text-[8px] bg-[#f0f0f0] text-[#aaa] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">Hidden</span>}
            </div>
            <p className="text-[10px] text-[#aaa] truncate">{p.description}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-[9px] text-[#ccc]">📍 {p.lat?.toFixed(4)}, {p.lng?.toFixed(4)}</p>
              {hasPlusCode && <p className="text-[9px] text-[#bbb] font-mono">{p.plus_code}</p>}
              {imgCount > 0 && <span className="text-[9px] text-[#aaa]">🖼 {imgCount}</span>}
              {hasVid && <span className="text-[9px] text-[#aaa]">🎥</span>}
            </div>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={() => toggle(p)}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${isActive(p)?'bg-[#1a6b3a]/10 text-[#1a6b3a]':'bg-[#f0f0f0] text-[#aaa]'}`}>
              {isActive(p) ? '●' : '○'}
            </button>
            <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-[#aaa] hover:text-blue-500 transition-all">
              <Edit2 className="w-3.5 h-3.5"/>
            </button>
            <button onClick={() => del(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500 transition-all">
              <Trash2 className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const mapLat = parseFloat(form.lat) || 5.48
  const mapLng = parseFloat(form.lng) || 7.5455

  return (
    <AdminShell>
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/> {toast}
        </div>
      )}

      <div className="p-4 space-y-4 w-full pb-24">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
            <h1 className="font-black text-[#0a0a0a] text-2xl">Campus Places</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">{places.length} total · {places.filter(p => p.active !== false).length} active</p>
          </div>
          <div className="flex gap-2">
            <button onClick={deduplicate} className="bg-red-50 text-red-600 text-xs font-bold px-3 py-2 rounded-xl border border-red-100">Dedupe</button>
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#1a6b3a] text-white text-xs font-bold px-3.5 py-2 rounded-xl">
              <Plus className="w-3.5 h-3.5"/> Add Place
            </button>
          </div>
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search places..." className="input w-full text-sm"/>

        {/* Category filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button onClick={() => setCatFilter('all')}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${catFilter==='all'?'bg-[#0a0a0a] text-white':'bg-white border border-[#e8e8e8] text-[#6b6b6b]'}`}>
            All
          </button>
          {CATS.map(c => {
            const count = places.filter(p => p.category === c).length
            if (!count) return null
            return (
              <button key={c} onClick={() => setCatFilter(catFilter===c?'all':c)}
                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition-all border-2 ${catFilter===c?'text-white border-transparent':'border-[#e8e8e8] text-[#6b6b6b]'}`}
                style={catFilter===c?{background:CAT_COLORS[c]}:{}}>
                {c} <span className="opacity-60">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : catFilter !== 'all' ? (
          <div className="space-y-2">
            {!filtered.length
              ? <div className="card p-8 text-center"><p className="text-sm text-[#aaa]">No places in this category</p></div>
              : filtered.map(p => <PlaceCard key={p.id} p={p}/>)
            }
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => setCatFilter(cat)}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:CAT_COLORS[cat]||'#aaa'}}/>
                  <p className="text-[10px] font-black text-[#0a0a0a] uppercase tracking-widest capitalize">{cat}</p>
                  <div className="flex-1 h-px bg-[#e8e8e8]"/>
                  <span className="text-[10px] font-bold text-[#1a6b3a]">{items.length} →</span>
                </div>
                <div className="space-y-1.5">
                  {items.slice(0,3).map(p => <PlaceCard key={p.id} p={p}/>)}
                  {items.length > 3 && (
                    <button onClick={() => setCatFilter(cat)}
                      className="w-full py-2 text-xs font-bold text-[#1a6b3a] bg-[#1a6b3a]/5 rounded-xl hover:bg-[#1a6b3a]/10 transition-colors">
                      +{items.length-3} more {cat} places
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add/Edit form ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => !saving && setShowForm(false)}/>
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl animate-slide-up max-h-[96vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 px-5 pt-4 pb-3 border-b border-[#f0f0f0]">
              <div className="w-10 h-1 bg-[#e8e8e8] rounded-full mx-auto mb-3"/>
              <div className="flex items-center justify-between">
                <h2 className="font-black text-[#0a0a0a] text-lg">{editing ? 'Edit Place' : 'Add New Place'}</h2>
                {!saving && <button onClick={() => setShowForm(false)} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>}
              </div>
            </div>

            <div className="p-5 space-y-5">

              {/* Basic Info */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-[#aaa] uppercase tracking-widest">Basic Info</p>
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Place Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))} className="input text-sm" placeholder="e.g. University Library"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Description</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm(f => ({...f,description:e.target.value}))} className="input resize-none text-sm" placeholder="Brief description"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5 block">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATS.map(c => (
                      <button key={c} onClick={() => setForm(f => ({...f,category:c}))}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition-all border-2 ${form.category===c?'text-white border-transparent':'border-[#e8e8e8] text-[#6b6b6b]'}`}
                        style={form.category===c?{background:CAT_COLORS[c]}:{}}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Map Picker */}
              <MapPicker lat={mapLat} lng={mapLng} onPick={handleMapPick}/>

              {/* Coordinates + Plus Code */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Latitude</label>
                    <input value={form.lat}
                      onChange={e => setForm(f => ({...f,lat:e.target.value}))}
                      onBlur={() => {
                        const lat = parseFloat(form.lat); const lng = parseFloat(form.lng)
                        if (!isNaN(lat) && !isNaN(lng)) handleMapPick(lat, lng)
                      }}
                      className="input text-sm font-mono" placeholder="5.4800"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Longitude</label>
                    <input value={form.lng}
                      onChange={e => setForm(f => ({...f,lng:e.target.value}))}
                      onBlur={() => {
                        const lat = parseFloat(form.lat); const lng = parseFloat(form.lng)
                        if (!isNaN(lat) && !isNaN(lng)) handleMapPick(lat, lng)
                      }}
                      className="input text-sm font-mono" placeholder="7.5455"/>
                  </div>
                </div>

                {/* Plus Code */}
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Hash className="w-3 h-3"/> Plus Code (Google Open Location Code)
                  </label>
                  <div className="flex gap-2">
                    <input value={form.plus_code}
                      onChange={e => setForm(f => ({...f,plus_code:e.target.value}))}
                      className="input text-sm font-mono flex-1" placeholder="Auto-generated from coordinates"/>
                    <button onClick={generatePlusCode} disabled={generatingCode}
                      className="px-3 py-2 bg-[#f0f0f0] rounded-xl text-xs font-bold text-[#555] flex items-center gap-1 flex-shrink-0 disabled:opacity-50">
                      {generatingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Target className="w-3.5 h-3.5"/>}
                      {generatingCode ? '...' : 'Generate'}
                    </button>
                  </div>
                  <p className="text-[9px] text-[#bbb] mt-1">Automatically generated when you pick a point on the map</p>
                </div>
              </div>

              {/* Hours + Directions */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-[#aaa] uppercase tracking-widest">Details</p>
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Opening Hours</label>
                  <input value={form.hours} onChange={e => setForm(f => ({...f,hours:e.target.value}))} className="input text-sm" placeholder="e.g. Mon-Fri 8am-5pm"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">How to Get There</label>
                  <textarea rows={2} value={form.directions} onChange={e => setForm(f => ({...f,directions:e.target.value}))} className="input resize-none text-sm" placeholder="Walking directions..."/>
                </div>
              </div>

              {/* Images */}
              <div className="pt-1 border-t border-[#f0f0f0]">
                <ImageManager images={form.images} onChange={imgs => setForm(f => ({...f,images:imgs}))}/>
              </div>

              {/* Video */}
              <div className="space-y-2 pt-1 border-t border-[#f0f0f0]">
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-3 h-3"/> Video URL (optional)
                </label>
                <input value={form.video_url} onChange={e => setForm(f => ({...f,video_url:e.target.value}))}
                  className="input text-sm" placeholder="YouTube, Google Drive or direct video link"/>
                <p className="text-[9px] text-[#bbb]">YouTube links are auto-embedded on the place page</p>
              </div>

              {/* Visibility */}
              <div className="flex items-center justify-between p-3 bg-[#f9f9f7] rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-[#0a0a0a]">Visible to students</p>
                  <p className="text-[10px] text-[#aaa]">Show in campus map</p>
                </div>
                <button onClick={() => setForm(f => ({...f,active:!f.active}))}
                  className={`w-11 h-6 rounded-full transition-all relative ${form.active?'bg-[#1a6b3a]':'bg-[#e8e8e8]'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${form.active?'left-5':'left-0.5'}`}/>
                </button>
              </div>

              {/* Admin note (only on add) */}
              {!editing && adminEmail && (
                <p className="text-[9px] text-[#bbb] text-center">Added by: {adminEmail} (stored for audit, not shown to students)</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowForm(false)} disabled={saving}
                  className="flex-1 py-3 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">
                  Cancel
                </button>
                <button onClick={save} disabled={saving}
                  className="flex-1 py-3 bg-[#1a6b3a] rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> Saving...</> : <><Save className="w-3.5 h-3.5"/> {editing ? 'Update' : 'Add Place'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
