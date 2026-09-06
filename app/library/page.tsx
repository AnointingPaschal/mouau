'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { COLLEGES } from '@/lib/data'
import { getLibraryItems, uploadMaterial, incrementDownload } from '@/lib/db'
import { useAuth } from '@/components/AuthProvider'
import { useSearchParams } from 'next/navigation'
import { BookOpen, Download, Star, Search, Upload, CheckCircle2, FileText, X, Shield, Users, Loader2, Filter, Lock, BookMarked, FolderOpen, Link } from 'lucide-react'


const ALL_DEPARTMENTS = [
  'General',
  'Agronomy', 'Crop Science & Technology', 'Agricultural Extension', 'Soil Science', 'Animal Science',
  'Biochemistry', 'Computer Science', 'Microbiology', 'Chemistry', 'Mathematics', 'Physics',
  'Agricultural Engineering', 'Food Engineering', 'Electrical Engineering', 'Civil Engineering',
  'Food Science & Technology', 'Human Nutrition & Dietetics', 'Food Processing Technology',
  'Veterinary Surgery', 'Veterinary Medicine', 'Veterinary Physiology',
  'Agricultural Economics', 'Business Administration', 'Accounting', 'Economics',
  'Soil & Land Resources Management', 'Forestry & Environmental Management',
  'Fisheries & Aquaculture', 'Wildlife & Range Management',
]

type Mat = { id:string; title:string; department:string; college:string; level:string; type:string; course:string; course_code:string; abstract:string; uploader:string; year:string; downloads:number; rating:number; size:string; file_url:string; verified:boolean; admin_only:boolean; created_at:string }

const TABS = [
  { id:'past-question', label:'Past Questions', icon:FileText, desc:'Previous exam questions by course' },
  { id:'note', label:'Notes & Handouts', icon:BookMarked, desc:'Lecture notes and handouts' },
  { id:'project', label:'Project Works', icon:FolderOpen, desc:'Final year projects (admin-curated)' },
]

