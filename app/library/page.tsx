'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { getLibraryItems, uploadMaterial, incrementDownload } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { useSearchParams } from 'next/navigation'
import {
  BookOpen, Download, Star, Search, Upload, CheckCircle2, FileText,
  X, Loader2, BookMarked, FolderOpen, Link, Heart, Share2,
  MapPin, Navigation2, Filter, Users
} from 'lucide-react'

const ALL_DEPARTMENTS = [
  'General','Agronomy','Crop Science & Technology','Agricultural Extension','Soil Science','Animal Science',
  'Biochemistry','Computer Science','Microbiology','Chemistry','Mathematics','Physics',
  'Agricultural Engineering','Food Engineering','Electrical Engineering','Civil Engineering',
  'Food Science & Technology','Human Nutrition & Dietetics','Food Processing Technology',
  'Veterinary Surgery','Veterinary Medicine','Veterinary Physiology',
  'Agricultural Economics','Business Administration','Accounting','Economics',
  'Fisheries & Aquaculture','Forestry & Environmental Management','Wildlife & Range Management',
]

type Mat = {
  id:string; title:string; department:string; college:string; level:string; type:string;
  course:string; course_code:string; abstract:string; uploader:string; year:string;
  downloads:number; rating:number; size:string; file_url:string; verified:boolean; admin_only:boolean; created_at:string
}

const TABS = [
  { id:'past-question', label:'Past Questions', icon:FileText,   color:'#1a6b3a' },
  { id:'note',          label:'Notes',          icon:BookMarked, color:'#1e3a8a' },
  { id:'project',       label:'Projects',       icon:FolderOpen, color:'#b91c1c' },
]

function nextSunday() {
  const d = new Date()
  const daysUntil = d.getDay() === 0 ? 7 : 7 - d.getDay()
  d.setDate(d.getDate() + daysUntil)
  return d.toLocaleDateString('en-NG', { weekday:'long', day:'numeric', month:'long' })
}

const CHURCH_LAT = 5.4800
const CHURCH_LNG = 7.5455

