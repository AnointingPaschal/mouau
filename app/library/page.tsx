'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { LIBRARY_ITEMS, LibraryItem, COLLEGES, DEPARTMENTS } from '@/lib/data'
import { addDownload, getDownloadHistory } from '@/lib/auth'
import { useSearchParams } from 'next/navigation'
import {
  BookOpen, Download, Star, Search, Filter, Upload, CheckCircle2,
  FileText, X, ChevronDown, Shield, Users, SortAsc
} from 'lucide-react'
import { Suspense } from 'react'

const TYPE_COLORS: Record<string, string> = {
  'handout': 'bg-blue-100 text-blue-700',
  'past-question': 'bg-red-100 text-red-700',
  'note': 'bg-green-100 text-green-700',
  'textbook': 'bg-purple-100 text-purple-700'
}
const TYPE_LABELS: Record<string, string> = {
  'handout':'Handout','past-question':'Past Q','note':'Notes','textbook':'Textbook'
}

function LibraryContent() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('search') || '')
  const [college, setCollege] = useState('all')
  const [level, setLevel] = useState('all')
  const [type, setType] = useState('all')
  const [sort, setSort] = useState<'downloads'|'rating'|'date'>('downloads')
  const [showUpload, setShowUpload] = useState(false)
  const [downloaded, setDownloaded] = useState<string[]>([])
  const [downloading, setDownloading] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { setDownloaded(getDownloadHistory()) }, [])

  const filtered = LIBRARY_ITEMS
    .filter(item => {
      const matchQ = !query || item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.courseCode.toLowerCase().includes(query.toLowerCase()) ||
        item.department.toLowerCase().includes(query.toLowerCase())
      const matchCollege = college === 'all' || item.college === college
      const matchLevel = level === 'all' || item.level === level
      const matchType = type === 'all' || item.type === type
      return matchQ && matchCollege && matchLevel && matchType
    })
    .sort((a, b) => {
      if (sort === 'downloads') return b.downloads - a.downloads
      if (sort === 'rating') return b.rating - a.rating
      return b.uploadedAt.localeCompare(a.uploadedAt)
    })

  const handleDownload = async (item: LibraryItem) => {
    setDownloading(item.id)
    await new Promise(r => setTimeout(r, 1500))
    addDownload(item.id)
    setDownloaded(getDownloadHistory())
    setDownloading(null)
    showToast(`${item.courseCode} downloaded successfully!`)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-mouau text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-green-300"/>
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-2xl">Study Library</h1>
            <p className="text-white/70 text-sm mt-1">{LIBRARY_ITEMS.length} materials available</p>
          </div>
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-gold text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-gold-light transition-all shadow-md">
            <Upload className="w-4 h-4"/>
            Contribute
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            {label:'Total Files', value:LIBRARY_ITEMS.length},
            {label:'Past Questions', value:LIBRARY_ITEMS.filter(i=>i.type==='past-question').length},
            {label:'Downloaded', value:downloaded.length},
          ].map(({label,value}) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-white font-black text-xl">{value}</div>
              <div className="text-white/60 text-xs">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 px-3 py-2.5">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0"/>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by title, course code, department..."
              className="flex-1 text-sm outline-none bg-transparent"/>
            {query && <button onClick={() => setQuery('')}><X className="w-4 h-4 text-gray-400"/></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`card px-3 py-2.5 flex items-center gap-1 transition-all ${showFilters ? 'bg-mouau text-white' : ''}`}>
            <Filter className="w-4 h-4"/>
          </button>
        </div>

        {/* Type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{id:'all',label:'All'},{id:'past-question',label:'Past Questions'},{id:'handout',label:'Handouts'},{id:'note',label:'Notes'},{id:'textbook',label:'Textbooks'}].map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                type===t.id ? 'bg-mouau text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-mouau-surface border border-gray-100'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="card p-4 space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">College</label>
                <select value={college} onChange={e => setCollege(e.target.value)} className="input text-sm py-2">
                  <option value="all">All Colleges</option>
                  {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Level</label>
                <select value={level} onChange={e => setLevel(e.target.value)} className="input text-sm py-2">
                  <option value="all">All Levels</option>
                  {['100','200','300','400','500'].map(l => <option key={l} value={l}>{l} Level</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Sort By</label>
                <select value={sort} onChange={e => setSort(e.target.value as any)} className="input text-sm py-2">
                  <option value="downloads">Most Downloaded</option>
                  <option value="rating">Highest Rated</option>
                  <option value="date">Most Recent</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{filtered.length} results</p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <SortAsc className="w-3.5 h-3.5"/>
            <span>{sort === 'downloads' ? 'Most downloaded' : sort === 'rating' ? 'Highest rated' : 'Recent'}</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
            <p className="font-semibold text-gray-400">No materials found</p>
            <p className="text-gray-300 text-sm mt-1">Try different search terms or filters</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-3">
            {filtered.map(item => (
              <div key={item.id} className="card card-hover p-4 animate-slide-up">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-mouau-surface rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-mouau"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className={`badge ${TYPE_COLORS[item.type]} text-[10px]`}>{TYPE_LABELS[item.type]}</span>
                      {item.verified && (
                        <span className="badge bg-green-100 text-green-700 text-[10px] flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5"/> Verified
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-mouau-dark text-sm mt-1 leading-tight">{item.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs font-mono text-mouau bg-mouau-surface px-2 py-0.5 rounded-lg">{item.courseCode}</span>
                      <span className="text-gray-400 text-xs">{item.department}</span>
                      <span className="badge bg-gray-100 text-gray-500 text-[10px]">{item.level}L</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-gold"/> {item.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3"/> {item.downloads}
                        </span>
                        <span>{item.size}</span>
                      </div>
                      <button
                        onClick={() => !downloaded.includes(item.id) && handleDownload(item)}
                        disabled={downloading === item.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          downloaded.includes(item.id)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-mouau text-white hover:bg-mouau-mid shadow-sm'
                        }`}>
                        {downloading === item.id ? (
                          <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Downloading</>
                        ) : downloaded.includes(item.id) ? (
                          <><CheckCircle2 className="w-3 h-3"/> Downloaded</>
                        ) : (
                          <><Download className="w-3 h-3"/> Download</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUpload(false)}/>
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-mouau-dark text-xl">Contribute Materials</h2>
              <button onClick={() => setShowUpload(false)} className="p-2 rounded-full bg-gray-100"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Title</label>
                <input type="text" className="input" placeholder="e.g. CSC 201 Data Structures Handout"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">College</label>
                  <select className="input text-sm py-2">
                    {COLLEGES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Level</label>
                  <select className="input text-sm py-2">
                    {['100','200','300','400','500'].map(l => <option key={l}>{l} Level</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Course Code</label>
                  <input type="text" className="input" placeholder="e.g. CSC 201"/>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Type</label>
                  <select className="input text-sm py-2">
                    <option value="handout">Handout</option>
                    <option value="past-question">Past Question</option>
                    <option value="note">Notes</option>
                    <option value="textbook">Textbook</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Upload File</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-mouau/50 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2"/>
                  <p className="text-sm text-gray-400">Click to upload PDF or document</p>
                  <p className="text-xs text-gray-300 mt-1">Max file size: 20MB</p>
                </div>
              </div>
              <button onClick={() => { showToast('Material submitted for review!'); setShowUpload(false) }}
                className="btn-primary w-full">Submit for Review</button>
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
      <TopBar title="Study Library" subtitle="Handouts, past questions & more"/>
      <Suspense fallback={<div className="p-6 text-center text-gray-400">Loading library...</div>}>
        <LibraryContent/>
      </Suspense>
    </AppShell>
  )
}
