'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Trash2, Loader2, CheckCircle2, Upload, X, Save, Users, Edit2, Eye, EyeOff, Plus, Link as LinkIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Mat = {
  id:string; title:string; department:string; type:string; level:string
  description:string; uploader:string; downloads:number; verified:boolean
  admin_only:boolean; file_url:string; image_url:string; created_at:string
}
type Req = { id:string; student_name:string; student_phone:string; matric_number:string; student_email:string; status:string; created_at:string }

const TABS  = ['all','past-question','note','project']
const TYPES = ['past-question','note','project']
const TYPE_LABELS: Record<string,string> = { 'past-question':'Past Q', note:'Note', project:'Project' }
const STATUS_COLORS: Record<string,string> = { pending:'#d97706', approved:'#1a6b3a', collected:'#6b6b6b', cancelled:'#dc2626' }

const ALL_DEPARTMENTS = [
  'General','Agronomy','Crop Science & Technology','Agricultural Extension','Soil Science','Animal Science',
  'Biochemistry','Computer Science','Microbiology','Chemistry','Mathematics','Physics',
  'Agricultural Engineering','Food Engineering','Electrical Engineering','Civil Engineering',
  'Food Science & Technology','Human Nutrition & Dietetics','Food Processing Technology',
  'Veterinary Surgery','Veterinary Medicine','Veterinary Physiology',
  'Agricultural Economics','Business Administration','Accounting','Economics',
  'Fisheries & Aquaculture','Forestry & Environmental Management','Wildlife & Range Management',
]

