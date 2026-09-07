'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Plus, Edit2, Trash2, Save, X, Loader2, MapPin, CheckCircle2 } from 'lucide-react'

type Loc = { id:string; name:string; description:string; lat:number; lng:number; category:string; hours:string; directions:string; sort_order:number; active:boolean }

const CATS = ['college','admin','hostel','lodge','social','health','library','lecture','worship','sport','other']
const CAT_COLORS:Record<string,string> = {
  college:'#1a6b3a', admin:'#1e293b', hostel:'#6b6b6b', lodge:'#6366f1',
  social:'#d97706', health:'#dc2626', library:'#0891b2',
  lecture:'#ea580c', worship:'#7c3aed', sport:'#2563eb', other:'#aaa'
}

export default function MapPage() {
  const { token } = useAdmin()
  const [locs,    setLocs]    = useState<Loc[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Loc|null>(null)
  const [adding,  setAdding]  = useState(false)
  const [form,    setForm]    = useState({ name:'', description:'', lat:'5.4800', lng:'7.5455', category:'college', hours:'', directions:'', sort_order:'0' })
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')
  const [search,  setSearch]  = useState('')
  const [catFilter,setCatFilter] = useState('all')

  const load = () => {
    fetch('/api/admin/locations', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setLocs(d.data || []); setLoading(false) })
  }
  useEffect(() => { if(token) load() }, [token])

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3000) }

  const openAdd = () => {
    setEditing(null)
    setForm({name:'',description:'',lat:'5.4800',lng:'7.5455',category:'college',hours:'',directions:'',sort_order:'0'})
    setAdding(true)
  }
  const openEdit = (l:Loc) => {
    setEditing(l)
    setForm({name:l.name,description:l.description||'',lat:String(l.lat),lng:String(l.lng),category:l.category||'college',hours:l.hours||'',directions:l.directions||'',sort_order:String(l.sort_order||0)})
    setAdding(true)
  }

  const save = async () => {
    if(!form.name.trim()) { showToast('Name required'); return }
    setSaving(true)
    const body = {name:form.name.trim(),description:form.description.trim(),lat:parseFloat(form.lat)||5.48,lng:parseFloat(form.lng)||7.5455,category:form.category,hours:form.hours.trim(),directions:form.directions.trim(),sort_order:parseInt(form.sort_order)||0}
    const url = editing ? `/api/admin/locations/${editing.id}` : '/api/admin/locations'
    const method = editing ? 'PUT' : 'POST'
    const r = await fetch(url, { method, headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify(body) })
    setSaving(false)
    if(r.ok){ showToast(editing?'Updated':'Added'); setAdding(false); load() }
    else showToast('Failed to save')
  }

  const del = async (id:string) => {
    if(!confirm('Delete this location?')) return
    await fetch(`/api/admin/locations/${id}`, { method:'DELETE', headers:{Authorization:`Bearer ${token}`} })
    showToast('Deleted'); load()
  }

  const filtered = locs.filter(l => {
    if(catFilter!=='all' && l.category!==catFilter) return false
    if(search && !l.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const grouped = CATS.reduce((acc,c)=>{
    const items=filtered.filter(l=>l.category===c)
    if(items.length>0) acc[c]=items
    return acc
  },{} as Record<string,Loc[]>)
  const uncategorized=filtered.filter(l=>!CATS.includes(l.category))
  if(uncategorized.length>0) grouped['other']=[...(grouped['other']||[]),...uncategorized]

  const LocCard=({l}:{l:Loc})=>(
    <div className="card p-3">
      <div className="flex items-start gap-2.5">
        <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{background:CAT_COLORS[l.category]||'#aaa',minHeight:36,width:3}}/>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#0a0a0a] text-sm truncate">{l.name}</p>
          <p className="text-[10px] text-[#aaa] truncate">{l.description}</p>
          <p className="text-[9px] text-[#ccc] mt-0.5">📍 {l.lat?.toFixed(4)}, {l.lng?.toFixed(4)}</p>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={()=>openEdit(l)} className="p-1.5 rounded-lg hover:bg-blue-50 text-[#aaa] hover:text-blue-500 transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
          <button onClick={()=>del(l.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
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
      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
            <h1 className="font-black text-[#0a0a0a] text-2xl">Campus Map</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">{locs.length} locations · AI directions included</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-[#1a6b3a] text-white text-xs font-bold px-3.5 py-2 rounded-xl">
            <Plus className="w-3.5 h-3.5"/> Add Location
          </button>
        </div>

        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search locations..." className="input w-full text-sm"/>

        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button onClick={()=>setCatFilter('all')}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${catFilter==='all'?'bg-[#0a0a0a] text-white':'bg-white border border-[#e8e8e8] text-[#6b6b6b]'}`}>
            All
          </button>
          {CATS.map(c=>{
            const count=locs.filter(l=>l.category===c).length
            if(count===0) return null
            return (
              <button key={c} onClick={()=>setCatFilter(catFilter===c?'all':c)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition-all border-2 ${catFilter===c?'text-white border-transparent':'border-[#e8e8e8] text-[#6b6b6b]'}`}
                style={catFilter===c?{background:CAT_COLORS[c]}:{}}>
                {c} ({count})
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : catFilter!=='all' ? (
          <div className="space-y-2">
            {filtered.length===0
              ? <div className="card p-8 text-center"><p className="text-sm text-[#aaa]">No locations in this category</p></div>
              : filtered.map(l=><LocCard key={l.id} l={l}/>)}
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([cat,items])=>(
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={()=>setCatFilter(cat)}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:CAT_COLORS[cat]||'#aaa'}}/>
                  <p className="text-[10px] font-black text-[#0a0a0a] uppercase tracking-widest capitalize">{cat}</p>
                  <div className="flex-1 h-px bg-[#e8e8e8]"/>
                  <span className="text-[10px] font-bold text-[#1a6b3a] cursor-pointer">{items.length} →</span>
                </div>
                <div className="space-y-1.5">
                  {items.slice(0,3).map(l=><LocCard key={l.id} l={l}/>)}
                  {items.length>3&&(
                    <button onClick={()=>setCatFilter(cat)}
                      className="w-full py-2 text-xs font-bold text-[#1a6b3a] bg-[#1a6b3a]/5 rounded-xl hover:bg-[#1a6b3a]/10 transition-colors">
                      +{items.length-3} more {cat} locations
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit form */}
      {adding&&(
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>!saving&&setAdding(false)}/>
          <div className="relative w-full max-w-md bg-white rounded-t-2xl p-5 animate-slide-up max-h-[92vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#e8e8e8] rounded-full mx-auto mb-4"/>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-[#0a0a0a]">{editing?'Edit Location':'Add Location'}</h2>
              {!saving&&<button onClick={()=>setAdding(false)} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Name *</label>
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
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Directions</label>
                <textarea rows={2} value={form.directions} onChange={e=>setForm(f=>({...f,directions:e.target.value}))} className="input resize-none text-sm" placeholder="How to get there..."/>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={()=>setAdding(false)} disabled={saving} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">Cancel</button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-[#1a6b3a] rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  {saving?<><Loader2 className="w-3.5 h-3.5 animate-spin"/> Saving...</>:<><Save className="w-3.5 h-3.5"/> {editing?'Update':'Add'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
