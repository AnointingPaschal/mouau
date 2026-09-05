'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Plus, Edit2, Trash2, Save, X, Loader2, MapPin } from 'lucide-react'

type Loc = { id:string; name:string; description:string; lat:number; lng:number; category:string; hours:string; directions:string; sort_order:number }
const CATS = ['academic','admin','hostel','social','health','worship','sport']

export default function MapPage() {
  const { token } = useAdmin()
  const [locs, setLocs] = useState<Loc[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Loc|null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name:'', description:'', lat:'', lng:'', category:'academic', hours:'', directions:'', sort_order:'0' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const load = () => {
    fetch('/api/admin/locations', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setLocs(d.data || []); setLoading(false) })
  }
  useEffect(() => { if (token) load() }, [token])

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const save = async () => {
    setSaving(true)
    const body = { name:form.name, description:form.description, lat:parseFloat(form.lat), lng:parseFloat(form.lng), category:form.category, hours:form.hours, directions:form.directions, sort_order:parseInt(form.sort_order)||0 }
    if (editing) {
      await fetch('/api/admin/locations', { method:'PATCH', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({id:editing.id,...body}) })
    } else {
      await fetch('/api/admin/locations', { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify(body) })
    }
    setSaving(false); setEditing(null); setAdding(false)
    setForm({ name:'', description:'', lat:'', lng:'', category:'academic', hours:'', directions:'', sort_order:'0' })
    showToast(editing ? 'Location updated' : 'Location added'); load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this location?')) return
    await fetch('/api/admin/locations', { method:'DELETE', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({id}) })
    showToast('Location deleted'); load()
  }

  const startEdit = (loc: Loc) => {
    setEditing(loc); setAdding(true)
    setForm({ name:loc.name, description:loc.description, lat:String(loc.lat), lng:String(loc.lng), category:loc.category, hours:loc.hours, directions:loc.directions, sort_order:String(loc.sort_order) })
  }

  return (
    <AdminShell>
      <div className="p-5 lg:p-8 max-w-3xl">
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2 rounded-xl text-xs font-medium animate-slide-up">{toast}</div>
        )}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest mb-1">ADMIN</p>
            <h1 className="text-xl font-black text-[#0a0a0a]">Campus Map</h1>
            <p className="text-[#6b6b6b] text-sm mt-1">Manage locations. Directions are included in AI responses.</p>
          </div>
          {!adding && (
            <button onClick={() => { setAdding(true); setEditing(null); setForm({ name:'', description:'', lat:'', lng:'', category:'academic', hours:'', directions:'', sort_order:'0' }) }}
              className="btn-primary flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/>Add Location</button>
          )}
        </div>

        {adding && (
          <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 mb-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-[#0a0a0a] text-sm">{editing ? 'Edit Location' : 'New Location'}</h3>
              <button onClick={() => { setAdding(false); setEditing(null) }}><X className="w-4 h-4 text-[#aaa]"/></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Name *</label>
                <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="input" placeholder="e.g. University Library"/>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Latitude *</label>
                <input value={form.lat} onChange={e => setForm({...form,lat:e.target.value})} className="input" placeholder="5.4780"/>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Longitude *</label>
                <input value={form.lng} onChange={e => setForm({...form,lng:e.target.value})} className="input" placeholder="7.5435"/>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm({...form,category:e.target.value})} className="input py-2 text-sm">
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Hours</label>
                <input value={form.hours} onChange={e => setForm({...form,hours:e.target.value})} className="input" placeholder="Mon-Fri 9AM-5PM"/>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Description</label>
                <input value={form.description} onChange={e => setForm({...form,description:e.target.value})} className="input" placeholder="Brief description of this location"/>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Directions (shown to AI & students)</label>
                <textarea rows={3} value={form.directions} onChange={e => setForm({...form,directions:e.target.value})} className="input resize-none" placeholder="How to get to this location from the main gate..."/>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={save} disabled={saving || !form.name || !form.lat || !form.lng} className="btn-primary flex items-center gap-1.5">
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Saving...</> : <><Save className="w-3.5 h-3.5"/>{editing?'Update':'Add'} Location</>}
              </button>
              <button onClick={() => { setAdding(false); setEditing(null) }} className="btn-outline">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : (
          <div className="space-y-2">
            {locs.map(loc => (
              <div key={loc.id} className="bg-white border border-[#e8e8e8] rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 border border-[#e8e8e8] rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-[#1a6b3a]"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#0a0a0a] text-sm">{loc.name}</p>
                    <span className="badge badge-gray text-[9px]">{loc.category}</span>
                  </div>
                  <p className="text-[#6b6b6b] text-xs mt-0.5 line-clamp-1">{loc.description}</p>
                  {loc.directions && <p className="text-[#aaa] text-[10px] mt-0.5 line-clamp-1">Directions: {loc.directions}</p>}
                  <p className="text-[#aaa] text-[10px] mt-0.5">Lat: {loc.lat}, Lng: {loc.lng}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => startEdit(loc)} className="p-1.5 rounded-lg hover:bg-[#f9f9f7] text-[#6b6b6b] hover:text-[#0a0a0a] transition-all">
                    <Edit2 className="w-3.5 h-3.5"/>
                  </button>
                  <button onClick={() => del(loc.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500 transition-all">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
