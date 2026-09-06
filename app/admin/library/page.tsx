'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Trash2, Loader2, CheckCircle2, Shield, FileText, Upload, X, Save, Lock, Link as LinkIcon, Edit2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { COLLEGES } from '@/lib/data'

type Mat = {
  id: string; title: string; department: string; type: string; level: string
  course_code: string; uploader: string; downloads: number; verified: boolean
  admin_only: boolean; file_url: string; created_at: string
}

const EMPTY_FORM = {
  title: '', department: '', college: COLLEGES[0], level: '400',
  course: '', code: '', abstract: '', year: ''
}

export default function AdminLibraryPage() {
  const { token } = useAdmin()
  const [mats, setMats] = useState<Mat[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState<'all' | 'past-question' | 'note' | 'project'>('all')
  const [showUpload, setShowUpload] = useState(false)
  const [editMat,    setEditMat]    = useState<Mat|null>(null)
  const [editForm,   setEditForm]   = useState({ title:'', department:'', level:'', file_url:'' })
  const [saving,     setSaving]     = useState(false)
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [upFile, setUpFile] = useState<File | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [uploading, setUploading] = useState(false)

  const h = { Authorization: `Bearer ${token}` }

  const load = () => {
    fetch('/api/admin/library', { headers: h })
      .then(r => r.json()).then(d => { setMats(d.data || []); setLoading(false) })
  }
  useEffect(() => { if (token) load() }, [token])

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }

  const verify = async (mat: Mat) => {
    await fetch('/api/admin/library', {
      method: 'PATCH',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: mat.id, verified: !mat.verified })
    })
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this material permanently?')) return
    await fetch('/api/admin/library', {
      method: 'DELETE',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    showToast('Material deleted'); load()
  }

  const uploadProject = async () => {
    if (!form.title || !form.department || !form.code) {
      showToast('Fill all required fields (Title, Department, Code)'); return
    }
    if (uploadMode === 'file' && !upFile) { showToast('Select a file to upload'); return }
    if (uploadMode === 'url' && !urlInput.trim()) { showToast('Enter a file URL'); return }

    setUploading(true)
    let fileUrl = urlInput.trim()
    let fileSize = ''

    if (uploadMode === 'file' && upFile) {
      const ext = upFile.name.split('.').pop()
      const path = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('materials').upload(path, upFile)
      if (uploadErr) {
        showToast('Upload error: ' + uploadErr.message)
        setUploading(false); return
      }
      const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path)
      fileUrl = publicUrl
      fileSize = `${(upFile.size / 1024 / 1024).toFixed(1)} MB`
    }

    const res = await fetch('/api/admin/library', {
      method: 'POST',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title, department: form.department, college: form.college,
        level: form.level, type: 'project', course: form.course,
        course_code: form.code, abstract: form.abstract, year: form.year,
        uploader: 'Admin', file_url: fileUrl, size: fileSize,
        downloads: 0, rating: 0, verified: true, admin_only: true
      })
    })

    setUploading(false)
    if (!res.ok) { showToast('Failed to save project'); return }
    setShowUpload(false)
    setUpFile(null); setUrlInput('')
    setForm(EMPTY_FORM)
    showToast('Project work added successfully!')
    load()
  }

  const filtered = tab === 'all' ? mats : mats.filter(m => m.type === tab)

  const openEdit = (mat: Mat) => {
    setEditMat(mat)
    setEditForm({ title: mat.title, department: mat.department, level: mat.level.replace('L',''), file_url: mat.file_url || '' })
  }

  const saveEdit = async () => {
    if (!editMat || !editForm.title.trim()) return
    setSaving(true)
    await supabase.from('library_materials').update({
      title: editForm.title.trim(),
      department: editForm.department.trim(),
      level: editForm.level + (editForm.level.endsWith('L') ? '' : 'L'),
      file_url: editForm.file_url.trim(),
    }).eq('id', editMat.id)
    setSaving(false)
    setEditMat(null)
    showToast('Material updated'); load()
  }

  return (
    <AdminShell>
      <div className="p-5 lg:p-8 max-w-3xl">
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl text-xs font-medium animate-slide-up shadow-xl">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest mb-1">ADMIN</p>
            <h1 className="text-xl font-black text-[#0a0a0a]">Library Management</h1>
            <p className="text-[#6b6b6b] text-sm mt-1">Verify student uploads and manage project works.</p>
          </div>
          <button onClick={() => { setShowUpload(true); setUploadMode('file'); setForm(EMPTY_FORM); setUpFile(null); setUrlInput('') }}
            className="btn-primary flex items-center gap-1.5 flex-shrink-0">
            <Upload className="w-3.5 h-3.5"/> Add Project
          </button>
        </div>

        {/* Type tabs */}
        <div className="flex border border-[#e8e8e8] rounded-xl p-0.5 mb-4 bg-white gap-0.5">
          {(['all', 'past-question', 'note', 'project'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t ? 'bg-[#0a0a0a] text-white' : 'text-[#6b6b6b] hover:text-[#0a0a0a]'}`}>
              {t === 'all' ? 'All' : t === 'past-question' ? 'Past Q.' : t === 'note' ? 'Notes' : 'Projects'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">{filtered.length} MATERIALS</p>
            {filtered.length === 0 && (
              <div className="card p-8 text-center">
                <p className="text-[#aaa] text-sm">No materials in this category.</p>
              </div>
            )}
            {filtered.map(mat => (
              <div key={mat.id} className="bg-white border border-[#e8e8e8] rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 border border-[#e8e8e8] rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-[#1a6b3a]"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1 mb-1">
                    <span className="badge badge-gray text-[9px]">
                      {mat.type === 'past-question' ? 'Past Q' : mat.type === 'note' ? 'Note' : 'Project'}
                    </span>
                    {mat.verified && (
                      <span className="badge badge-green text-[9px] flex items-center gap-0.5">
                        <Shield className="w-2 h-2"/>Verified
                      </span>
                    )}
                    {mat.admin_only && (
                      <span className="badge bg-[#0a0a0a] text-white text-[9px] flex items-center gap-0.5">
                        <Lock className="w-2 h-2"/>Admin
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-[#0a0a0a] text-sm leading-tight">{mat.title}</p>
                  <p className="text-[#aaa] text-[10px] mt-0.5">
                    {mat.department} · {mat.course_code} · {mat.level}L · by {mat.uploader}
                  </p>
                  <p className="text-[#aaa] text-[10px]">{mat.downloads} downloads</p>
                  {mat.file_url && (
                    <a href={mat.file_url} target="_blank" rel="noopener noreferrer"
                      className="text-[#1a6b3a] text-[10px] hover:underline truncate block mt-0.5">
                      {mat.file_url.length > 50 ? mat.file_url.slice(0, 50) + '…' : mat.file_url}
                    </a>
                  )}
                </div>
                <div className="flex items-start gap-1.5 flex-shrink-0">
                  {!mat.admin_only && (
                    <button onClick={() => verify(mat)} title={mat.verified ? 'Unverify' : 'Verify'}
                      className={`p-1.5 rounded-lg transition-all ${mat.verified
                        ? 'bg-[#1a6b3a]/10 text-[#1a6b3a] hover:bg-red-50 hover:text-red-500'
                        : 'hover:bg-[#1a6b3a]/10 text-[#aaa] hover:text-[#1a6b3a]'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5"/>
                    </button>
                  )}
                  <button onClick={() => openEdit(mat)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-[#aaa] hover:text-blue-500 transition-all" title="Edit">
                    <Edit2 className="w-3.5 h-3.5"/>
                  </button>
                  <button onClick={() => del(mat.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500 transition-all">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Project Modal */}
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => !uploading && setShowUpload(false)}/>
            <div className="relative w-full max-w-md bg-white rounded-2xl animate-slide-up max-h-[92vh] overflow-y-auto">

              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8] sticky top-0 bg-white rounded-t-2xl">
                <div>
                  <h2 className="font-black text-[#0a0a0a] text-base">Add Project Work</h2>
                  <p className="text-[#aaa] text-xs mt-0.5">Final year projects — admin only</p>
                </div>
                {!uploading && (
                  <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg bg-[#f9f9f7]">
                    <X className="w-4 h-4 text-[#6b6b6b]"/>
                  </button>
                )}
              </div>

              <div className="p-5 space-y-4">
                {/* Upload mode toggle */}
                <div>
                  <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-2 block">File Source</label>
                  <div className="flex border border-[#e8e8e8] rounded-lg p-0.5 bg-[#f9f9f7] gap-0.5">
                    <button onClick={() => setUploadMode('file')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${uploadMode === 'file' ? 'bg-white text-[#0a0a0a] shadow-sm border border-[#e8e8e8]' : 'text-[#aaa] hover:text-[#6b6b6b]'}`}>
                      <Upload className="w-3.5 h-3.5"/> Upload File
                    </button>
                    <button onClick={() => setUploadMode('url')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${uploadMode === 'url' ? 'bg-white text-[#0a0a0a] shadow-sm border border-[#e8e8e8]' : 'text-[#aaa] hover:text-[#6b6b6b]'}`}>
                      <LinkIcon className="w-3.5 h-3.5"/> Paste URL
                    </button>
                  </div>
                </div>

                {/* File or URL input */}
                {uploadMode === 'file' ? (
                  <div>
                    <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1.5 block">
                      File * (PDF preferred)
                    </label>
                    <div className="border-2 border-dashed border-[#e8e8e8] rounded-xl p-5 text-center cursor-pointer hover:border-[#1a6b3a]/40 transition-colors"
                      onClick={() => document.getElementById('proj-file')?.click()}>
                      <input id="proj-file" type="file" accept=".pdf,.doc,.docx" className="hidden"
                        onChange={e => setUpFile(e.target.files?.[0] || null)}/>
                      {upFile ? (
                        <div>
                          <p className="text-sm text-[#1a6b3a] font-semibold">{upFile.name}</p>
                          <p className="text-[#aaa] text-xs mt-0.5">{(upFile.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-5 h-5 text-[#ddd] mx-auto mb-1.5"/>
                          <p className="text-xs text-[#aaa]">Tap to select PDF or Word file</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1.5 block">
                      File URL *
                    </label>
                    <input value={urlInput} onChange={e => setUrlInput(e.target.value)} className="input"
                      placeholder="https://drive.google.com/... or any public file link"/>
                    <p className="text-[10px] text-[#aaa] mt-1.5 leading-relaxed">
                      Paste a direct download URL — Google Drive (use share link with direct download), OneDrive, Dropbox, or any public URL.
                    </p>
                    {urlInput && (
                      <div className="mt-2 p-2.5 bg-[#1a6b3a]/5 rounded-lg border border-[#1a6b3a]/20 flex items-center gap-2">
                        <LinkIcon className="w-3.5 h-3.5 text-[#1a6b3a] flex-shrink-0"/>
                        <p className="text-[#1a6b3a] text-[10px] truncate font-medium">{urlInput}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Project details */}
                <div>
                  <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1.5 block">Project Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input"
                    placeholder="e.g. Effect of Soil Amendment on Maize Yield in South-East Nigeria"/>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1.5 block">College *</label>
                    <select value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} className="input py-2 text-xs">
                      {COLLEGES.map(c => <option key={c} value={c}>{c.replace('College of ', '')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1.5 block">Department *</label>
                    <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="input"
                      placeholder="Agronomy"/>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1.5 block">Level</label>
                    <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className="input py-2 text-xs">
                      {['300', '400', '500'].map(l => <option key={l} value={l}>{l}L</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1.5 block">Code *</label>
                    <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="input"
                      placeholder="AGR 499"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1.5 block">Year</label>
                    <input value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="input"
                      placeholder="2023"/>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1.5 block">Abstract / Summary</label>
                  <textarea rows={2} value={form.abstract} onChange={e => setForm({ ...form, abstract: e.target.value })}
                    className="input resize-none" placeholder="Brief description of the project..."/>
                </div>

                <button onClick={uploadProject} disabled={uploading}
                  className="btn-primary w-full flex items-center justify-center gap-1.5">
                  {uploading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin"/>
                      {uploadMode === 'file' ? 'Uploading file...' : 'Saving...'}
                    </>
                  ) : (
                    <><Save className="w-3.5 h-3.5"/>
                      {uploadMode === 'file' ? 'Upload & Save Project' : 'Save Project with URL'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Edit Modal */}
      {editMat && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>!saving&&setEditMat(null)}/>
          <div className="relative w-full max-w-md bg-white rounded-t-2xl p-5 animate-slide-up" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-[#0a0a0a]">Edit Material</h3>
                <p className="text-[10px] text-[#aaa] mt-0.5">by {editMat.uploader}</p>
              </div>
              {!saving && <button onClick={()=>setEditMat(null)} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Title *</label>
                <input value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))}
                  className="input text-sm" placeholder="Material title"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Department</label>
                  <input value={editForm.department} onChange={e=>setEditForm(f=>({...f,department:e.target.value}))}
                    className="input text-sm" placeholder="e.g. General"/>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Level</label>
                  <select value={editForm.level} onChange={e=>setEditForm(f=>({...f,level:e.target.value}))} className="input text-sm py-2">
                    {['100','200','300','400','500'].map(l=><option key={l} value={l}>{l}L</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">File URL</label>
                <textarea rows={3} value={editForm.file_url} onChange={e=>setEditForm(f=>({...f,file_url:e.target.value}))}
                  className="input resize-none text-xs leading-relaxed" placeholder="https://drive.google.com/... or any file URL"/>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={()=>setEditMat(null)} disabled={saving}
                  className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">Cancel</button>
                <button onClick={saveEdit} disabled={saving}
                  className="flex-1 py-2.5 bg-[#1a6b3a] rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> Saving...</> : <><Save className="w-3.5 h-3.5"/> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AdminShell>
  )
}
