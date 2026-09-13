'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Edit2, Loader2, CheckCircle2, X, Save, Users, Package, Eye, EyeOff } from 'lucide-react'

type Material = { id:string; title:string; description:string; type:string; image_url:string; available:boolean; quantity:number; sort_order:number }
type Req = { id:string; student_name:string; student_phone:string; matric_number:string; status:string; created_at:string }

const TYPES = ['book','notes','cd','dvd','journal','other']
const STATUS_COLORS: Record<string,string> = { pending:'#d97706', approved:'#1a6b3a', collected:'#6b6b6b', cancelled:'#dc2626' }

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState<Material|null>(null)
  const [form,      setForm]      = useState({ title:'',description:'',type:'book',image_url:'',available:true,quantity:'0',sort_order:'0' })
  const [saving,    setSaving]    = useState(false)
  const [viewReqs,  setViewReqs]  = useState<string|null>(null)
  const [requests,  setRequests]  = useState<Req[]>([])
  const [reqLoading,setReqLoading]= useState(false)

  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),3000)}

  const load=async()=>{
    setLoading(true)
    const{data}=await supabase.from('ministry_materials').select('*').order('sort_order').order('created_at',{ascending:false})
    setMaterials((data as Material[])||[])
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  const openAdd=()=>{ setEditing(null); setForm({title:'',description:'',type:'book',image_url:'',available:true,quantity:'0',sort_order:'0'}); setShowForm(true) }
  const openEdit=(m:Material)=>{ setEditing(m); setForm({title:m.title,description:m.description,type:m.type,image_url:m.image_url,available:m.available,quantity:String(m.quantity),sort_order:String(m.sort_order)}); setShowForm(true) }

  const save=async()=>{
    if(!form.title){ showToast('Title required'); return }
    setSaving(true)
    const payload={title:form.title,description:form.description,type:form.type,image_url:form.image_url,available:form.available,quantity:parseInt(form.quantity)||0,sort_order:parseInt(form.sort_order)||0}
    if(editing) await supabase.from('ministry_materials').update(payload).eq('id',editing.id)
    else await supabase.from('ministry_materials').insert(payload)
    setSaving(false); setShowForm(false); showToast(editing?'Updated':'Material added'); load()
  }

  const del=async(id:string)=>{ if(!confirm('Delete?')) return; await supabase.from('ministry_materials').delete().eq('id',id); showToast('Deleted'); load() }
  const toggleAvail=async(m:Material)=>{ await supabase.from('ministry_materials').update({available:!m.available}).eq('id',m.id); load() }

  const loadRequests=async(matId:string)=>{
    setViewReqs(matId); setReqLoading(true)
    const{data}=await supabase.from('material_requests').select('*').eq('material_id',matId).order('created_at',{ascending:false})
    setRequests((data as Req[])||[]); setReqLoading(false)
  }

  const updateStatus=async(reqId:string,status:string)=>{
    await supabase.from('material_requests').update({status}).eq('id',reqId)
    if(viewReqs) loadRequests(viewReqs)
  }

  return (
    <AdminShell>
      {toast&&(<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5 text-green-400"/> {toast}</div>)}
      <div className="p-4 w-full pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <div><p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p><h1 className="font-black text-[#0a0a0a] text-2xl">Materials</h1><p className="text-xs text-[#6b6b6b]">{materials.length} materials · {materials.filter(m=>m.available).length} available</p></div>
          <button onClick={openAdd} className="flex items-center gap-1.5 text-white text-xs font-bold px-3.5 py-2 rounded-xl pd-gradient"><Plus className="w-3.5 h-3.5"/> Add Material</button>
        </div>

        {loading?(<div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#1e3a8a]"/></div>):(
          <div className="space-y-2">
            {materials.map(m=>(
              <div key={m.id} className={`card p-3.5 ${!m.available?'opacity-60':''}`}>
                <div className="flex items-start gap-3">
                  {m.image_url&&<img src={m.image_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0"/>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-[#0a0a0a] text-sm truncate flex-1">{m.title}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0`} style={{background:m.available?'#1a6b3a':'#aaa'}}>{m.available?'Available':'Unavail.'}</span>
                    </div>
                    <p className="text-[10px] text-[#aaa] capitalize">{m.type}</p>
                    {m.description&&<p className="text-[10px] text-[#6b6b6b] line-clamp-1 mt-0.5">{m.description}</p>}
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button onClick={()=>loadRequests(m.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-[#aaa] hover:text-blue-500 transition-all" title="View requests"><Users className="w-3.5 h-3.5"/></button>
                    <button onClick={()=>toggleAvail(m)} className={`p-1.5 rounded-lg text-[#aaa] transition-all ${m.available?'hover:bg-amber-50 hover:text-amber-500':'hover:bg-[#1a6b3a]/10 hover:text-[#1a6b3a]'}`}>{m.available?<EyeOff className="w-3.5 h-3.5"/>:<Eye className="w-3.5 h-3.5"/>}</button>
                    <button onClick={()=>openEdit(m)} className="p-1.5 rounded-lg hover:bg-blue-50 text-[#aaa] hover:text-blue-500 transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                    <button onClick={()=>del(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm&&(
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>!saving&&setShowForm(false)}/>
          <div className="relative w-full max-w-md bg-white rounded-t-2xl p-5 animate-slide-up max-h-[92vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#e8e8e8] rounded-full mx-auto mb-4"/>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-[#0a0a0a]">{editing?'Edit Material':'Add Material'}</h2>
              {!saving&&<button onClick={()=>setShowForm(false)} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>}
            </div>
            <div className="space-y-3">
              <div><label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Title *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="input w-full text-sm" placeholder="e.g. Introduction to Christian Living"/></div>
              <div><label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Type</label>
                <div className="flex flex-wrap gap-1.5">{TYPES.map(t=><button key={t} onClick={()=>setForm(f=>({...f,type:t}))} className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition-all border-2 ${form.type===t?'pd-gradient text-white border-transparent':'border-[#e8e8e8] text-[#6b6b6b]'}`}>{t}</button>)}</div>
              </div>
              <div><label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Description</label><textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="input w-full resize-none text-sm" placeholder="Brief description"/></div>
              <div><label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Cover Image URL (optional)</label><input value={form.image_url} onChange={e=>setForm(f=>({...f,image_url:e.target.value}))} className="input w-full text-sm" placeholder="https://..."/></div>
              <div className="flex items-center justify-between p-3 bg-[#f9f9f7] rounded-xl">
                <div><p className="text-sm font-semibold text-[#0a0a0a]">Available for requests</p><p className="text-[10px] text-[#aaa]">Students can request this material</p></div>
                <button onClick={()=>setForm(f=>({...f,available:!f.available}))} className={`w-11 h-6 rounded-full transition-all relative ${form.available?'bg-[#1a6b3a]':'bg-[#e8e8e8]'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${form.available?'left-5':'left-0.5'}`}/></button>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={()=>setShowForm(false)} disabled={saving} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">Cancel</button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 pd-gradient">
                  {saving?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<><Save className="w-3.5 h-3.5"/>{editing?'Update':'Add'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requests Side Sheet */}
      {viewReqs&&(
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setViewReqs(null)}/>
          <div className="relative w-full max-w-md bg-white rounded-t-2xl p-5 animate-slide-up max-h-[80vh] flex flex-col">
            <div className="w-10 h-1 bg-[#e8e8e8] rounded-full mx-auto mb-4"/>
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div><h2 className="font-black text-[#0a0a0a]">Student Requests</h2><p className="text-xs text-[#aaa]">{requests.length} total</p></div>
              <button onClick={()=>setViewReqs(null)} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {reqLoading?(<div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#1e3a8a]"/></div>):
              requests.length===0?(<div className="text-center py-8 text-sm text-[#aaa]">No requests yet</div>):
              requests.map(r=>(
                <div key={r.id} className="card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0a0a0a] text-sm">{r.student_name}</p>
                      <p className="text-[10px] text-[#aaa] font-mono">{r.matric_number}</p>
                      <p className="text-[10px] text-[#6b6b6b] mt-0.5">📞 {r.student_phone}</p>
                      <p className="text-[9px] text-[#aaa] mt-0.5">{new Date(r.created_at).toLocaleDateString('en-NG')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full capitalize" style={{background:STATUS_COLORS[r.status]+'20',color:STATUS_COLORS[r.status]}}>{r.status}</span>
                      <select value={r.status} onChange={e=>updateStatus(r.id,e.target.value)}
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