export default function AdminLibraryPage() {
  const { token } = useAdmin()
  const [mats,      setMats]      = useState<Mat[]>([])
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState('')
  const [tab,       setTab]       = useState('all')
  const [saving,    setSaving]    = useState(false)

  // Add/Edit form
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState<Mat|null>(null)
  const [fileMode,  setFileMode]  = useState<'upload'|'link'>('link')
  const [upFile,    setUpFile]    = useState<File|null>(null)
  const [uploading, setUploading] = useState(false)
  const [form,      setForm]      = useState({
    title:'', department:'General', type:'past-question',
    level:'100', description:'', file_url:'', image_url:'',
    available: true
  })

  // Requests viewer
  const [viewReqs,   setViewReqs]   = useState<string|null>(null)
  const [requests,   setRequests]   = useState<Req[]>([])
  const [reqLoading, setReqLoading] = useState(false)

  const h = { Authorization: `Bearer ${token}` }
  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3000) }

  const load = () => {
    fetch('/api/admin/library', { headers: h })
      .then(r=>r.json()).then(d=>{ setMats(d.data||[]); setLoading(false) })
  }
  useEffect(()=>{ if(token) load() },[token])

  const openAdd = () => {
    setEditing(null)
    setForm({ title:'', department:'General', type:'past-question', level:'100', description:'', file_url:'', image_url:'', available:true })
    setUpFile(null); setFileMode('link')
    setShowForm(true)
  }

  const openEdit = (mat:Mat) => {
    setEditing(mat)
    setForm({ title:mat.title, department:mat.department, type:mat.type, level:mat.level.replace('L',''), description:mat.description||'', file_url:mat.file_url||'', image_url:mat.image_url||'', available:mat.verified })
    setFileMode('link'); setUpFile(null)
    setShowForm(true)
  }

  const save = async () => {
    if (!form.title.trim()) { showToast('Title is required'); return }
    if (!editing && fileMode==='upload' && !upFile) { showToast('Select a file to upload'); return }
    if (!editing && fileMode==='link' && !form.file_url.trim()) { showToast('Enter a file URL'); return }
    setSaving(true)

    let fileUrl = form.file_url.trim()
    let fileSize = ''

    if (fileMode==='upload' && upFile) {
      setUploading(true)
      const ext = upFile.name.split('.').pop()
      const path = `library/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('materials').upload(path, upFile)
      if (upErr) { showToast('Upload error: '+upErr.message); setSaving(false); setUploading(false); return }
      const { data:{ publicUrl } } = supabase.storage.from('materials').getPublicUrl(path)
      fileUrl = publicUrl
      fileSize = `${(upFile.size/1024/1024).toFixed(1)} MB`
      setUploading(false)
    }

    const payload = {
      title:       form.title.trim(),
      department:  form.department,
      type:        form.type,
      level:       form.level + 'L',
      description: form.description,
      image_url:   form.image_url.trim(),
      verified:    form.available,
      uploader:    'Admin',
      admin_only:  false,
      file_url:    fileUrl,
      size:        fileSize || (editing?.file_url ? '' : 'Link'),
      downloads:   0, rating: 0,
    }

    if (editing) {
      await supabase.from('library_materials').update({
        title: payload.title, department: payload.department, type: payload.type,
        level: payload.level, description: payload.description,
        image_url: payload.image_url, verified: payload.verified,
        file_url: fileUrl || editing.file_url,
      }).eq('id', editing.id)
      showToast('Material updated')
    } else {
      await fetch('/api/admin/library', {
        method:'POST', headers:{...h,'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      })
      showToast('Material added')
    }
    setSaving(false); setShowForm(false); load()
  }

  const del = async (id:string) => {
    if (!confirm('Delete this material?')) return
    await fetch('/api/admin/library', { method:'DELETE', headers:{...h,'Content-Type':'application/json'}, body:JSON.stringify({id}) })
    showToast('Deleted'); load()
  }

  const toggleAvail = async (mat:Mat) => {
    await fetch('/api/admin/library', { method:'PATCH', headers:{...h,'Content-Type':'application/json'}, body:JSON.stringify({id:mat.id,verified:!mat.verified}) })
    load()
  }

  const loadRequests = async (matId:string) => {
    setViewReqs(matId); setReqLoading(true)
    const { data } = await supabase.from('material_requests').select('*').eq('material_id', matId).order('created_at',{ascending:false})
    setRequests((data as Req[])||[]); setReqLoading(false)
  }

  const updateReqStatus = async (id:string, status:string) => {
    await supabase.from('material_requests').update({status}).eq('id',id)
    if (viewReqs) loadRequests(viewReqs)
  }

  const filtered = tab==='all' ? mats : mats.filter(m=>m.type===tab)

  return (
    <AdminShell>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-slide-up">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/> {toast}
        </div>
      )}

      <div className="p-4 w-full pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
            <h1 className="font-black text-[#0a0a0a] text-2xl">Library</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">{mats.length} materials · {mats.filter(m=>m.verified).length} available</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#1a6b3a] text-white text-xs font-bold px-3.5 py-2 rounded-xl">
            <Plus className="w-3.5 h-3.5"/> Add Material
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#f9f9f7] rounded-xl p-1 gap-1">
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab===t?'bg-white text-[#0a0a0a] shadow-sm':'text-[#aaa]'}`}>
              {t==='all'?'All':TYPE_LABELS[t]||t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : filtered.length===0 ? (
          <div className="card p-10 text-center"><p className="text-sm text-[#aaa]">No materials yet</p><button onClick={openAdd} className="btn-primary mt-3 mx-auto">Add First Material</button></div>
        ) : (
          <div className="space-y-2">
            {filtered.map(mat=>(
              <div key={mat.id} className={`card p-3.5 ${!mat.verified?'opacity-60':''}`}>
                <div className="flex items-start gap-3">
                  {mat.image_url && <img src={mat.image_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0"/>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-[#0a0a0a] text-sm truncate flex-1">{mat.title}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${mat.verified?'bg-[#1a6b3a]/10 text-[#1a6b3a]':'bg-[#f0f0f0] text-[#aaa]'}`}>
                        {mat.verified?'Available':'Hidden'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#f0f0f0] text-[#6b6b6b] capitalize">{TYPE_LABELS[mat.type]||mat.type}</span>
                      <span className="text-[9px] text-[#aaa]">{mat.department}</span>
                      <span className="text-[9px] text-[#aaa]">{mat.level}</span>
                    </div>
                    {mat.description && <p className="text-[10px] text-[#6b6b6b] mt-1 line-clamp-1">{mat.description}</p>}
                    <p className="text-[9px] text-[#aaa] mt-0.5">by {mat.uploader} · {mat.downloads} requests</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {/* View requests */}
                    <button onClick={()=>loadRequests(mat.id)} className="p-1.5 rounded-lg hover:bg-purple-50 text-[#aaa] hover:text-purple-500 transition-all" title="View requests">
                      <Users className="w-3.5 h-3.5"/>
                    </button>
                    {/* Available toggle */}
                    <button onClick={()=>toggleAvail(mat)} className={`p-1.5 rounded-lg transition-all ${mat.verified?'hover:bg-amber-50 hover:text-amber-500':'hover:bg-[#1a6b3a]/10 hover:text-[#1a6b3a]'} text-[#aaa]`} title={mat.verified?'Hide':'Make Available'}>
                      {mat.verified?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}
                    </button>
                    {/* Edit */}
                    <button onClick={()=>openEdit(mat)} className="p-1.5 rounded-lg hover:bg-blue-50 text-[#aaa] hover:text-blue-500 transition-all">
                      <Edit2 className="w-3.5 h-3.5"/>
                    </button>
                    {/* Delete */}
                    <button onClick={()=>del(mat.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500 transition-all">
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add/Edit Form ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>!saving&&setShowForm(false)}/>
          <div className="relative w-full max-w-md bg-white rounded-t-2xl p-5 animate-slide-up max-h-[92vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#e8e8e8] rounded-full mx-auto mb-4"/>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-[#0a0a0a]">{editing?'Edit Material':'Add Material'}</h2>
              {!saving&&<button onClick={()=>setShowForm(false)} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Title *</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="input w-full text-sm" placeholder="e.g. CSC 201 Past Questions 2023"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5 block">Type</label>
                <div className="flex gap-2">
                  {TYPES.map(t=>(
                    <button key={t} onClick={()=>setForm(f=>({...f,type:t}))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${form.type===t?'bg-[#1a6b3a] text-white border-[#1a6b3a]':'border-[#e8e8e8] text-[#6b6b6b]'}`}>
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Department</label>
                <select value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} className="input w-full text-sm">
                  {ALL_DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5 block">Level</label>
                <div className="flex gap-1.5">
                  {['100','200','300','400','500'].map(l=>(
                    <button key={l} onClick={()=>setForm(f=>({...f,level:l}))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${form.level===l?'bg-[#1a6b3a] text-white border-[#1a6b3a]':'border-[#e8e8e8] text-[#6b6b6b]'}`}>
                      {l}L
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Description</label>
                <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="input w-full resize-none text-sm" placeholder="Optional description"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Cover Image URL (optional)</label>
                <input value={form.image_url} onChange={e=>setForm(f=>({...f,image_url:e.target.value}))} className="input w-full text-sm" placeholder="https://..."/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5 block">File Source</label>
                <div className="flex bg-[#f9f9f7] rounded-xl p-1 gap-1 mb-2">
                  <button onClick={()=>setFileMode('link')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${fileMode==='link'?'bg-white text-[#0a0a0a] shadow-sm':'text-[#aaa]'}`}>
                    <LinkIcon className="w-3.5 h-3.5"/> Paste Link
                  </button>
                  <button onClick={()=>setFileMode('upload')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${fileMode==='upload'?'bg-white text-[#0a0a0a] shadow-sm':'text-[#aaa]'}`}>
                    <Upload className="w-3.5 h-3.5"/> Upload File
                  </button>
                </div>
                {fileMode==='link' ? (
                  <textarea rows={2} value={form.file_url} onChange={e=>setForm(f=>({...f,file_url:e.target.value}))} className="input w-full resize-none text-xs leading-relaxed" placeholder="https://drive.google.com/... or any file URL"/>
                ) : (
                  <div className="border-2 border-dashed border-[#e8e8e8] rounded-xl p-4 text-center cursor-pointer hover:border-[#1a6b3a]/40 transition-colors" onClick={()=>document.getElementById('af')?.click()}>
                    <input id="af" type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="hidden" onChange={e=>setUpFile(e.target.files?.[0]||null)}/>
                    {upFile?(<div className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#1a6b3a]"/><p className="text-sm text-[#1a6b3a] font-semibold truncate max-w-[200px]">{upFile.name}</p></div>):(
                      <><Upload className="w-5 h-5 text-[#ddd] mx-auto mb-1.5"/><p className="text-xs text-[#aaa]">Tap to select file</p></>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-[#f9f9f7] rounded-xl">
                <div><p className="text-sm font-semibold text-[#0a0a0a]">Available to students</p><p className="text-[10px] text-[#aaa]">Students can see and request this material</p></div>
                <button onClick={()=>setForm(f=>({...f,available:!f.available}))}
                  className={`w-11 h-6 rounded-full transition-all relative ${form.available?'bg-[#1a6b3a]':'bg-[#e8e8e8]'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${form.available?'left-5':'left-0.5'}`}/>
                </button>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={()=>setShowForm(false)} disabled={saving} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">Cancel</button>
                <button onClick={save} disabled={saving||uploading} className="flex-1 py-2.5 bg-[#1a6b3a] rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  {saving||uploading?<><Loader2 className="w-3.5 h-3.5 animate-spin"/>{uploading?'Uploading...':'Saving...'}</>:<><Save className="w-3.5 h-3.5"/>{editing?'Update':'Add Material'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Requests Side Sheet ── */}
      {viewReqs && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setViewReqs(null)}/>
          <div className="relative w-full max-w-md bg-white rounded-t-2xl p-5 animate-slide-up max-h-[80vh] flex flex-col">
            <div className="w-10 h-1 bg-[#e8e8e8] rounded-full mx-auto mb-4"/>
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div><h2 className="font-black text-[#0a0a0a]">Student Requests</h2><p className="text-xs text-[#aaa]">{requests.length} total</p></div>
              <button onClick={()=>setViewReqs(null)} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {reqLoading?(<div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#1a6b3a]"/></div>):
              requests.length===0?(<div className="text-center py-8 text-sm text-[#aaa]">No requests for this material yet</div>):
              requests.map(r=>(
                <div key={r.id} className="card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0a0a0a] text-sm">{r.student_name}</p>
                      <p className="text-[10px] font-mono text-[#aaa]">{r.matric_number}</p>
                      {r.student_phone&&<p className="text-[10px] text-[#6b6b6b] mt-0.5">📞 {r.student_phone}</p>}
                      {r.student_email&&<p className="text-[10px] text-[#6b6b6b]">✉️ {r.student_email}</p>}
                      <p className="text-[9px] text-[#aaa] mt-0.5">{new Date(r.created_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full capitalize"
                        style={{background:STATUS_COLORS[r.status]+'20',color:STATUS_COLORS[r.status]}}>
                        {r.status}
                      </span>
                      <select value={r.status} onChange={e=>updateReqStatus(r.id,e.target.value)}
                        className="text-[9px] border border-[#e8e8e8] rounded-lg px-1.5 py-1 outline-none bg-white">
                        {['pending','approved','collected','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
