'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Edit2, X, Save, Loader2, MapPin, CheckCircle2 } from 'lucide-react'

type Place = {
  id:string; name:string; description:string; category:string
  lat:number; lng:number; hours:string; directions:string; active:boolean
}

const CATS = ['academic','admin','hostel','social','health','worship','sport','other']
const CAT_COLORS:Record<string,string> = { academic:'#1a6b3a', admin:'#0a0a0a', hostel:'#6b6b6b', social:'#d97706', health:'#dc2626', worship:'#7c3aed', sport:'#2563eb', other:'#aaa' }
const EMPTY = { name:'', description:'', category:'academic', lat:'5.4800', lng:'7.5455', hours:'', directions:'', active:true }

export default function AdminPlacesPage() {
  const { token } = useAdmin()
  const [places,   setPlaces]   = useState<Place[]>([])
  const [loading,  setLoading]  = useState(true)
  const [toast,    setToast]    = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState<Place|null>(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [search,   setSearch]   = useState('')
  const [catFilter,setCatFilter]= useState('all')

  const showToast=(m:string)=>{ setToast(m); setTimeout(()=>setToast(''),3000) }

  const load=async()=>{
    setLoading(true)
    const{data}=await supabase.from('campus_locations').select('*').order('name')
    setPlaces((data as Place[])||[])
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const openAdd=()=>{ setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit=(p:Place)=>{
    setEditing(p)
    setForm({name:p.name,description:p.description,category:p.category,lat:String(p.lat),lng:String(p.lng),hours:p.hours||'',directions:p.directions||'',active:p.active})
    setShowForm(true)
  }

  const save=async()=>{
    if(!form.name.trim()){ showToast('Name is required'); return }
    setSaving(true)
    const payload={name:form.name.trim(),description:form.description.trim(),category:form.category,lat:parseFloat(String(form.lat))||5.48,lng:parseFloat(String(form.lng))||7.5455,hours:form.hours.trim(),directions:form.directions.trim(),active:form.active}
    if(editing){ await supabase.from('campus_locations').update(payload).eq('id',editing.id); showToast('Place updated') }
    else{ await supabase.from('campus_locations').insert(payload); showToast('Place added') }
    setSaving(false); setShowForm(false); load()
  }

  const del=async(id:string)=>{
    if(!confirm('Delete this place?')) return
    await supabase.from('campus_locations').delete().eq('id',id)
    showToast('Deleted'); load()
  }

  const toggle=async(p:Place)=>{
    await supabase.from('campus_locations').update({active:!p.active}).eq('id',p.id); load()
  }

  const filtered=places.filter(p=>{
    if(catFilter!=='all'&&p.category!==catFilter) return false
    if(search&&!p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AdminShell>
      {toast&&(
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/> {toast}
        </div>
      )}
      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
            <h1 className="font-black text-[#0a0a0a] text-2xl">Campus Places</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">{places.length} locations · {places.filter(p=>p.active).length} active</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#1a6b3a] text-white text-xs font-bold px-3.5 py-2 rounded-xl">
            <Plus className="w-3.5 h-3.5"/> Add Place
          </button>
        </div>

        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search places..."
          className="input w-full text-sm"/>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['all',...CATS].map(c=>(
            <button key={c} onClick={()=>setCatFilter(c)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition-all ${catFilter===c?'bg-[#0a0a0a] text-white':'bg-white border border-[#e8e8e8] text-[#6b6b6b]'}`}>
              {c}
            </button>
          ))}
        </div>

        {loading?(
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ):filtered.length===0?(
          <div className="card p-10 text-center">
            <MapPin className="w-8 h-8 text-[#ddd] mx-auto mb-2"/>
            <p className="text-sm font-semibold text-[#0a0a0a]">No places found</p>
            <button onClick={openAdd} className="btn-primary mt-3 mx-auto">Add First Place</button>
          </div>
        ):(
          <div className="space-y-2">
            {filtered.map(p=>(
              <div key={p.id} className={`card p-3.5 ${!p.active?'opacity-50':''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-0.5 self-stretch rounded-full flex-shrink-0 mt-1" style={{background:CAT_COLORS[p.category]||'#aaa',minHeight:40,width:3}}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-[#0a0a0a] text-sm truncate">{p.name}</p>
                      {!p.active&&<span className="text-[9px] bg-[#f0f0f0] text-[#aaa] px-1.5 py-0.5 rounded-full font-bold">Hidden</span>}
                    </div>
                    <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold rounded-full capitalize text-white mb-1" style={{background:CAT_COLORS[p.category]||'#aaa'}}>{p.category}</span>
                    {p.description&&<p className="text-[#6b6b6b] text-xs leading-relaxed line-clamp-2">{p.description}</p>}
                    <p className="text-[10px] text-[#aaa] mt-1">📍 {p.lat?.toFixed(4)}, {p.lng?.toFixed(4)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={()=>toggle(p)} title={p.active?'Hide':'Show'}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all ${p.active?'bg-[#1a6b3a]/10 text-[#1a6b3a]':'bg-[#f0f0f0] text-[#aaa]'}`}>
                      {p.active?'●':'○'}
                    </button>
                    <button onClick={()=>openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-[#aaa] hover:text-blue-500 transition-all">
                      <Edit2 className="w-3.5 h-3.5"/>
                    </button>
                    <button onClick={()=>del(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500 transition-all">
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm&&(
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>!saving&&setShowForm(false)}/>
          <div className="relative w-full max-w-md bg-white rounded-t-2xl p-5 animate-slide-up max-h-[92vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#e8e8e8] rounded-full mx-auto mb-4"/>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-[#0a0a0a]">{editing?'Edit Place':'Add New Place'}</h2>
              {!saving&&<button onClick={()=>setShowForm(false)} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Place Name *</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="input text-sm" placeholder="e.g. University Library"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATS.map(c=>(
                    <button key={c} onClick={()=>setForm(f=>({...f,category:c}))}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition-all border-2 ${form.category===c?'text-white border-transparent':'border-[#e8e8e8] text-[#6b6b6b]'}`}
                      style={form.category===c?{background:CAT_COLORS[c]}:{}}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Description</label>
                <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="input resize-none text-sm" placeholder="Brief description of the place"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Latitude</label>
                  <input value={form.lat} onChange={e=>setForm(f=>({...f,lat:e.target.value}))} className="input text-sm" placeholder="5.4800"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Longitude</label>
                  <input value={form.lng} onChange={e=>setForm(f=>({...f,lng:e.target.value}))} className="input text-sm" placeholder="7.5455"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Opening Hours</label>
                <input value={form.hours} onChange={e=>setForm(f=>({...f,hours:e.target.value}))} className="input text-sm" placeholder="e.g. Mon-Fri 8am-5pm"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">How to Get There</label>
                <textarea rows={2} value={form.directions} onChange={e=>setForm(f=>({...f,directions:e.target.value}))} className="input resize-none text-sm" placeholder="Walking directions from main gate..."/>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#f9f9f7] rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-[#0a0a0a]">Visible to students</p>
                  <p className="text-[10px] text-[#aaa]">Show this place in campus map</p>
                </div>
                <button onClick={()=>setForm(f=>({...f,active:!f.active}))}
                  className={`w-11 h-6 rounded-full transition-all relative ${form.active?'bg-[#1a6b3a]':'bg-[#e8e8e8]'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${form.active?'left-5':'left-0.5'}`}/>
                </button>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={()=>setShowForm(false)} disabled={saving} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">Cancel</button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-[#1a6b3a] rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  {saving?<><Loader2 className="w-3.5 h-3.5 animate-spin"/> Saving...</>:<><Save className="w-3.5 h-3.5"/> {editing?'Update':'Add Place'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
