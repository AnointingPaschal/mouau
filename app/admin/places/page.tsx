'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Edit2, X, Save, Loader2, MapPin, CheckCircle2 } from 'lucide-react'

type Place = { id:string; name:string; description:string; category:string; lat:number; lng:number; hours:string; directions:string; active:boolean }

const CATS = ['college','admin','hostel','lodge','social','health','library','lecture','worship','sport','other']
const CAT_COLORS:Record<string,string> = {
  college:'#1a6b3a', admin:'#1e293b', hostel:'#6b6b6b', lodge:'#6366f1',
  social:'#d97706', health:'#dc2626', library:'#0891b2',
  lecture:'#ea580c', worship:'#7c3aed', sport:'#2563eb', other:'#aaa'
}

export default function AdminPlacesPage() {
  const [places,   setPlaces]   = useState<Place[]>([])
  const [loading,  setLoading]  = useState(true)
  const [toast,    setToast]    = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState<Place|null>(null)
  const [form,     setForm]     = useState({ name:'', description:'', category:'college', lat:'5.4800', lng:'7.5455', hours:'', directions:'', active:true })
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

  const isActive=(p:Place)=> p.active!==false

  const openAdd=()=>{ setEditing(null); setForm({name:'',description:'',category:'college',lat:'5.4800',lng:'7.5455',hours:'',directions:'',active:true}); setShowForm(true) }
  const openEdit=(p:Place)=>{
    setEditing(p)
    setForm({name:p.name,description:p.description,category:p.category,lat:String(p.lat),lng:String(p.lng),hours:p.hours||'',directions:p.directions||'',active:p.active!==false})
    setShowForm(true)
  }

  const save=async()=>{
    if(!form.name.trim()){ showToast('Name is required'); return }
    setSaving(true)
    const payload={name:form.name.trim(),description:form.description.trim(),category:form.category,lat:parseFloat(String(form.lat))||5.48,lng:parseFloat(String(form.lng))||7.5455,hours:form.hours.trim(),directions:form.directions.trim(),active:Boolean(form.active)}
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
    await supabase.from('campus_locations').update({active:!isActive(p)}).eq('id',p.id); load()
  }

  const deduplicate=async()=>{
    if(!confirm('Remove duplicate places? Keeps oldest entry per name.')) return
    const seen:{[k:string]:boolean}={}; const toDelete:string[]=[]
    places.slice().sort((a,b)=>a.id.localeCompare(b.id)).forEach(p=>{
      const key=p.name.trim().toLowerCase()
      if(seen[key]) toDelete.push(p.id); else seen[key]=true
    })
    if(toDelete.length===0){ showToast('No duplicates found'); return }
    await Promise.all(toDelete.map(id=>supabase.from('campus_locations').delete().eq('id',id)))
    showToast(`Removed ${toDelete.length} duplicate${toDelete.length>1?'s':''}`); load()
  }

  const filtered=places.filter(p=>{
    if(catFilter!=='all'&&p.category!==catFilter) return false
    if(search&&!p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Group by category for "all" view
  const grouped = CATS.reduce((acc,c)=>{
    const items=filtered.filter(p=>p.category===c)
    if(items.length>0) acc[c]=items
    return acc
  },{} as Record<string,Place[]>)
  const uncategorized=filtered.filter(p=>!CATS.includes(p.category))
  if(uncategorized.length>0) grouped['other']=[...(grouped['other']||[]),...uncategorized]

  const PlaceCard=({p}:{p:Place})=>(
    <div className={`card p-3 ${!isActive(p)?'opacity-50':''}`}>
      <div className="flex items-start gap-2.5">
        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{background:CAT_COLORS[p.category]||'#aaa',minHeight:36,width:3}}/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="font-bold text-[#0a0a0a] text-sm truncate flex-1">{p.name}</p>
            {!isActive(p)&&<span className="text-[8px] bg-[#f0f0f0] text-[#aaa] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">Hidden</span>}
          </div>
          <p className="text-[10px] text-[#aaa] truncate">{p.description}</p>
          <p className="text-[9px] text-[#ccc] mt-0.5">📍 {p.lat?.toFixed(4)}, {p.lng?.toFixed(4)}</p>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={()=>toggle(p)} className={`p-1.5 rounded-lg text-xs font-bold transition-all ${isActive(p)?'bg-[#1a6b3a]/10 text-[#1a6b3a]':'bg-[#f0f0f0] text-[#aaa]'}`}>{isActive(p)?'●':'○'}</button>
          <button onClick={()=>openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-[#aaa] hover:text-blue-500 transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
          <button onClick={()=>del(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
        </div>
      </div>
    </div>
  )

  return (
    <AdminShell>
      {toast&&(
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/> {toast}
        </div>
      )}

      <div className="p-4 space-y-4 w-full pb-24">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
            <h1 className="font-black text-[#0a0a0a] text-2xl">Campus Places</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">{places.length} total · {places.filter(p=>p.active!==false).length} active</p>
          </div>
          <div className="flex gap-2">
            <button onClick={deduplicate} className="bg-red-50 text-red-600 text-xs font-bold px-3 py-2 rounded-xl border border-red-100">Dedupe</button>
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#1a6b3a] text-white text-xs font-bold px-3.5 py-2 rounded-xl">
              <Plus className="w-3.5 h-3.5"/> Add Place
            </button>
          </div>
        </div>

        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search places..." className="input w-full text-sm"/>

        {/* Category filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button onClick={()=>setCatFilter('all')}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${catFilter==='all'?'bg-[#0a0a0a] text-white':'bg-white border border-[#e8e8e8] text-[#6b6b6b]'}`}>
            All
          </button>
          {CATS.map(c=>{
            const count=places.filter(p=>p.category===c).length
            if(count===0) return null
            return (
              <button key={c} onClick={()=>setCatFilter(catFilter===c?'all':c)}
                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition-all border-2 ${catFilter===c?'text-white border-transparent':'border-[#e8e8e8] text-[#6b6b6b]'}`}
                style={catFilter===c?{background:CAT_COLORS[c]}:{}}>
                {c} <span className="opacity-60">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : catFilter!=='all' ? (
          // Single category flat list
          <div className="space-y-2">
            {filtered.length===0 ? (
              <div className="card p-8 text-center"><p className="text-sm text-[#aaa]">No places in this category</p></div>
            ) : filtered.map(p=><PlaceCard key={p.id} p={p}/>)}
          </div>
        ) : (
          // All — grouped by category
          <div className="space-y-5">
            {Object.entries(grouped).map(([cat,items])=>(
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={()=>setCatFilter(cat)}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:CAT_COLORS[cat]||'#aaa'}}/>
                  <p className="text-[10px] font-black text-[#0a0a0a] uppercase tracking-widest capitalize">{cat}</p>
                  <div className="flex-1 h-px bg-[#e8e8e8]"/>
                  <span className="text-[10px] font-bold text-[#1a6b3a] hover:underline cursor-pointer">{items.length} →</span>
                </div>
                <div className="space-y-1.5">
                  {items.slice(0,3).map(p=><PlaceCard key={p.id} p={p}/>)}
                  {items.length>3&&(
                    <button onClick={()=>setCatFilter(cat)}
                      className="w-full py-2 text-xs font-bold text-[#1a6b3a] bg-[#1a6b3a]/5 rounded-xl hover:bg-[#1a6b3a]/10 transition-colors">
                      +{items.length-3} more {cat} places
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit form */}
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
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5 block">Category</label>
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
                <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="input resize-none text-sm" placeholder="Brief description"/>
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
                <textarea rows={2} value={form.directions} onChange={e=>setForm(f=>({...f,directions:e.target.value}))} className="input resize-none text-sm" placeholder="Walking directions..."/>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#f9f9f7] rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-[#0a0a0a]">Visible to students</p>
                  <p className="text-[10px] text-[#aaa]">Show in campus map</p>
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
