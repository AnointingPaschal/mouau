'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import {
  Save, Loader2, CheckCircle2, Plus, Trash2, Upload, ChevronLeft,
  Lightbulb, Star, AlertTriangle, Quote, Calendar, Users, MapPin,
  Clock, Pencil, X
} from 'lucide-react'

const CATEGORIES = ['Tech','Business','Creative','Vocational','Ministry','Academic','General']
const LEVELS     = ['Beginner','Intermediate','Advanced']
const NUGGET_TYPES = [
  { value:'tip',     label:'Tip',   icon: Lightbulb,     color:'#1a6b3a' },
  { value:'fact',    label:'Fact',  icon: Star,          color:'#1e3a8a' },
  { value:'warning', label:'Note',  icon: AlertTriangle, color:'#d97706' },
  { value:'quote',   label:'Quote', icon: Quote,         color:'#7c3aed' },
]

export default function AdminSkillDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const { token } = useAdmin()
  const authH     = { Authorization: `Bearer ${token}` }

  const [skill,      setSkill]      = useState<any>(null)
  const [nuggets,    setNuggets]    = useState<any[]>([])
  const [classes,    setClasses]    = useState<any[]>([])
  const [apps,       setApps]       = useState<any[]>([])
  const [tab,        setTab]        = useState<'edit'|'nuggets'|'classes'|'applications'>('edit')
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [toast,      setToast]      = useState('')
  const [uploading,  setUploading]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Nugget form
  const [nuggetForm,    setNuggetForm]    = useState({ content:'', type:'tip' })
  const [addingNugget,  setAddingNugget]  = useState(false)
  const [editNuggetId,  setEditNuggetId]  = useState<string|null>(null)
  const [editNugget,    setEditNugget]    = useState({ content:'', type:'tip' })

  // Class forms
  const emptyClass = { title:'', description:'', date:'', location:'', duration_hours:'', max_attendees:'', notify_students:true }
  const [classForm,   setClassForm]   = useState(emptyClass)
  const [addingClass, setAddingClass] = useState(false)
  const [editClassId, setEditClassId] = useState<string|null>(null)
  const [editClass,   setEditClass]   = useState(emptyClass)
  const [savingClass, setSavingClass] = useState(false)

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const load = async () => {
    if (!token) return
    const d = await fetch(`/api/admin/skills/${id}`, { headers: authH }).then(r => r.json())
    setSkill(d.skill || {}); setNuggets(d.nuggets || [])
    setClasses(d.classes || []); setApps(d.applications || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [id, token])

  /* ── Skill save ── */
  const saveSkill = async () => {
    setSaving(true)
    const r = await fetch(`/api/admin/skills/${id}`, {
      method:'PUT', headers:{'Content-Type':'application/json',...authH},
      body: JSON.stringify(skill)
    }).then(r => r.json())
    setSaving(false)
    if (r.error) showToast('Save failed: ' + r.error)
    else showToast('Skill saved!')
  }

  /* ── Image upload ── */
  const uploadImage = async (file: File) => {
    setUploading(true)
    const fd = new FormData(); fd.append('image', file); fd.append('skill_id', id)
    const d = await fetch('/api/admin/skills/upload', { method:'POST', headers:authH, body:fd }).then(r => r.json())
    if (d.url) setSkill((p: any) => ({...p, image_url: d.url}))
    setUploading(false)
    showToast(d.url ? 'Image saved!' : 'Upload failed: ' + (d.error || ''))
  }

  /* ── Nuggets ── */
  const addNugget = async () => {
    if (!nuggetForm.content.trim()) return
    setAddingNugget(true)
    const d = await fetch('/api/admin/skills/nuggets', {
      method:'POST', headers:{'Content-Type':'application/json',...authH},
      body: JSON.stringify({ ...nuggetForm, skill_id: id, sort_order: nuggets.length })
    }).then(r => r.json())
    if (d.data) { setNuggets(p => [...p, d.data]); setNuggetForm({ content:'', type:'tip' }) }
    setAddingNugget(false)
    showToast(d.data ? 'Nugget added!' : d.error || 'Failed')
  }

  const saveNugget = async (nid: string) => {
    const d = await fetch('/api/admin/skills/nuggets', {
      method:'PUT', headers:{'Content-Type':'application/json',...authH},
      body: JSON.stringify({ id: nid, content: editNugget.content, type: editNugget.type })
    }).then(r => r.json())
    if (d.data) { setNuggets(p => p.map(n => n.id === nid ? d.data : n)); setEditNuggetId(null) }
    showToast(d.data ? 'Nugget updated!' : 'Failed')
  }

  const deleteNugget = async (nid: string) => {
    await fetch('/api/admin/skills/nuggets', { method:'DELETE', headers:{'Content-Type':'application/json',...authH}, body: JSON.stringify({ id: nid }) })
    setNuggets(p => p.filter(n => n.id !== nid))
    showToast('Deleted')
  }

  /* ── Classes ── */
  const announceClass = async () => {
    if (!classForm.title.trim()) return
    setAddingClass(true)
    const d = await fetch(`/api/admin/skills/${id}/classes`, {
      method:'POST', headers:{'Content-Type':'application/json',...authH},
      body: JSON.stringify(classForm)
    }).then(r => r.json())
    if (d.ok) { setClasses(p => [d.data, ...p]); setClassForm(emptyClass) }
    setAddingClass(false)
    showToast(d.ok ? (classForm.notify_students ? 'Class announced & students notified!' : 'Class announced!') : (d.error || 'Failed'))
  }

  const startEditClass = (cls: any) => {
    setEditClassId(cls.id)
    setEditClass({
      title: cls.title || '', description: cls.description || '',
      date: cls.date ? new Date(cls.date).toISOString().slice(0,16) : '',
      location: cls.location || '',
      duration_hours: cls.duration_hours?.toString() || '',
      max_attendees: cls.max_attendees?.toString() || '',
      notify_students: cls.notify_students ?? true,
    })
  }

  const saveClass = async () => {
    if (!editClassId) return
    setSavingClass(true)
    const d = await fetch(`/api/admin/skills/${id}/classes`, {
      method:'PUT', headers:{'Content-Type':'application/json',...authH},
      body: JSON.stringify({ id: editClassId, ...editClass })
    }).then(r => r.json())
    if (d.data) { setClasses(p => p.map(c => c.id === editClassId ? d.data : c)); setEditClassId(null) }
    setSavingClass(false)
    showToast(d.data ? 'Class updated!' : d.error || 'Failed')
  }

  const deleteClass = async (cid: string) => {
    if (!confirm('Delete this class?')) return
    await fetch(`/api/admin/skills/${id}/classes`, {
      method:'DELETE', headers:{'Content-Type':'application/json',...authH},
      body: JSON.stringify({ id: cid })
    })
    setClasses(p => p.filter(c => c.id !== cid))
    showToast('Class deleted')
  }

  /* ── Applications ── */
  const updateAppStatus = async (appId: string, status: string, studentId: string) => {
    await fetch(`/api/admin/skills/${id}/applications`, {
      method:'PUT', headers:{'Content-Type':'application/json',...authH},
      body: JSON.stringify({ application_id: appId, status, student_id: studentId, skill_title: skill?.title })
    })
    setApps(p => p.map((a: any) => a.id === appId ? {...a, status} : a))
    showToast(`Application ${status}!`)
  }

  const pendingCount  = apps.filter((a: any) => a.status === 'pending').length
  const approvedCount = apps.filter((a: any) => a.status === 'approved').length

  return (
    <AdminShell>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/> {toast}
        </div>
      )}

      <div className="p-4 w-full pb-24 max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => router.push('/admin/skills')} className="w-8 h-8 rounded-xl bg-[#f0f0f0] flex items-center justify-center flex-shrink-0">
                <ChevronLeft className="w-4 h-4 text-[#6b6b6b]"/>
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="font-black text-[#0a0a0a] text-lg truncate">{skill?.title}</h1>
                <p className="text-[10px] text-[#aaa]">{skill?.category} · {skill?.level}</p>
              </div>
              {tab === 'edit' && (
                <button onClick={saveSkill} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1a6b3a] text-white rounded-xl text-sm font-bold disabled:opacity-50">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Save className="w-3.5 h-3.5"/>} Save
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#f5f5f3] p-1 rounded-xl mb-4 overflow-x-auto">
              {[
                { id:'edit',         label:'Edit' },
                { id:'nuggets',      label:`Nuggets (${nuggets.length})` },
                { id:'classes',      label:`Classes (${classes.length})` },
                { id:'applications', label:`Apps (${pendingCount}/${apps.length})` },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id as any)}
                  className={`flex-shrink-0 flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all
                    ${tab === t.id ? 'bg-white text-[#0a0a0a] shadow-sm' : 'text-[#aaa] hover:text-[#6b6b6b]'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── EDIT TAB ── */}
            {tab === 'edit' && (
              <div className="space-y-4">
                {/* Image */}
                <div className="card overflow-hidden">
                  <div className="relative h-36 bg-[#f0f0f0] overflow-hidden">
                    {skill.image_url
                      ? <img src={skill.image_url} alt="" className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center text-[#ccc] text-xs">No image uploaded</div>}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if(f) uploadImage(f); e.target.value='' }}/>
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                      className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white/90 text-xs font-semibold px-3 py-1.5 rounded-lg shadow hover:bg-white transition-colors">
                      {uploading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3"/>}
                      {uploading ? 'Uploading…' : 'Upload Image'}
                    </button>
                  </div>
                </div>

                <div className="card overflow-hidden">
                  <div className="px-4 py-3 bg-[#f9f9f7] border-b border-[#e8e8e8]">
                    <h3 className="font-bold text-[#0a0a0a] text-sm">Basic Info</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { key:'title',      label:'Title *',    ph:'Skill name'            },
                      { key:'tagline',    label:'Tagline',    ph:'Short catchy description' },
                      { key:'instructor', label:'Instructor', ph:'Who teaches this?'     },
                      { key:'duration',   label:'Duration',   ph:'e.g. 8 weeks, 3 months' },
                    ].map(({ key, label, ph }) => (
                      <div key={key}>
                        <label className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-wide block mb-1">{label}</label>
                        <input value={skill[key] || ''} onChange={e => setSkill((p: any) => ({...p,[key]:e.target.value}))}
                          placeholder={ph} className="input w-full text-sm"/>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-wide block mb-1">Category</label>
                        <select value={skill.category || 'Tech'} onChange={e => setSkill((p: any) => ({...p,category:e.target.value}))} className="input w-full text-sm">
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-wide block mb-1">Level</label>
                        <select value={skill.level || 'Beginner'} onChange={e => setSkill((p: any) => ({...p,level:e.target.value}))} className="input w-full text-sm">
                          {LEVELS.map(l => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <label className="text-sm font-semibold text-[#0a0a0a]">Active (visible to students)</label>
                      <button onClick={() => setSkill((p: any) => ({...p,active:!p.active}))}
                        className={`w-10 h-5 rounded-full transition-all relative ${skill.active?'bg-[#1a6b3a]':'bg-[#e8e8e8]'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${skill.active?'left-5':'left-0.5'}`}/>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card overflow-hidden">
                  <div className="px-4 py-3 bg-[#f9f9f7] border-b border-[#e8e8e8]">
                    <h3 className="font-bold text-[#0a0a0a] text-sm">Content</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { key:'description',    label:'Description',        ph:'What is this skill about? Why is it valuable?' },
                      { key:'what_you_learn', label:'What Students Learn', ph:'One item per line\nWebsite development\nPHP programming' },
                      { key:'requirements',   label:'Requirements',        ph:'One item per line\nBasic computer knowledge\nDedication' },
                    ].map(({ key, label, ph }) => (
                      <div key={key}>
                        <label className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-wide block mb-1">{label}</label>
                        <textarea rows={3} value={skill[key] || ''} onChange={e => setSkill((p: any) => ({...p,[key]:e.target.value}))}
                          placeholder={ph} className="input w-full text-sm resize-none"/>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={saveSkill} disabled={saving}
                  className="w-full py-3 bg-[#1a6b3a] text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin"/> Saving…</> : <><Save className="w-4 h-4"/> Save All Changes</>}
                </button>
              </div>
            )}

            {/* ── NUGGETS TAB ── */}
            {tab === 'nuggets' && (
              <div className="space-y-3">
                {/* Add form */}
                <div className="card p-4 space-y-3 border-2 border-dashed border-[#e8e8e8]">
                  <h3 className="font-bold text-sm text-[#0a0a0a]">Add Knowledge Nugget</h3>
                  <div className="flex gap-2">
                    {NUGGET_TYPES.map(t => (
                      <button key={t.value} onClick={() => setNuggetForm(p => ({...p, type:t.value}))}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all
                          ${nuggetForm.type===t.value ? 'text-white' : 'bg-white text-[#aaa] border-[#e8e8e8]'}`}
                        style={nuggetForm.type===t.value ? {background:t.color, borderColor:t.color} : {}}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <textarea value={nuggetForm.content} onChange={e => setNuggetForm(p => ({...p,content:e.target.value}))}
                    rows={3} placeholder="Write a tip, fact, note or quote…" className="input w-full text-sm resize-none"/>
                  <button onClick={addNugget} disabled={addingNugget || !nuggetForm.content.trim()}
                    className="w-full py-2 text-sm font-bold text-white bg-[#1a6b3a] rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {addingNugget ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Plus className="w-3.5 h-3.5"/>} Add Nugget
                  </button>
                </div>

                {nuggets.length === 0 ? (
                  <div className="text-center py-8 text-[#aaa] text-sm">No nuggets yet.</div>
                ) : nuggets.map(n => {
                  const t    = NUGGET_TYPES.find(x => x.value===n.type) || NUGGET_TYPES[0]
                  const Icon = t.icon
                  const isEditing = editNuggetId === n.id
                  return (
                    <div key={n.id} className="card p-3.5">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            {NUGGET_TYPES.map(t2 => (
                              <button key={t2.value} onClick={() => setEditNugget(p => ({...p, type:t2.value}))}
                                className={`flex-1 py-1 rounded-lg text-[9px] font-bold border transition-all
                                  ${editNugget.type===t2.value ? 'text-white' : 'bg-white text-[#aaa] border-[#e8e8e8]'}`}
                                style={editNugget.type===t2.value ? {background:t2.color, borderColor:t2.color} : {}}>
                                {t2.label}
                              </button>
                            ))}
                          </div>
                          <textarea value={editNugget.content} onChange={e => setEditNugget(p => ({...p,content:e.target.value}))}
                            rows={3} className="input w-full text-xs resize-none"/>
                          <div className="flex gap-2">
                            <button onClick={() => setEditNuggetId(null)} className="flex-1 py-1.5 text-xs font-semibold text-[#aaa] border border-[#e8e8e8] rounded-lg">Cancel</button>
                            <button onClick={() => saveNugget(n.id)} className="flex-1 py-1.5 text-xs font-bold text-white bg-[#1a6b3a] rounded-lg flex items-center justify-center gap-1">
                              <Save className="w-3 h-3"/> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:`${t.color}15`}}>
                            <Icon className="w-3.5 h-3.5" style={{color:t.color}}/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-bold uppercase tracking-wide" style={{color:t.color}}>{t.label}</span>
                            <p className="text-xs text-[#0a0a0a] mt-0.5 leading-relaxed">{n.content}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button onClick={() => { setEditNuggetId(n.id); setEditNugget({ content:n.content, type:n.type }) }}
                              className="w-7 h-7 rounded-lg bg-[#f0f0f0] flex items-center justify-center hover:bg-[#e8e8e8] transition-colors">
                              <Pencil className="w-3 h-3 text-[#6b6b6b]"/>
                            </button>
                            <button onClick={() => deleteNugget(n.id)}
                              className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                              <Trash2 className="w-3 h-3 text-red-400"/>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── CLASSES TAB ── */}
            {tab === 'classes' && (
              <div className="space-y-3">
                {/* Announce form */}
                <div className="card p-4 space-y-3 border-2 border-dashed border-[#e8e8e8]">
                  <h3 className="font-bold text-sm text-[#0a0a0a]">Announce New Class</h3>
                  <input value={classForm.title} onChange={e => setClassForm(p => ({...p,title:e.target.value}))}
                    placeholder="Class title *" className="input w-full text-sm font-semibold"/>
                  <textarea value={classForm.description} onChange={e => setClassForm(p => ({...p,description:e.target.value}))}
                    rows={2} placeholder="Description (optional)" className="input w-full text-sm resize-none"/>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#aaa] block mb-1">Date & Time</label>
                      <input type="datetime-local" value={classForm.date} onChange={e => setClassForm(p => ({...p,date:e.target.value}))} className="input w-full text-sm"/>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#aaa] block mb-1">Duration (hrs)</label>
                      <input type="number" value={classForm.duration_hours} onChange={e => setClassForm(p => ({...p,duration_hours:e.target.value}))}
                        placeholder="e.g. 2" className="input w-full text-sm"/>
                    </div>
                  </div>
                  <input value={classForm.location} onChange={e => setClassForm(p => ({...p,location:e.target.value}))}
                    placeholder="Location (e.g. ICT Lab 2, Block B)" className="input w-full text-sm"/>
                  <input type="number" value={classForm.max_attendees} onChange={e => setClassForm(p => ({...p,max_attendees:e.target.value}))}
                    placeholder="Max attendees (optional)" className="input w-full text-sm"/>
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-xs font-semibold text-[#0a0a0a]">Notify approved students</p>
                      <p className="text-[10px] text-[#aaa]">{approvedCount} approved</p>
                    </div>
                    <button onClick={() => setClassForm(p => ({...p,notify_students:!p.notify_students}))}
                      className={`w-10 h-5 rounded-full transition-all relative ${classForm.notify_students?'bg-[#1a6b3a]':'bg-[#e8e8e8]'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${classForm.notify_students?'left-5':'left-0.5'}`}/>
                    </button>
                  </div>
                  <button onClick={announceClass} disabled={addingClass || !classForm.title.trim()}
                    className="w-full py-2.5 text-sm font-bold text-white bg-[#1e3a8a] rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {addingClass ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Calendar className="w-3.5 h-3.5"/>} Announce Class
                  </button>
                </div>

                {/* Class list */}
                {classes.length === 0 ? (
                  <div className="text-center py-8 text-[#aaa] text-sm">No classes announced yet.</div>
                ) : classes.map(cls => {
                  const isEditing = editClassId === cls.id
                  return (
                    <div key={cls.id} className="card p-3.5">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold text-[#0a0a0a]">Edit Class</p>
                            <button onClick={() => setEditClassId(null)}><X className="w-4 h-4 text-[#aaa]"/></button>
                          </div>
                          <input value={editClass.title} onChange={e => setEditClass(p => ({...p,title:e.target.value}))}
                            placeholder="Class title *" className="input w-full text-sm font-semibold"/>
                          <textarea value={editClass.description} onChange={e => setEditClass(p => ({...p,description:e.target.value}))}
                            rows={2} placeholder="Description" className="input w-full text-sm resize-none"/>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-[#aaa] block mb-1">Date & Time</label>
                              <input type="datetime-local" value={editClass.date} onChange={e => setEditClass(p => ({...p,date:e.target.value}))} className="input w-full text-sm"/>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-[#aaa] block mb-1">Duration (hrs)</label>
                              <input type="number" value={editClass.duration_hours} onChange={e => setEditClass(p => ({...p,duration_hours:e.target.value}))} className="input w-full text-sm"/>
                            </div>
                          </div>
                          <input value={editClass.location} onChange={e => setEditClass(p => ({...p,location:e.target.value}))}
                            placeholder="Location" className="input w-full text-sm"/>
                          <div className="flex gap-2">
                            <button onClick={() => setEditClassId(null)} className="flex-1 py-2 text-xs font-semibold text-[#aaa] border border-[#e8e8e8] rounded-xl">Cancel</button>
                            <button onClick={saveClass} disabled={savingClass}
                              className="flex-1 py-2 text-xs font-bold text-white bg-[#1a6b3a] rounded-xl disabled:opacity-50 flex items-center justify-center gap-1">
                              {savingClass ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>} Save Class
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-bold text-sm text-[#0a0a0a] leading-tight">{cls.title}</p>
                            <div className="flex gap-1.5 flex-shrink-0">
                              <button onClick={() => startEditClass(cls)}
                                className="w-7 h-7 rounded-lg bg-[#f0f0f0] flex items-center justify-center hover:bg-[#e8e8e8] transition-colors">
                                <Pencil className="w-3 h-3 text-[#6b6b6b]"/>
                              </button>
                              <button onClick={() => deleteClass(cls.id)}
                                className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                                <Trash2 className="w-3 h-3 text-red-400"/>
                              </button>
                            </div>
                          </div>
                          {cls.description && <p className="text-xs text-[#6b6b6b] mb-2">{cls.description}</p>}
                          <div className="space-y-1">
                            {cls.date && <p className="text-[11px] text-[#0a0a0a] flex items-center gap-1.5"><Calendar className="w-3 h-3 text-[#1a6b3a]"/>{new Date(cls.date).toLocaleString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>}
                            {cls.location && <p className="text-[11px] text-[#0a0a0a] flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#1a6b3a]"/>{cls.location}</p>}
                            {cls.duration_hours && <p className="text-[11px] text-[#0a0a0a] flex items-center gap-1.5"><Clock className="w-3 h-3 text-[#1a6b3a]"/>{cls.duration_hours}h</p>}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── APPLICATIONS TAB ── */}
            {tab === 'applications' && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="card p-3 text-center"><p className="font-black text-lg text-amber-500">{pendingCount}</p><p className="text-[9px] text-[#aaa] font-semibold uppercase">Pending</p></div>
                  <div className="card p-3 text-center"><p className="font-black text-lg text-[#1a6b3a]">{approvedCount}</p><p className="text-[9px] text-[#aaa] font-semibold uppercase">Approved</p></div>
                  <div className="card p-3 text-center"><p className="font-black text-lg text-[#0a0a0a]">{apps.length}</p><p className="text-[9px] text-[#aaa] font-semibold uppercase">Total</p></div>
                </div>
                {apps.length === 0 ? (
                  <div className="text-center py-8"><Users className="w-8 h-8 text-[#ddd] mx-auto mb-2"/><p className="text-[#aaa] text-sm">No applications yet.</p></div>
                ) : apps.map((app: any) => (
                  <div key={app.id} className="card p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-bold text-sm text-[#0a0a0a]">{app.student_name || app.student_id}</p>
                        <p className="text-[10px] text-[#aaa] font-mono">{app.matric_number}</p>
                        {app.student_phone && <p className="text-[10px] text-[#6b6b6b]">{app.student_phone}</p>}
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0
                        ${app.status==='approved'?'bg-[#1a6b3a] text-white':app.status==='pending'?'bg-amber-100 text-amber-700':'bg-red-50 text-red-400'}`}>
                        {app.status}
                      </span>
                    </div>
                    {app.motivation && <p className="text-[11px] text-[#6b6b6b] italic mb-2">"{app.motivation}"</p>}
                    {app.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => updateAppStatus(app.id,'rejected',app.student_id)}
                          className="flex-1 py-1.5 text-[11px] font-bold text-red-500 border border-red-200 rounded-xl hover:bg-red-50">Reject</button>
                        <button onClick={() => updateAppStatus(app.id,'approved',app.student_id)}
                          className="flex-1 py-1.5 text-[11px] font-bold text-white bg-[#1a6b3a] rounded-xl hover:bg-[#145530]">Approve</button>
                      </div>
                    )}
                    {app.status !== 'pending' && (
                      <button onClick={() => updateAppStatus(app.id,'pending',app.student_id)}
                        className="mt-1 text-[10px] text-[#aaa] hover:text-[#6b6b6b] underline">Reset to pending</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  )
}
