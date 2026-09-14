'use client'
import { useState, useEffect, useRef } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Save, Loader2, CheckCircle2, Upload, X, RefreshCw, MapPin, BookOpen, Users, ClipboardList, Calculator, Bell } from 'lucide-react'

const FEATURE_ICONS = [MapPin, BookOpen, Users, ClipboardList, Calculator, Bell]
const FEATURE_COLORS = ['#3b82f6','#1a6b3a','#7c3aed','#d97706','#0891b2','#b91c1c']

const DEFAULT_FEATURES = [
  { title:'Campus Navigation',   desc:'Real-time GPS directions to every building, hostel, and facility on MOUAU campus.' },
  { title:'Study Library',        desc:'Past questions, lecture notes, and project files. Apply and collect every Sunday.' },
  { title:'PDM Ministry',         desc:'Gallery, programs, videos, events, and directions to Pneuma Domain Ministry.' },
  { title:'Registration Guide',   desc:'Step-by-step guide covering all 49 stages of MOUAU registration.' },
  { title:'CGPA Calculator',      desc:'Calculate your CGPA and estimate school fees instantly.' },
  { title:'Announcements',        desc:'Instant push notifications for campus news and ministry updates.' },
]

export default function AdminLandingPage() {
  const { token } = useAdmin()
  const authH = { Authorization: `Bearer ${token}` }

  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState('')
  const [vals,     setVals]     = useState<Record<string,string>>({})
  const [uploads,  setUploads]  = useState<Record<string,boolean>>({})
  const fileRefs = useRef<(HTMLInputElement|null)[]>([])

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    if (!token) return
    fetch('/api/admin/landing', { headers: authH })
      .then(r => r.json())
      .then(d => { setVals(d.data || {}); setLoading(false) })
  }, [token])

  const set = (key: string, val: string) => setVals(p => ({ ...p, [key]: val }))

  const save = async () => {
    setSaving(true)
    const r = await fetch('/api/admin/landing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authH },
      body: JSON.stringify(vals),
    })
    const d = await r.json()
    setSaving(false)
    if (d.ok) {
      showToast(`Saved! ${d.saved} settings updated — reload landing page to see changes.`)
    } else {
      showToast(d.error || 'Save failed')
    }
  }

  const uploadImage = async (slot: string, file: File, idx: number) => {
    setUploads(p => ({ ...p, [slot]: true }))
    const fd = new FormData()
    fd.append('image', file)
    fd.append('slot', slot)
    const r = await fetch('/api/admin/upload-feature-image', { method: 'POST', headers: authH, body: fd })
    const d = await r.json()
    if (d.url) set(slot, d.url)
    setUploads(p => ({ ...p, [slot]: false }))
    showToast(d.url ? 'Image uploaded!' : d.error || 'Upload failed')
  }

  const v = (key: string, fallback = '') => vals[key] ?? fallback

  return (
    <AdminShell>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/> {toast}
        </div>
      )}

      <div className="p-4 w-full pb-24 space-y-5 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
            <h1 className="font-black text-[#0a0a0a] text-2xl">Landing Page</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">Edit public homepage content &amp; feature images</p>
          </div>
          <div className="flex gap-2">
            <a href="/" target="_blank" className="p-2 rounded-xl border border-[#e8e8e8] hover:bg-[#f9f9f7] flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-[#6b6b6b]"/>
            </a>
            <button onClick={save} disabled={saving}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white ${saving ? 'bg-[#1a6b3a]/40 cursor-not-allowed' : 'bg-[#1a6b3a] hover:bg-[#145530]'}`}>
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> Saving…</> : <><Save className="w-3.5 h-3.5"/> Save</>}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : (
          <>
            {/* ── Hero ── */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-[#f9f9f7] border-b border-[#e8e8e8]">
                <h2 className="font-black text-[#0a0a0a] text-sm">Hero Section</h2>
              </div>
              <div className="divide-y divide-[#f5f5f5]">
                {[
                  { key:'landing_badge',       label:'Badge text',   ph:'Free for all MOUAU students' },
                  { key:'landing_title1',      label:'Headline 1',   ph:'Your MOUAU' },
                  { key:'landing_title2',      label:'Headline 2 (gradient)', ph:'Campus Companion' },
                  { key:'landing_description', label:'Description',  ph:'Navigate campus...', ta:true },
                ].map(({ key, label, ph, ta }) => (
                  <div key={key} className="px-4 py-3.5">
                    <label className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-wide block mb-1.5">{label}</label>
                    {ta ? (
                      <textarea rows={2} value={v(key)} onChange={e => set(key, e.target.value)}
                        placeholder={ph} className="input w-full text-sm resize-none"/>
                    ) : (
                      <input value={v(key)} onChange={e => set(key, e.target.value)}
                        placeholder={ph} className="input w-full text-sm"/>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Stats ── */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-[#f9f9f7] border-b border-[#e8e8e8]">
                <h2 className="font-black text-[#0a0a0a] text-sm">Stats Bar</h2>
              </div>
              <div className="p-4 grid grid-cols-3 gap-3">
                {[1,2,3].map(n => (
                  <div key={n} className="space-y-1.5">
                    <input value={v(`landing_stat${n}_value`)} onChange={e => set(`landing_stat${n}_value`, e.target.value)}
                      placeholder={n===1?'49':n===2?'100+':'24/7'} className="input w-full text-sm text-center font-bold"/>
                    <input value={v(`landing_stat${n}_label`)} onChange={e => set(`landing_stat${n}_label`, e.target.value)}
                      placeholder={n===1?'Registration steps':n===2?'Campus locations':'Available anytime'} className="input w-full text-[10px] text-center"/>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Features ── */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-[#f9f9f7] border-b border-[#e8e8e8]">
                <h2 className="font-black text-[#0a0a0a] text-sm">Feature Cards</h2>
                <p className="text-[10px] text-[#aaa] mt-0.5">Upload an image for each feature or leave blank for the default icon style</p>
              </div>
              <div className="divide-y divide-[#f5f5f5]">
                {DEFAULT_FEATURES.map((df, i) => {
                  const n = i + 1
                  const imageKey = `landing_f${n}_image`
                  const currentImg = v(imageKey)
                  const Icon = FEATURE_ICONS[i]
                  const color = FEATURE_COLORS[i]
                  const isUploading = uploads[imageKey]

                  return (
                    <div key={n} className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:`${color}20`}}>
                          <Icon className="w-3.5 h-3.5" style={{color}}/>
                        </div>
                        <span className="text-xs font-bold text-[#0a0a0a]">Feature {n}</span>
                      </div>

                      <div className="space-y-2">
                        <input value={v(`landing_f${n}_title`, df.title)}
                          onChange={e => set(`landing_f${n}_title`, e.target.value)}
                          placeholder={df.title} className="input w-full text-sm font-semibold"/>
                        <textarea rows={2} value={v(`landing_f${n}_desc`, df.desc)}
                          onChange={e => set(`landing_f${n}_desc`, e.target.value)}
                          placeholder={df.desc} className="input w-full text-xs resize-none"/>
                      </div>

                      {/* Image upload */}
                      <div className="mt-3 flex items-center gap-3">
                        {currentImg ? (
                          <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-[#e8e8e8] flex-shrink-0">
                            <img src={currentImg} alt="" className="w-full h-full object-cover"/>
                            <button onClick={() => set(imageKey, '')}
                              className="absolute top-1 right-1 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center">
                              <X className="w-2.5 h-2.5 text-white"/>
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-14 rounded-xl border-2 border-dashed border-[#e8e8e8] flex items-center justify-center flex-shrink-0 bg-[#f9f9f7]">
                            <Icon className="w-5 h-5 text-[#ddd]"/>
                          </div>
                        )}
                        <div>
                          <input ref={el => { fileRefs.current[i] = el }} type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(imageKey, f, i); e.target.value = '' }}/>
                          <button onClick={() => fileRefs.current[i]?.click()} disabled={isUploading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f0f0] hover:bg-[#e8e8e8] rounded-lg text-[10px] font-semibold text-[#6b6b6b] transition-colors">
                            {isUploading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3"/>}
                            {isUploading ? 'Uploading…' : currentImg ? 'Replace image' : 'Upload image'}
                          </button>
                          <p className="text-[9px] text-[#aaa] mt-1">PNG, JPG · max 5 MB</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  )
}
