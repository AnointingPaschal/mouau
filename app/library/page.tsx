'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { COLLEGES } from '@/lib/data'
import { getLibraryItems, uploadMaterial, incrementDownload } from '@/lib/db'
import { useAuth } from '@/components/AuthProvider'
import { useSearchParams } from 'next/navigation'
import { BookOpen, Download, Star, Search, Filter, Upload, CheckCircle2, FileText, X, Shield, Users, Loader2 } from 'lucide-react'

type Material = {
  id: string; title: string; department: string; college: string; level: string
  type: string; course: string; course_code: string; uploader: string; year?: string
  downloads: number; rating: number; size: string; file_url: string; verified: boolean; created_at: string
}

const TYPE_COLORS: Record<string, string> = {
  'handout':'bg-blue-100 text-blue-700','past-question':'bg-red-100 text-red-700',
  'note':'bg-green-100 text-green-700','textbook':'bg-purple-100 text-purple-700'
}
const TYPE_LABELS: Record<string, string> = {
  'handout':'Handout','past-question':'Past Q','note':'Notes','textbook':'Textbook'
}

function LibraryContent() {
  const { student } = useAuth()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('search') || '')
  const [college, setCollege] = useState('all')
  const [level, setLevel] = useState('all')
  const [type, setType] = useState('all')
  const [sort, setSort] = useState('downloads')
  const [showFilters, setShowFilters] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string|null>(null)
  const [downloaded, setDownloaded] = useState<string[]>([])
  const [toast, setToast] = useState('')
  const [uploading, setUploading] = useState(false)

  // Upload form state
  const [upFile, setUpFile] = useState<File|null>(null)
  const [upTitle, setUpTitle] = useState('')
  const [upCollege, setUpCollege] = useState(COLLEGES[0])
  const [upDept, setUpDept] = useState('')
  const [upLevel, setUpLevel] = useState('100')
  const [upType, setUpType] = useState<'handout'|'past-question'|'note'|'textbook'>('handout')
  const [upCourse, setUpCourse] = useState('')
  const [upCode, setUpCode] = useState('')
  const [upYear, setUpYear] = useState('')

  const loadMaterials = useCallback(async () => {
    setLoading(true)
    const { data } = await getLibraryItems({ query, college, level, type, sort })
    setMaterials((data as Material[]) || [])
    setLoading(false)
  }, [query, college, level, type, sort])

  useEffect(() => { loadMaterials() }, [loadMaterials])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleDownload = async (item: Material) => {
    if (!item.file_url) return
    setDownloading(item.id)
    await incrementDownload(item.id, item.downloads)
    setDownloaded(prev => [...prev, item.id])
    window.open(item.file_url, '_blank')
    setDownloading(null)
    showToast(`${item.course_code} opened for download!`)
  }

  const handleUpload = async () => {
    if (!upFile || !upTitle || !upDept || !upCode) {
      showToast('Please fill all required fields and select a file.'); return
    }
    setUploading(true)
    const { error } = await uploadMaterial(upFile, {
      title: upTitle, department: upDept, college: upCollege, level: upLevel,
      type: upType, course: upCourse, courseCode: upCode, uploader: student?.name || 'Anonymous', year: upYear || undefined
    })
    setUploading(false)
    if (error) { showToast(`Upload failed: ${error}`); return }
    setShowUpload(false)
    showToast('Material uploaded! It will appear in the library.')
    loadMaterials()
  }

  return (
    <div className="p-3 lg:p-4 space-y-3 animate-fade-in">
      {toast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-mouau text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-1.5 text-xs animate-slide-up">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-300"/> {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-green-gradient rounded-xl p-3.5 text-white shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-white font-black text-sm">Study Library</h1>
            <p className="text-white/60 text-[10px]">{loading ? '...' : materials.length} materials available</p>
          </div>
          <button onClick={() => setShowUpload(true)} className="flex items-center gap-1 bg-gold text-white font-semibold text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-gold-light transition-all">
            <Upload className="w-3 h-3"/> Contribute
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            {label:'Total',value:materials.length},
            {label:'Past Qs',value:materials.filter(m=>m.type==='past-question').length},
            {label:'Verified',value:materials.filter(m=>m.verified).length},
          ].map(({label,value})=>(
            <div key={label} className="bg-white/10 rounded-lg p-2 text-center">
              <div className="text-white font-black text-sm">{value}</div>
              <div className="text-white/50 text-[10px]">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 bg-white rounded-lg border border-gray-100 flex items-center gap-2 px-2.5 py-2">
          <Search className="w-3.5 h-3.5 text-gray-400"/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Title, course code, dept..."
            className="flex-1 text-xs outline-none bg-transparent"/>
          {query&&<button onClick={()=>setQuery('')}><X className="w-3.5 h-3.5 text-gray-400"/></button>}
        </div>
        <button onClick={()=>setShowFilters(!showFilters)}
          className={`card px-2.5 py-2 flex items-center gap-1 text-xs transition-all ${showFilters?'bg-mouau text-white border-mouau':''}`}>
          <Filter className="w-3.5 h-3.5"/>
        </button>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {[{id:'all',l:'All'},{id:'past-question',l:'Past Questions'},{id:'handout',l:'Handouts'},{id:'note',l:'Notes'},{id:'textbook',l:'Textbooks'}].map(t=>(
          <button key={t.id} onClick={()=>setType(t.id)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
              type===t.id?'bg-mouau text-white':'bg-white text-gray-500 border border-gray-100'
            }`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-3 space-y-2 animate-fade-in">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-gray-500 mb-1 block">College</label>
              <select value={college} onChange={e=>setCollege(e.target.value)} className="input py-1.5 text-[10px]">
                <option value="all">All</option>
                {COLLEGES.map(c=><option key={c} value={c}>{c.replace('College of ','')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Level</label>
              <select value={level} onChange={e=>setLevel(e.target.value)} className="input py-1.5 text-[10px]">
                <option value="all">All</option>
                {['100','200','300','400','500'].map(l=><option key={l} value={l}>{l}L</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Sort</label>
              <select value={sort} onChange={e=>setSort(e.target.value)} className="input py-1.5 text-[10px]">
                <option value="downloads">Popular</option>
                <option value="rating">Top Rated</option>
                <option value="date">Newest</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-mouau animate-spin"/>
        </div>
      ) : materials.length === 0 ? (
        <div className="card p-8 text-center">
          <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2"/>
          <p className="font-semibold text-gray-400 text-xs">No materials found</p>
          <p className="text-gray-300 text-[10px] mt-0.5">
            {query ? 'Try different search terms' : 'Be the first to upload materials for your department!'}
          </p>
          <button onClick={()=>setShowUpload(true)} className="btn-primary mt-3 mx-auto">Upload First</button>
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map(item=>(
            <div key={item.id} className="card p-3 flex items-start gap-2.5">
              <div className="w-7 h-7 bg-mouau-surface rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-3.5 h-3.5 text-mouau"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className={`badge ${TYPE_COLORS[item.type]} text-[9px]`}>{TYPE_LABELS[item.type]}</span>
                  {item.verified&&<span className="badge bg-green-100 text-green-700 text-[9px] flex items-center gap-0.5"><Shield className="w-2 h-2"/>Verified</span>}
                  <span className="badge bg-gray-100 text-gray-500 text-[9px]">{item.level}L</span>
                </div>
                <p className="font-bold text-mouau-dark text-xs mt-0.5 leading-tight truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-mouau bg-mouau-surface px-1.5 py-0.5 rounded">{item.course_code}</span>
                  <span className="text-gray-400 text-[10px] truncate">{item.department}</span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    {item.rating>0&&<span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-gold"/> {item.rating}</span>}
                    <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5"/> {item.downloads}</span>
                    {item.size&&<span>{item.size}</span>}
                  </div>
                  <button onClick={()=>!downloaded.includes(item.id)&&handleDownload(item)} disabled={downloading===item.id||!item.file_url}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                      downloaded.includes(item.id)?'bg-green-100 text-green-700':item.file_url?'bg-mouau text-white hover:bg-mouau-mid':'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}>
                    {downloading===item.id ? <Loader2 className="w-2.5 h-2.5 animate-spin"/>
                     : downloaded.includes(item.id) ? <><CheckCircle2 className="w-2.5 h-2.5"/> Done</>
                     : item.file_url ? <><Download className="w-2.5 h-2.5"/> Get</>
                     : 'No file'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-3">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setShowUpload(false)}/>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-mouau-dark text-sm">Upload Material</h2>
              <button onClick={()=>setShowUpload(false)} className="p-1 rounded-full bg-gray-100"><X className="w-4 h-4"/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Title *</label>
                <input value={upTitle} onChange={e=>setUpTitle(e.target.value)} className="input" placeholder="e.g. CSC 201 Past Questions 2023"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-1 block">College *</label>
                  <select value={upCollege} onChange={e=>setUpCollege(e.target.value)} className="input text-[10px] py-1.5">
                    {COLLEGES.map(c=><option key={c} value={c}>{c.replace('College of ','')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Department *</label>
                  <input value={upDept} onChange={e=>setUpDept(e.target.value)} className="input" placeholder="e.g. Biochemistry"/>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Level</label>
                  <select value={upLevel} onChange={e=>setUpLevel(e.target.value)} className="input text-[10px] py-1.5">
                    {['100','200','300','400','500'].map(l=><option key={l} value={l}>{l}L</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Type</label>
                  <select value={upType} onChange={e=>setUpType(e.target.value as any)} className="input text-[10px] py-1.5">
                    <option value="handout">Handout</option>
                    <option value="past-question">Past Q</option>
                    <option value="note">Notes</option>
                    <option value="textbook">Textbook</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Year</label>
                  <input value={upYear} onChange={e=>setUpYear(e.target.value)} className="input" placeholder="2023"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Course *</label>
                  <input value={upCourse} onChange={e=>setUpCourse(e.target.value)} className="input" placeholder="e.g. Data Structures"/>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Code *</label>
                  <input value={upCode} onChange={e=>setUpCode(e.target.value)} className="input" placeholder="e.g. CSC 201"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 mb-1 block">File * (PDF, Word, Image)</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-mouau/50 transition-colors cursor-pointer"
                  onClick={()=>document.getElementById('fileInput')?.click()}>
                  <input id="fileInput" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
                    onChange={e=>setUpFile(e.target.files?.[0]||null)}/>
                  {upFile ? (
                    <p className="text-xs text-mouau font-medium">{upFile.name}</p>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-300 mx-auto mb-1"/>
                      <p className="text-[10px] text-gray-400">Tap to select file</p>
                    </>
                  )}
                </div>
              </div>
              <button onClick={handleUpload} disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-1.5">
                {uploading ? <><Loader2 className="w-3 h-3 animate-spin"/> Uploading...</> : <><Upload className="w-3 h-3"/> Submit Material</>}
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
      <TopBar title="Study Library" subtitle="Handouts, past questions & notes"/>
      <Suspense fallback={<div className="p-4 text-center text-xs text-gray-400">Loading...</div>}>
        <LibraryContent/>
      </Suspense>
    </AppShell>
  )
}