function LibraryContent() {
  const { student } = useAuth()
  const searchParams = useSearchParams()

  const [tab,        setTab]        = useState<'past-question'|'note'|'project'>('past-question')
  const [items,      setItems]      = useState<Mat[]>([])
  const [loading,    setLoading]    = useState(true)
  const [query,      setQuery]      = useState('')
  const [level,      setLevel]      = useState('all')
  const [toast,      setToast]      = useState('')
  const [loved,      setLoved]      = useState<Record<string,boolean>>({})
  const [loveCounts, setLoveCounts] = useState<Record<string,number>>({})
  const [showUpload, setShowUpload] = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [upFile,     setUpFile]     = useState<File|null>(null)
  const [fileSource, setFileSource] = useState<'upload'|'link'>('upload')
  const [linkUrl,    setLinkUrl]    = useState('')
  const [upForm,     setUpForm]     = useState({ title:'', department:'General', level:'100' })

  // Request modal state
  const [requesting,   setRequesting]   = useState<Mat|null>(null)
  const [reqPhone,     setReqPhone]     = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [myRequests,   setMyRequests]   = useState<Set<string>>(new Set())
  const [successMat,   setSuccessMat]   = useState<Mat|null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await getLibraryItems({ query, level, type: tab })
    setItems((data as Mat[]) || [])
    setLoading(false)
  }, [query, level, tab])

  useEffect(() => { load() }, [load])

  // Load user's existing requests
  useEffect(() => {
    if (!student?.idNumber) return
    supabase.from('material_requests')
      .select('material_id').eq('student_id', student.idNumber)
      .then(({ data }) => {
        if (data) setMyRequests(new Set(data.map((r:any) => r.material_id)))
      })
  }, [student?.idNumber])

  useEffect(() => {
    try {
      const s = localStorage.getItem('lib_loved'); if(s) setLoved(JSON.parse(s))
      const c = localStorage.getItem('lib_love_counts'); if(c) setLoveCounts(JSON.parse(c))
    } catch {}
  }, [])

  const toggleLove = (item: Mat) => {
    const wasLoved = loved[item.id]
    const newLoved = { ...loved, [item.id]: !wasLoved }
    const newCounts = { ...loveCounts, [item.id]: (loveCounts[item.id] || item.rating || 0) + (wasLoved ? -1 : 1) }
    if (wasLoved) delete newLoved[item.id]
    setLoved(newLoved); setLoveCounts(newCounts)
    localStorage.setItem('lib_loved', JSON.stringify(newLoved))
    localStorage.setItem('lib_love_counts', JSON.stringify(newCounts))
  }

  const handleShare = (item: Mat) => {
    if (navigator.share) navigator.share({ title: item.title, url: item.file_url || window.location.href }).catch(() => {})
    else { navigator.clipboard?.writeText(item.file_url || window.location.href); showToast('Link copied!') }
  }

  // Submit request
  const submitRequest = async () => {
    if (!requesting || !student) return
    if (!reqPhone.trim()) { showToast('Enter your phone/WhatsApp number'); return }
    setSubmitting(true)
    const { error } = await supabase.from('material_requests').insert({
      material_id:   requesting.id,
      student_id:    student.idNumber,
      student_name:  student.name,
      student_phone: reqPhone.trim(),
      student_email: student.email || '',
      matric_number: student.idNumber,
      material_title: requesting.title,
      status: 'pending',
    })
    setSubmitting(false)
    if (error?.code === '23505') {
      showToast('You already applied for this material')
      setRequesting(null); return
    }
    if (error) { showToast('Failed: ' + error.message); return }
    const mat = requesting
    setMyRequests(prev => new Set([...prev, mat.id]))
    setRequesting(null)
    setSuccessMat(mat)
    await incrementDownload(mat.id, mat.downloads)
    load()
  }

  const handleUpload = async () => {
    if (!upForm.title || !upForm.department) { showToast('Enter title and select department'); return }
    if (fileSource === 'upload' && !upFile) { showToast('Select a file to upload'); return }
    if (fileSource === 'link' && !linkUrl.trim()) { showToast('Paste a file URL'); return }
    setUploading(true)
    if (fileSource === 'link') {
      const url = linkUrl.trim()
      const { data: existing } = await supabase.from('library_materials').select('id').eq('file_url', url).limit(1)
      if (existing && existing.length > 0) { setUploading(false); showToast('This link already exists'); return }
      await supabase.from('library_materials').insert({
        title: upForm.title, department: upForm.department, college: '',
        level: upForm.level + 'L', type: tab, course: '', course_code: '',
        uploader: student?.name || 'Anonymous', abstract: '', year: '',
        file_url: url, size: 'Link', verified: false, admin_only: false, downloads: 0, rating: 0
      })
      setUploading(false); setShowUpload(false); setLinkUrl(''); setUpFile(null)
      setUpForm({ title:'', department:'General', level:'100' }); setFileSource('upload')
      showToast('Material link saved!'); load(); return
    }
    const { error } = await uploadMaterial(upFile!, {
      title: upForm.title, department: upForm.department, college: '',
      level: upForm.level, type: tab, course: '', courseCode: '',
      uploader: student?.name || 'Anonymous', abstract: '', year: '',
      studentId: student?.idNumber || ''
    })
    setUploading(false)
    if (error) { showToast('Upload failed: ' + error); return }
    setShowUpload(false); setUpFile(null); setLinkUrl('')
    setUpForm({ title:'', department:'General', level:'100' }); setFileSource('upload')
    showToast('Material submitted!'); load()
  }

  const activeTab = TABS.find(t => t.id === tab)!

  return (
    <div className="animate-fade-in">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-slide-up">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/> {toast}
        </div>
      )}

      {/* Hero */}
      <div className="bg-[#0a0a0a] px-4 pt-5 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">Pneuma Domain · MOUAU</p>
            <h1 className="text-white font-black text-2xl leading-tight">Study<br/><span className="text-[#4ade80]">Library</span></h1>
            <p className="text-white/40 text-xs mt-1">Apply to access study materials</p>
          </div>
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 bg-[#1a6b3a] text-white text-xs font-bold px-3.5 py-2 rounded-xl mt-1">
            <Upload className="w-3.5 h-3.5"/> Contribute
          </button>
        </div>

        {/* Church location strip */}
        <div className="flex items-center gap-2.5 bg-white/10 rounded-xl px-3 py-2.5 mb-4">
          <MapPin className="w-3.5 h-3.5 text-orange-300 flex-shrink-0"/>
          <p className="text-white/60 text-[10px] flex-1">Collect materials at Pneuma Domain Ministry, MOUAU Campus</p>
          <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${CHURCH_LAT},${CHURCH_LNG}`, '_blank')}
            className="flex items-center gap-1 text-orange-300 text-[10px] font-bold flex-shrink-0">
            <Navigation2 className="w-3 h-3"/> Go
          </button>
        </div>

        {/* Type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-bold transition-all ${tab === t.id ? 'text-[#0a0a0a] bg-[#f5f5f3]' : 'text-white/50 hover:text-white/80'}`}>
              <t.icon className="w-3.5 h-3.5"/>{t.label}
              {tab === t.id && <div className="w-1.5 h-1.5 rounded-full" style={{background: t.color}}/>}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#f5f5f3] min-h-screen px-4 pt-4 pb-24 space-y-4">
        {/* Search + level filter */}
        <div className="flex items-center bg-white border-2 border-transparent rounded-2xl px-3 py-2.5 gap-2 shadow-sm focus-within:border-[#1a6b3a] transition-all">
          <Search className="w-3.5 h-3.5 text-[#aaa] flex-shrink-0"/>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${activeTab.label.toLowerCase()}...`}
            className="flex-1 text-xs outline-none bg-transparent text-[#0a0a0a] placeholder-[#bbb]"/>
          {query && <button onClick={() => setQuery('')}><X className="w-3.5 h-3.5 text-[#aaa]"/></button>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {['all','100','200','300','400','500'].map(l => (
            <button key={l} onClick={() => setLevel(l)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${level === l ? 'bg-[#0a0a0a] text-white' : 'bg-white text-[#6b6b6b] shadow-sm'}`}>
              {l === 'all' ? 'All Levels' : l + 'L'}
            </button>
          ))}
        </div>
        <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">{loading ? '...' : items.length} materials</p>

        {/* Apply-to-access notice */}
        <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-3">
          <Users className="w-4 h-4 text-[#1e3a8a] flex-shrink-0"/>
          <p className="text-xs text-[#1e3a8a] leading-snug">
            <strong>Apply to access</strong> — Request a material below. Come to Pneuma Domain Ministry this Sunday to collect.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#1a6b3a] animate-spin"/></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <activeTab.icon className="w-7 h-7 text-[#ddd]"/>
            </div>
            <p className="font-bold text-[#0a0a0a] text-sm">No {activeTab.label} yet</p>
            <button onClick={() => setShowUpload(true)} className="btn-primary mt-4 mx-auto">Contribute</button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const tabInfo = TABS.find(t => t.id === item.type) || activeTab
              const loveCount = loveCounts[item.id] ?? (item.rating > 0 ? Math.round(item.rating * 10) : 0)
              const isLoved = !!loved[item.id]
              const hasRequested = myRequests.has(item.id)

              return (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="h-1" style={{background: `linear-gradient(90deg, ${tabInfo.color}, ${tabInfo.color}88)`}}/>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                      {item.verified && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#1a6b3a]/10 text-[#1a6b3a] text-[9px] font-bold rounded-full uppercase tracking-wide">
                          <CheckCircle2 className="w-2.5 h-2.5"/> Verified
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wide text-white" style={{background: tabInfo.color}}>
                        {tabInfo.label}
                      </span>
                      <span className="px-1.5 py-0.5 bg-[#f0f0f0] text-[#6b6b6b] text-[9px] font-bold rounded-full">{item.level}</span>
                    </div>
                    <h3 className="font-black text-[#0a0a0a] text-sm leading-snug mb-1">{item.title}</h3>
                    <p className="text-xs text-[#aaa] mb-3">{item.department}{item.year ? ` · ${item.year}` : ''}</p>
                    <div className="flex items-center gap-3 mb-3 text-[11px] text-[#aaa]">
                      <span className="flex items-center gap-1"><Download className="w-3 h-3"/> {item.downloads || 0} requests</span>
                      {loveCount > 0 && <span className="flex items-center gap-1"><Heart className="w-3 h-3"/> {loveCount}</span>}
                      <span className="flex items-center gap-1">{item.uploader}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Main CTA: Apply or Already applied */}
                      {hasRequested ? (
                        <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          <CheckCircle2 className="w-3.5 h-3.5"/> Applied — Collect Sunday
                        </div>
                      ) : (
                        <button onClick={() => { setRequesting(item); setReqPhone(student?.phone || '') }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                          style={{background: tabInfo.color}}>
                          <Download className="w-3.5 h-3.5"/> Apply to Access
                        </button>
                      )}
                      {/* Love */}
                      <button onClick={() => toggleLove(item)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 ${isLoved ? 'bg-red-50' : 'bg-[#f5f5f3]'}`}>
                        <Heart className={`w-4 h-4 transition-all ${isLoved ? 'fill-red-500 text-red-500 scale-110' : 'text-[#aaa]'}`}/>
                      </button>
                      {/* Share */}
                      <button onClick={() => handleShare(item)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#f5f5f3] transition-all active:scale-90">
                        <Share2 className="w-4 h-4 text-[#aaa]"/>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Apply to Access Modal ── */}
      {requesting && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && setRequesting(null)}/>
          <div className="relative w-full max-w-md bg-white rounded-t-3xl p-5 animate-slide-up">
            <div className="w-10 h-1 bg-[#e8e8e8] rounded-full mx-auto mb-4"/>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-black text-[#0a0a0a] text-lg">Apply to Access</h2>
                <p className="text-xs text-[#6b6b6b] mt-0.5 line-clamp-1">{requesting.title}</p>
              </div>
              {!submitting && <button onClick={() => setRequesting(null)} className="p-1.5 rounded-full bg-[#f5f5f3]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>}
            </div>

            {/* Church pickup info */}
            <div className="bg-[#f0f5ff] border border-blue-100 rounded-xl p-3.5 mb-4 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#1e3a8a] flex-shrink-0 mt-0.5"/>
              <div>
                <p className="text-xs font-bold text-[#1e3a8a]">Collect on Sunday, {nextSunday()}</p>
                <p className="text-[10px] text-[#6b6b6b] mt-0.5 leading-relaxed">Come to <strong>Pneuma Domain Ministry, MOUAU Campus</strong> after the service to receive this material.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Your Name</label>
                <input value={student?.name || ''} disabled className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 text-sm bg-[#f9f9f7] text-[#6b6b6b]"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Matric / JAMB Number</label>
                <input value={student?.idNumber || ''} disabled className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 text-sm bg-[#f9f9f7] text-[#6b6b6b] font-mono"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">WhatsApp / Phone *</label>
                <input value={reqPhone} onChange={e => setReqPhone(e.target.value)}
                  className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a6b3a] transition-all"
                  placeholder="+234 800 000 0000"/>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setRequesting(null)} disabled={submitting}
                className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">Cancel</button>
              <button onClick={submitRequest} disabled={submitting || !reqPhone.trim()}
                className="flex-1 py-2.5 bg-[#1a6b3a] rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-95 transition-all">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Modal ── */}
      {successMat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSuccessMat(null)}/>
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 text-center animate-slide-up">
            <div className="w-16 h-16 bg-[#1a6b3a] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white"/>
            </div>
            <h2 className="font-black text-[#0a0a0a] text-lg mb-2">Application Submitted! 🙌</h2>
            <p className="text-[#6b6b6b] text-sm leading-relaxed mb-4">
              Your application for <strong>{successMat.title}</strong> has been received.<br/><br/>
              Come to <strong>Pneuma Domain Ministry, MOUAU</strong> this <strong>Sunday, {nextSunday()}</strong> after service to collect your material.
            </p>
            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${CHURCH_LAT},${CHURCH_LNG}`, '_blank')}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#1e3a8a] rounded-xl text-white font-bold text-sm mb-2">
              <Navigation2 className="w-4 h-4"/> Navigate to Pneuma Domain
            </button>
            <button onClick={() => setSuccessMat(null)} className="w-full py-2.5 border border-[#e8e8e8] rounded-xl text-sm text-[#6b6b6b] font-semibold">
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── Contribute Modal ── */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !uploading && setShowUpload(false)}/>
          <div className="relative w-full max-w-md bg-white rounded-t-3xl p-5 animate-slide-up max-h-[92vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#e8e8e8] rounded-full mx-auto mb-4"/>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black text-[#0a0a0a] text-lg">Contribute</h2>
                <p className="text-xs text-[#aaa] mt-0.5">Share {activeTab.label.toLowerCase()} with fellow students</p>
              </div>
              {!uploading && <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-full bg-[#f5f5f3]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>}
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5 block">Title *</label>
                <input value={upForm.title} onChange={e => setUpForm({...upForm, title: e.target.value})} className="w-full border-2 border-[#f0f0f0] rounded-xl px-3 py-3 text-sm outline-none focus:border-[#1a6b3a] transition-colors"
                  placeholder={tab === 'past-question' ? 'e.g. CSC 201 Past Questions 2023' : 'e.g. Introduction to Agronomy Notes'}/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5 block">Department *</label>
                <select value={upForm.department} onChange={e => setUpForm({...upForm, department: e.target.value})}
                  className="w-full border-2 border-[#f0f0f0] rounded-xl px-3 py-3 text-sm outline-none focus:border-[#1a6b3a] transition-colors appearance-none bg-white">
                  {ALL_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5 block">Level</label>
                <div className="flex gap-2">
                  {['100','200','300','400','500'].map(l => (
                    <button key={l} onClick={() => setUpForm({...upForm, level: l})}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${upForm.level === l ? 'border-[#1a6b3a] bg-[#1a6b3a] text-white' : 'border-[#f0f0f0] text-[#6b6b6b]'}`}>
                      {l}L
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5 block">File Source *</label>
                <div className="flex bg-[#f5f5f3] rounded-xl p-1 gap-1 mb-3">
                  <button onClick={() => { setFileSource('upload'); setLinkUrl('') }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${fileSource === 'upload' ? 'bg-white text-[#0a0a0a] shadow-sm' : 'text-[#aaa]'}`}>
                    <Upload className="w-3.5 h-3.5"/> Upload File
                  </button>
                  <button onClick={() => { setFileSource('link'); setUpFile(null) }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${fileSource === 'link' ? 'bg-white text-[#0a0a0a] shadow-sm' : 'text-[#aaa]'}`}>
                    <Link className="w-3.5 h-3.5"/> Paste Link
                  </button>
                </div>
                {fileSource === 'upload' ? (
                  <div className="border-2 border-dashed border-[#e8e8e8] rounded-xl p-5 text-center cursor-pointer hover:border-[#1a6b3a]/40 transition-colors"
                    onClick={() => document.getElementById('fu')?.click()}>
                    <input id="fu" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
                      onChange={e => setUpFile(e.target.files?.[0] || null)}/>
                    {upFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#1a6b3a]"/>
                        <p className="text-sm text-[#1a6b3a] font-semibold truncate max-w-[220px]">{upFile.name}</p>
                      </div>
                    ) : (
                      <><Upload className="w-5 h-5 text-[#ddd] mx-auto mb-1.5"/><p className="text-xs text-[#aaa]">Tap to select file</p></>
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea rows={3} value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or any file URL"
                      className="w-full border-2 border-[#f0f0f0] rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#1a6b3a] transition-colors resize-none leading-relaxed"/>
                    {linkUrl.trim() && <div className="flex items-center gap-1.5 mt-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/><p className="text-[10px] text-[#1a6b3a] font-bold">Link ready</p></div>}
                  </div>
                )}
              </div>
              <button onClick={handleUpload} disabled={uploading}
                className="w-full py-3.5 rounded-xl text-sm font-black text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{background: uploading ? '#aaa' : activeTab.color}}>
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin"/> Submitting...</> : 'Submit Material'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LibraryPage() {
  return (
    <AppShell>
      <TopBar title="Study Library" subtitle="Past questions, notes & project works"/>
      <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-[#1a6b3a] animate-spin"/></div>}>
        <LibraryContent/>
      </Suspense>
    </AppShell>
  )
}
