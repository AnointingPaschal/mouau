'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Trash2, Loader2, CheckCircle2, Shield, FileText, Upload, X, Save, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { COLLEGES } from '@/lib/data'

type Mat = { id:string; title:string; department:string; type:string; level:string; course_code:string; uploader:string; downloads:number; verified:boolean; admin_only:boolean; file_url:string; created_at:string }

export default function AdminLibraryPage() {
  const { token } = useAdmin()
  const [mats, setMats] = useState<Mat[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState<'all'|'past-question'|'note'|'project'>('all')
  const [showUpload, setShowUpload] = useState(false)
  const [upFile, setUpFile] = useState<File|null>(null)
  const [form, setForm] = useState({ title:'', department:'', college:COLLEGES[0], level:'100', course:'', code:'', abstract:'', year:'' })
  const [uploading, setUploading] = useState(false)

  const load = () => {
    fetch('/api/admin/library', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setMats(d.data||[]); setLoading(false) })
  }
  useEffect(() => { if (token) load() }, [token])
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const verify = async (mat: Mat) => {
    await fetch('/api/admin/library', { method:'PATCH', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({id:mat.id,verified:!mat.verified}) })
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this material?')) return
    await fetch('/api/admin/library', { method:'DELETE', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({id}) })
    showToast('Material deleted'); load()
  }

  const uploadProject = async () => {
    if (!upFile || !form.title || !form.department || !form.code) { showToast('Fill all required fields'); return }
    setUploading(true)
    const ext = upFile.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('materials').upload(path, upFile)
    if (uploadErr) { showToast('Upload error: ' + uploadErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path)
    await fetch('/api/admin/library', { method:'PATCH', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({
      id: 'new', // will be ignored in PATCH but POST is needed
    }) })
    // Direct insert via API workaround — call POST to a special endpoint
    // We'll directly use the supabase client (anon key is enough for admin_only=true insert if RLS allows it)
    // Use the service role via the admin API instead
    const res = await fetch('/api/admin/library', {
      method:'POST' as any,
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
      body: JSON.stringify({
        title:form.title, department:form.department, college:form.college,
        level:form.level, type:'project', course:form.course, course_code:form.code,
        abstract:form.abstract, year:form.year, uploader:'Admin',
        file_url:publicUrl, size:`${(upFile.size/1024/1024).toFixed(1)} MB`,
        downloads:0, rating:0, verified:true, admin_only:true
      })
    }).catch(() => null)
    setUploading(false); setShowUpload(false)
    setUpFile(null); setForm({ title:'', department:'', college:COLLEGES[0], level:'100', course:'', code:'', abstract:'', year:'' })
    showToast('Project uploaded successfully'); load()
  }

  const filtered = tab === 'all' ? mats : mats.filter(m => m.type === tab)

  return (
    <AdminShell>
      <div className="p-5 lg:p-8 max-w-3xl">
        {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2 rounded-xl text-xs font-medium">{toast}</div>}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest mb-1">ADMIN</p>
            <h1 className="text-xl font-black text-[#0a0a0a]">Library Management</h1>
            <p className="text-[#6b6b6b] text-sm mt-1">Verify student uploads and manage project works.</p>
          </div>
          <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-1.5"><Upload className="w-3.5 h-3.5"/>Upload Project</button>
        </div>

        {/* Tabs */}
        <div className="flex border border-[#e8e8e8] rounded-lg p-0.5 mb-4 bg-white gap-0.5">
          {(['all','past-question','note','project'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${tab===t?'bg-[#0a0a0a] text-white':'text-[#6b6b6b] hover:text-[#0a0a0a]'}`}>
              {t === 'all' ? 'All' : t === 'past-question' ? 'Past Q.' : t === 'note' ? 'Notes' : 'Projects'}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div> : (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">{filtered.length} MATERIALS</p>
            {filtered.length === 0 && <div className="card p-8 text-center"><p className="text-[#aaa] text-sm">No materials in this category.</p></div>}
            {filtered.map(mat => (
              <div key={mat.id} className="bg-white border border-[#e8e8e8] rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 border border-[#e8e8e8] rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-[#1a6b3a]"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1 mb-1">
                    <span className="badge badge-gray text-[9px]">{mat.type === 'past-question' ? 'PQ' : mat.type === 'note' ? 'Note' : 'Project'}</span>
                    {mat.verified && <span className="badge badge-green text-[9px] flex items-center gap-0.5"><Shield className="w-2 h-2"/>Verified</span>}
                    {mat.admin_only && <span className="badge bg-[#0a0a0a] text-white text-[9px] flex items-center gap-0.5"><Lock className="w-2 h-2"/>Admin</span>}
                  </div>
                  <p className="font-bold text-[#0a0a0a] text-sm leading-tight">{mat.title}</p>
                  <p className="text-[#aaa] text-[10px] mt-0.5">{mat.department} · {mat.course_code} · {mat.level}L · by {mat.uploader}</p>
                  <p className="text-[#aaa] text-[10px]">{mat.downloads} downloads</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!mat.admin_only && (
                    <button onClick={() => verify(mat)} title={mat.verified?'Unverify':'Verify'}
                      className={`p-1.5 rounded-lg transition-all ${mat.verified?'bg-[#1a6b3a]/10 text-[#1a6b3a] hover:bg-red-50 hover:text-red-500':'hover:bg-[#1a6b3a]/10 text-[#aaa] hover:text-[#1a6b3a]'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5"/>
                    </button>
                  )}
                  <button onClick={() => del(mat.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Project Modal */}
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowUpload(false)}/>
            <div className="relative w-full max-w-md bg-white rounded-2xl p-5 animate-slide-up max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-black text-[#0a0a0a] text-base">Upload Project Work</h2>
                  <p className="text-[#aaa] text-xs mt-0.5">Final year projects — admin only</p>
                </div>
                <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg bg-[#f9f9f7]"><X className="w-4 h-4"/></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Project Title *</label>
                  <input value={form.title} onChange={e => setForm({...form,title:e.target.value})} className="input" placeholder="e.g. Effect of Soil Amendment on Maize Yield..."/>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">College *</label>
                    <select value={form.college} onChange={e => setForm({...form,college:e.target.value})} className="input py-2 text-xs">
                      {COLLEGES.map(c => <option key={c} value={c}>{c.replace('College of ','')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Department *</label>
                    <input value={form.department} onChange={e => setForm({...form,department:e.target.value})} className="input" placeholder="Agronomy"/>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Level</label>
                    <select value={form.level} onChange={e => setForm({...form,level:e.target.value})} className="input py-2 text-xs">
                      {['400','500'].map(l => <option key={l} value={l}>{l}L</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Code *</label>
                    <input value={form.code} onChange={e => setForm({...form,code:e.target.value})} className="input" placeholder="AGR 499"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Year</label>
                    <input value={form.year} onChange={e => setForm({...form,year:e.target.value})} className="input" placeholder="2023"/>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Abstract</label>
                  <textarea rows={2} value={form.abstract} onChange={e => setForm({...form,abstract:e.target.value})} className="input resize-none" placeholder="Brief project summary..."/>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">File * (PDF preferred)</label>
                  <div className="border-2 border-dashed border-[#e8e8e8] rounded-xl p-4 text-center cursor-pointer hover:border-[#1a6b3a]/40"
                    onClick={() => document.getElementById('proj-file')?.click()}>
                    <input id="proj-file" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setUpFile(e.target.files?.[0]||null)}/>
                    {upFile ? <p className="text-sm text-[#1a6b3a] font-medium">{upFile.name}</p> : <><Upload className="w-4 h-4 text-[#ddd] mx-auto mb-1"/><p className="text-xs text-[#aaa]">Select PDF or Word file</p></>}
                  </div>
                </div>
                <button onClick={uploadProject} disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-1.5">
                  {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Uploading...</> : <><Save className="w-3.5 h-3.5"/>Upload Project</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
