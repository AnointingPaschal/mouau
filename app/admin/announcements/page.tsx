'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Plus, Trash2, Edit2, Save, X, Loader2, Pin } from 'lucide-react'

type Ann = { id:string; title:string; body:string; type:string; pinned:boolean; created_at:string }

export default function AnnouncementsPage() {
  const { token } = useAdmin()
  const [anns, setAnns] = useState<Ann[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Ann|null>(null)
  const [form, setForm] = useState({ title:'', body:'', type:'info', pinned:false })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const load = () => {
    fetch('/api/admin/announcements', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setAnns(d.data||[]); setLoading(false) })
  }
  useEffect(() => { if (token) load() }, [token])
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const save = async () => {
    if (!form.title) return
    setSaving(true)
    if (editing) {
      await fetch('/api/admin/announcements', { method:'PATCH', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({id:editing.id,...form}) })
    } else {
      await fetch('/api/admin/announcements', { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify(form) })
    }
    setSaving(false); setAdding(false); setEditing(null); setForm({ title:'', body:'', type:'info', pinned:false })
    showToast(editing ? 'Updated' : 'Announcement posted'); load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    await fetch('/api/admin/announcements', { method:'DELETE', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({id}) })
    showToast('Deleted'); load()
  }

  const startEdit = (ann: Ann) => {
    setEditing(ann); setAdding(true)
    setForm({ title:ann.title, body:ann.body, type:ann.type, pinned:ann.pinned })
  }

  return (
    <AdminShell>
      <div className="p-5 lg:p-8 max-w-2xl">
        {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2 rounded-xl text-xs font-medium">{toast}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest mb-1">ADMIN</p>
            <h1 className="text-xl font-black text-[#0a0a0a]">Announcements</h1>
            <p className="text-[#6b6b6b] text-sm mt-1">Post updates visible to all students on their dashboard.</p>
          </div>
          {!adding && <button onClick={() => { setAdding(true); setEditing(null); setForm({ title:'', body:'', type:'info', pinned:false }) }} className="btn-primary flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/>New</button>}
        </div>

        {adding && (
          <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 mb-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-[#0a0a0a] text-sm">{editing?'Edit':'New'} Announcement</h3>
              <button onClick={() => { setAdding(false); setEditing(null) }}><X className="w-4 h-4 text-[#aaa]"/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Title *</label>
                <input value={form.title} onChange={e => setForm({...form,title:e.target.value})} className="input" placeholder="Registration deadline extended"/>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Body</label>
                <textarea rows={3} value={form.body} onChange={e => setForm({...form,body:e.target.value})} className="input resize-none" placeholder="Provide more details here..."/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm({...form,type:e.target.value})} className="input py-2 text-sm">
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.pinned} onChange={e => setForm({...form,pinned:e.target.checked})} className="w-4 h-4 accent-[#1a6b3a]"/>
                    <span className="text-sm font-medium text-[#0a0a0a]">Pin to top</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={saving||!form.title} className="btn-primary flex items-center gap-1.5">
                  {saving?<><Loader2 className="w-3.5 h-3.5 animate-spin"/>Saving...</>:<><Save className="w-3.5 h-3.5"/>{editing?'Update':'Post'}</>}
                </button>
                <button onClick={() => { setAdding(false); setEditing(null) }} className="btn-outline">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {loading ? <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div> : (
          <div className="space-y-2.5">
            {anns.length === 0 && <div className="card p-8 text-center"><p className="text-[#aaa] text-sm">No announcements yet.</p></div>}
            {anns.map(ann => (
              <div key={ann.id} className="bg-white border border-[#e8e8e8] rounded-xl p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`badge text-[9px] ${ann.type==='warning'?'bg-amber-50 text-amber-600':ann.type==='success'?'bg-green-50 text-[#1a6b3a]':ann.type==='event'?'bg-blue-50 text-blue-600':'badge-gray'}`}>{ann.type}</span>
                    {ann.pinned && <span className="badge bg-[#0a0a0a] text-white text-[9px] flex items-center gap-0.5"><Pin className="w-2 h-2"/>Pinned</span>}
                  </div>
                  <p className="font-bold text-[#0a0a0a] text-sm">{ann.title}</p>
                  {ann.body && <p className="text-[#6b6b6b] text-xs mt-1 line-clamp-2">{ann.body}</p>}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => startEdit(ann)} className="p-1.5 rounded-lg hover:bg-[#f9f9f7] text-[#6b6b6b] transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                  <button onClick={() => del(ann.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
