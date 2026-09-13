'use client'
import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { BookOpen, Download, Loader2, CheckCircle2, X, Navigation2, MapPin, Package, AlertCircle } from 'lucide-react'

const PNEUMA_LAT = 5.4800
const PNEUMA_LNG = 7.5455
const PNEUMA_ADDR = 'Pneuma Domain Ministry, MOUAU Campus, Umudike'

type Material = {
  id:string; title:string; description:string; type:string
  image_url:string; available:boolean; quantity:number; created_at:string
}

type Request = { material_id:string; status:string }

const TYPE_COLORS: Record<string,string> = {
  book:'#1e3a8a', notes:'#1a6b3a', cd:'#b91c1c', dvd:'#c2410c', other:'#6b6b6b'
}

function nextSunday() {
  const d = new Date()
  const day = d.getDay()
  const daysUntil = day === 0 ? 7 : 7 - day
  d.setDate(d.getDate() + daysUntil)
  return d.toLocaleDateString('en-NG', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}

export default function LibraryPage() {
  const { student } = useAuth()
  const [materials,   setMaterials]   = useState<Material[]>([])
  const [myRequests,  setMyRequests]  = useState<Request[]>([])
  const [loading,     setLoading]     = useState(true)
  const [toast,       setToast]       = useState('')
  const [toastType,   setToastType]   = useState<'ok'|'err'>('ok')
  const [requesting,  setRequesting]  = useState<string|null>(null)
  const [showForm,    setShowForm]    = useState<Material|null>(null)
  const [phone,       setPhone]       = useState(student?.phone || '')
  const [submitting,  setSubmitting]  = useState(false)
  const [successMat,  setSuccessMat]  = useState<Material|null>(null)

  const showToast = (m:string, t:'ok'|'err'='ok') => { setToast(m); setToastType(t); setTimeout(()=>setToast(''),4000) }

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: mats }, { data: reqs }] = await Promise.all([
      supabase.from('ministry_materials').select('*').order('sort_order').order('created_at', { ascending: false }),
      student?.idNumber
        ? supabase.from('material_requests').select('material_id,status').eq('student_id', student.idNumber)
        : { data: [] }
    ])
    setMaterials((mats as Material[]) || [])
    setMyRequests((reqs as Request[]) || [])
    setLoading(false)
  }, [student?.idNumber])

  useEffect(() => { load() }, [load])

  const submitRequest = async () => {
    if (!showForm || !student) return
    setSubmitting(true)
    const { error } = await supabase.from('material_requests').insert({
      material_id:   showForm.id,
      student_id:    student.idNumber,
      student_name:  student.name,
      student_phone: phone,
      student_email: student.email || '',
      matric_number: student.idNumber,
      status:        'pending',
    })
    setSubmitting(false)
    if (error?.code === '23505') { showToast('You already applied for this material', 'err'); setShowForm(null); return }
    if (error) { showToast('Failed to submit: ' + error.message, 'err'); return }
    const mat = showForm
    setShowForm(null)
    setSuccessMat(mat)
    load()
  }

  const myStatus = (id: string) => myRequests.find(r => r.material_id === id)?.status

  const goToChurch = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${PNEUMA_LAT},${PNEUMA_LNG}`, '_blank')
  }

  return (
    <AppShell>
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium ${toastType==='ok'?'bg-[#0a0a0a] text-white':'bg-red-600 text-white'}`}>
          <CheckCircle2 className="w-3.5 h-3.5"/> {toast}
        </div>
      )}

      {/* Pneuma Domain Hero */}
      <div className="pd-gradient px-4 pt-5 pb-5">
        <p className="text-white/60 text-[9px] font-bold tracking-widest uppercase mb-1">Pneuma Domain Ministry · MOUAU</p>
        <h1 className="text-white font-black text-2xl leading-tight mb-0.5">
          Resource<br/><span className="text-orange-300">Library</span>
        </h1>
        <p className="text-white/60 text-xs mb-4">Books, notes and materials for MOUAU students</p>

        {/* Church location card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-white"/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-xs">Pneuma Domain Ministry</p>
            <p className="text-white/60 text-[10px] truncate">{PNEUMA_ADDR}</p>
          </div>
          <button onClick={goToChurch}
            className="flex items-center gap-1.5 bg-white text-[#1e3a8a] text-[10px] font-bold px-3 py-1.5 rounded-xl flex-shrink-0">
            <Navigation2 className="w-3 h-3"/> Navigate
          </button>
        </div>
      </div>

      <div className="bg-[#f5f5f3] min-h-screen px-4 pt-4 pb-24 space-y-3">
        <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">
          {loading ? '...' : materials.length} AVAILABLE MATERIALS
        </p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#1e3a8a] animate-spin"/></div>
        ) : materials.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <BookOpen className="w-10 h-10 text-[#ddd] mb-3"/>
            <p className="font-bold text-[#0a0a0a] text-sm">No materials available yet</p>
            <p className="text-xs text-[#aaa] mt-1">Check back soon — admin adds new materials regularly</p>
          </div>
        ) : materials.map(mat => {
          const status  = myStatus(mat.id)
          const color   = TYPE_COLORS[mat.type] || '#6b6b6b'
          return (
            <div key={mat.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="h-1" style={{background:`linear-gradient(90deg,${color},${color}80)`}}/>
              {mat.image_url && (
                <div className="relative h-36 overflow-hidden">
                  <img src={mat.image_url} alt={mat.title} className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"/>
                  <span className="absolute bottom-2 left-3 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{background:color}}>{mat.type}</span>
                </div>
              )}
              <div className="p-4">
                {!mat.image_url && (
                  <span className="inline-block px-2 py-0.5 text-[9px] font-bold rounded-full text-white mb-2 uppercase" style={{background:color}}>{mat.type}</span>
                )}
                <h3 className="font-black text-[#0a0a0a] text-base leading-tight">{mat.title}</h3>
                {mat.description && <p className="text-[#6b6b6b] text-xs mt-1.5 leading-relaxed">{mat.description}</p>}

                <div className="flex items-center gap-2 mt-3">
                  {!mat.available ? (
                    <div className="flex-1 flex items-center gap-1.5 text-xs text-[#aaa]">
                      <AlertCircle className="w-3.5 h-3.5"/> Currently unavailable
                    </div>
                  ) : status === 'pending' ? (
                    <div className="flex-1 flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-2 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5"/> Applied — Come Sunday {nextSunday().split(',')[0]}
                    </div>
                  ) : status === 'approved' ? (
                    <div className="flex-1 flex items-center gap-1.5 bg-[#f0f9f4] text-[#1a6b3a] text-xs font-bold px-3 py-2 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5"/> Approved — Collect this Sunday!
                    </div>
                  ) : status === 'collected' ? (
                    <div className="flex-1 flex items-center gap-1.5 bg-[#f0f9f4] text-[#1a6b3a] text-xs font-bold px-3 py-2 rounded-xl">
                      <Package className="w-3.5 h-3.5"/> Collected ✓
                    </div>
                  ) : (
                    <button onClick={() => { setShowForm(mat); setPhone(student?.phone || '') }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                      style={{background: color}}>
                      <Download className="w-3.5 h-3.5"/> Request This Material
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => !submitting && setShowForm(null)}/>
          <div className="relative w-full max-w-md bg-white rounded-t-2xl p-5 animate-slide-up">
            <div className="w-10 h-1 bg-[#e8e8e8] rounded-full mx-auto mb-4"/>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-black text-[#0a0a0a]">Request Material</h2>
                <p className="text-xs text-[#6b6b6b] mt-0.5 line-clamp-1">{showForm.title}</p>
              </div>
              {!submitting && <button onClick={() => setShowForm(null)} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>}
            </div>

            <div className="bg-[#f0f5ff] border border-blue-100 rounded-xl p-3.5 mb-4 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#1e3a8a] flex-shrink-0 mt-0.5"/>
              <div>
                <p className="text-xs font-bold text-[#1e3a8a]">Collection: Sunday {nextSunday()}</p>
                <p className="text-[10px] text-[#6b6b6b] mt-0.5">Come to Pneuma Domain Ministry, MOUAU Campus to collect your material after the service.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Your Name</label>
                <input value={student?.name || ''} disabled className="input w-full text-sm bg-[#f9f9f7] text-[#6b6b6b]"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Matric / JAMB Number</label>
                <input value={student?.idNumber || ''} disabled className="input w-full text-sm bg-[#f9f9f7] text-[#6b6b6b] font-mono"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">WhatsApp / Phone *</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className="input w-full text-sm" placeholder="+234 800 000 0000"/>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(null)} disabled={submitting} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">Cancel</button>
              <button onClick={submitRequest} disabled={submitting || !phone.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
                style={{background: TYPE_COLORS[showForm.type] || '#1e3a8a'}}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successMat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSuccessMat(null)}/>
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 text-center animate-slide-up">
            <div className="w-16 h-16 pd-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white"/>
            </div>
            <h2 className="font-black text-[#0a0a0a] text-lg mb-2">Request Submitted! 🙌</h2>
            <p className="text-[#6b6b6b] text-sm leading-relaxed mb-4">
              Your request for <strong>{successMat.title}</strong> has been received.<br/><br/>
              Come to <strong>Pneuma Domain Ministry, MOUAU</strong> this <strong>Sunday, {nextSunday()}</strong> to collect your material after the service.
            </p>
            <button onClick={goToChurch}
              className="w-full flex items-center justify-center gap-2 py-3 pd-gradient rounded-xl text-white font-bold text-sm mb-2">
              <Navigation2 className="w-4 h-4"/> Navigate to Church
            </button>
            <button onClick={() => setSuccessMat(null)} className="w-full py-2.5 border border-[#e8e8e8] rounded-xl text-sm text-[#6b6b6b] font-semibold">
              Done
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