function LibraryContent() {
  const { student } = useAuth()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState('past-question')
  const [query, setQuery] = useState(searchParams.get('search') || '')
  const [college, setCollege] = useState('all')
  const [level, setLevel] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [materials, setMaterials] = useState<Mat[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string|null>(null)
  const [downloaded, setDownloaded] = useState<string[]>([])
  const [toast, setToast] = useState('')
  const [uploading, setUploading] = useState(false)
  const [upFile, setUpFile] = useState<File|null>(null)
  const [upForm, setUpForm] = useState({ title:'', department:'General', level:'100' })
  const [fileSource, setFileSource] = useState<'upload'|'link'>('upload')
  const [linkUrl, setLinkUrl] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await getLibraryItems({ query, college, level, type: tab })
    setMaterials((data as Mat[]) || [])
    setLoading(false)
  }, [query, college, level, tab])

  useEffect(() => { load() }, [load])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleDownload = async (item: Mat) => {
    if (!item.file_url) { showToast('No file available for this material'); return }
    setDownloading(item.id)
    await incrementDownload(item.id, item.downloads)
    setDownloaded(prev => [...prev, item.id])
    window.open(item.file_url, '_blank')
    setDownloading(null)
    showToast('File opened for download')
  }

  const handleUpload = async () => {
    if (!upForm.title || !upForm.department) {
      showToast('Please enter a title and select a department'); return
    }
    if (fileSource === 'upload' && !upFile) {
      showToast('Please select a file to upload'); return
    }
    if (fileSource === 'link' && !linkUrl.trim()) {
      showToast('Please paste a file URL'); return
    }
    setUploading(true)
    const { error } = await uploadMaterial(upFile, {
      title: upForm.title, department: upForm.department, college: '',
      level: upForm.level, type: tab, course: '', courseCode: '',
      uploader: student?.name || 'Anonymous', abstract: '', year: '',
      studentId: student?.idNumber || ''
    })
    setUploading(false)
    if (error) { showToast(`Upload failed: ${error}`); return }
    setShowUpload(false)
    setUpFile(null)
    setUpForm({ title:'', department:'General', level:'100' })
    setFileSource('upload')
    setLinkUrl('')
    showToast('Material submitted successfully!')
    load()
  }

  const currentTab = TABS.find(t => t.id === tab)!

  return (
    <div className="p-4 lg:p-5 max-w-2xl mx-auto space-y-5 animate-fade-in">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-slide-up">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/> {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <div className="section-label mb-3">STUDY LIBRARY</div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-[#0a0a0a]">Access study materials.</h1>
          {tab !== 'project' && (
            <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5"/> Contribute
            </button>
          )}
        </div>
        <p className="text-[#6b6b6b] text-sm mt-1">Student-contributed materials organized by department and course.</p>
      </div>

      {/* Tabs */}
      <div className="border border-[#e8e8e8] rounded-xl overflow-hidden">
        {TABS.map((t, i) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${i > 0 ? 'border-t border-[#e8e8e8]' : ''} ${tab===t.id?'bg-[#0a0a0a] text-white':'bg-white hover:bg-[#f9f9f7]'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tab===t.id?'bg-white/10':'bg-[#f9f9f7]'}`}>
              <t.icon className={`w-4 h-4 ${tab===t.id?'text-[#1a6b3a]':'text-[#6b6b6b]'}`} strokeWidth={2}/>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-semibold text-sm ${tab===t.id?'text-white':'text-[#0a0a0a]'}`}>{t.label}</p>
                {t.id === 'project' && <Lock className={`w-3 h-3 ${tab===t.id?'text-white/50':'text-[#aaa]'}`}/>}
              </div>
              <p className={`text-[11px] truncate ${tab===t.id?'text-white/50':'text-[#aaa]'}`}>{t.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {tab === 'project' && (
        <div className="card p-3.5 border-blue-100 bg-blue-50 flex items-start gap-2.5">
          <Lock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5"/>
          <p className="text-blue-700 text-xs leading-relaxed">Project works are uploaded and verified by MOUAU administrators only. They contain final year undergraduate projects from all departments.</p>
        </div>
      )}

      {/* Search + Filters */}
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <div className="flex-1 border border-[#e8e8e8] rounded-lg flex items-center gap-2 px-3 py-2 bg-white">
            <Search className="w-3.5 h-3.5 text-[#aaa]"/>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${currentTab.label.toLowerCase()}...`}
              className="flex-1 text-xs outline-none bg-transparent text-[#0a0a0a] placeholder-[#aaa]"/>
            {query && <button onClick={() => setQuery('')}><X className="w-3.5 h-3.5 text-[#aaa]"/></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`border rounded-lg px-3 py-2 flex items-center gap-1 text-xs transition-all ${showFilters?'bg-[#0a0a0a] text-white border-[#0a0a0a]':'border-[#e8e8e8] text-[#6b6b6b] hover:border-[#0a0a0a]'}`}>
            <Filter className="w-3.5 h-3.5"/>
          </button>
        </div>
        {showFilters && (
          <div className="card p-3.5 animate-fade-in">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1 block">College</label>
                <select value={college} onChange={e => setCollege(e.target.value)} className="input py-1.5 text-xs">
                  <option value="all">All Colleges</option>
                  {COLLEGES.map(c => <option key={c} value={c}>{c.replace('College of ','')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1 block">Level</label>
                <select value={level} onChange={e => setLevel(e.target.value)} className="input py-1.5 text-xs">
                  <option value="all">All Levels</option>
                  {['100','200','300','400','500'].map(l => <option key={l} value={l}>{l} Level</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
      ) : materials.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen className="w-8 h-8 text-[#ddd] mx-auto mb-3"/>
          <p className="font-semibold text-[#0a0a0a] text-sm">No materials found</p>
          <p className="text-[#aaa] text-xs mt-1">
            {tab === 'project' ? 'No projects uploaded yet by admins.' : 'Be the first to contribute materials for your department!'}
          </p>
          {tab !== 'project' && <button onClick={() => setShowUpload(true)} className="btn-primary mt-4 mx-auto">Upload First</button>}
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-[11px] text-[#aaa] uppercase tracking-wide font-semibold">{materials.length} MATERIALS</p>
          {materials.map(item => (
            <div key={item.id} className="card card-hover p-3.5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 border border-[#e8e8e8] rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-[#1a6b3a]"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1 mb-1">
                    {item.verified && <span className="badge badge-green text-[9px] flex items-center gap-0.5"><Shield className="w-2 h-2"/>Verified</span>}
                    {item.admin_only && <span className="badge bg-[#0a0a0a] text-white text-[9px]">Admin</span>}
                    <span className="badge badge-gray text-[9px]">{item.level}L</span>
                  </div>
                  <p className="font-bold text-[#0a0a0a] text-sm leading-tight">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.course_code && <span className="text-[10px] font-mono text-[#1a6b3a] bg-[#1a6b3a]/5 px-1.5 py-0.5 rounded">{item.course_code}</span>}
                    <span className="text-[#aaa] text-[10px]">{item.department}</span>
                  </div>
                  {item.abstract && <p className="text-[#6b6b6b] text-[10px] mt-1 line-clamp-2 leading-relaxed">{item.abstract}</p>}
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-2.5 text-[10px] text-[#aaa]">
                      {item.rating > 0 && <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-amber-400"/>{item.rating}</span>}
                      <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5"/>{item.downloads}</span>
                      {item.size && <span>{item.size}</span>}
                      {item.year && <span>{item.year}</span>}
                    </div>
                    <button onClick={() => !downloaded.includes(item.id) && handleDownload(item)} disabled={downloading === item.id || !item.file_url}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                        downloaded.includes(item.id) ? 'bg-[#1a6b3a]/10 text-[#1a6b3a]'
                        : item.file_url ? 'bg-[#0a0a0a] text-white hover:bg-[#1a6b3a]'
                        : 'bg-[#f9f9f7] text-[#aaa] cursor-not-allowed'}`}>
                      {downloading===item.id ? <Loader2 className="w-3 h-3 animate-spin"/>
                       : downloaded.includes(item.id) ? <><CheckCircle2 className="w-3 h-3"/>Done</>
                       : item.file_url ? <><Download className="w-3 h-3"/>Get</>
                       : 'No file'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowUpload(false)}/>
          <div className="relative w-full max-w-md bg-white rounded-2xl p-5 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-[#0a0a0a] text-base">Contribute Material</h2>
                <p className="text-[#aaa] text-xs mt-0.5">Upload {currentTab.label.toLowerCase()} for fellow students</p>
              </div>
              <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg bg-[#f9f9f7]"><X className="w-4 h-4"/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1 block">Title *</label>
                <input value={upForm.title} onChange={e=>setUpForm({...upForm,title:e.target.value})} className="input"
                  placeholder={tab==='past-question'?'e.g. CSC 201 Past Questions 2022':'e.g. Introduction to Agronomy Notes'}/>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1 block">Department *</label>
                <select value={upForm.department} onChange={e=>setUpForm({...upForm,department:e.target.value})} className="input py-2.5 text-sm">
                  {ALL_DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1 block">Level</label>
                <div className="flex gap-2">
                  {['100','200','300','400','500'].map(l=>(
                    <button key={l} onClick={()=>setUpForm({...upForm,level:l})}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${upForm.level===l?'bg-[#1a6b3a] text-white border-[#1a6b3a]':'border-[#e8e8e8] text-[#6b6b6b]'}`}>
                      {l}L
                    </button>
                  ))}
                </div>
              </div>
              {/* Source toggle */}
              <div>
                <label className="text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-wide mb-2 block">File Source *</label>
                <div className="flex bg-[#f9f9f7] rounded-xl p-1 gap-1 mb-3">
                  <button onClick={()=>{ setFileSource('upload'); setLinkUrl('') }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${fileSource==='upload'?'bg-white text-[#0a0a0a] shadow-sm':'text-[#aaa]'}`}>
                    <Upload className="w-3.5 h-3.5"/> Upload File
                  </button>
                  <button onClick={()=>{ setFileSource('link'); setUpFile(null) }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${fileSource==='link'?'bg-white text-[#0a0a0a] shadow-sm':'text-[#aaa]'}`}>
                    <Link className="w-3.5 h-3.5"/> Paste Link
                  </button>
                </div>

                {fileSource === 'upload' ? (
                  <div className="border-2 border-dashed border-[#e8e8e8] rounded-xl p-5 text-center cursor-pointer hover:border-[#1a6b3a]/40 transition-colors"
                    onClick={() => document.getElementById('fu')?.click()}>
                    <input id="fu" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
                      onChange={e => setUpFile(e.target.files?.[0]||null)}/>
                    {upFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#1a6b3a] flex-shrink-0"/>
                        <p className="text-sm text-[#1a6b3a] font-semibold truncate max-w-[220px]">{upFile.name}</p>
                      </div>
                    ) : (
                      <><Upload className="w-5 h-5 text-[#ddd] mx-auto mb-1.5"/><p className="text-xs text-[#aaa]">Tap to select file (PDF, Word, Image)</p></>
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={3}
                      value={linkUrl}
                      onChange={e => setLinkUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or any direct file URL"
                      className="input resize-none text-xs py-2.5 leading-relaxed"
                    />
                    <p className="text-[10px] text-[#aaa] mt-1.5 leading-relaxed">
                      Paste a direct file link — Google Drive share link, S3, Dropbox, OneDrive, Afribary, or any public URL.
                    </p>
                    {linkUrl.trim() && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a] flex-shrink-0"/>
                        <p className="text-[10px] text-[#1a6b3a] font-semibold">Link ready</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={handleUpload} disabled={uploading}
                className="btn-primary w-full flex items-center justify-center gap-1.5">
                {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Uploading...</> : 'Submit Material'}
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
      <Suspense fallback={<div className="p-4 text-center text-xs text-[#aaa]">Loading...</div>}>
        <LibraryContent/>
      </Suspense>
    </AppShell>
  )
}
