'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Plus, Trash2, X, Save, Loader2, Shield, ShieldOff } from 'lucide-react'

type Admin = { id:string; email:string; name:string; is_super:boolean; active:boolean; created_at:string }

export default function AdminsPage() {
  const { token, admin: me } = useAdmin()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ email:'', name:'', password:'', is_super:false })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const load = () => {
    fetch('/api/admin/admins', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setAdmins(d.data||[]); setLoading(false) })
  }
  useEffect(() => { if (token) load() }, [token])
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const add = async () => {
    if (!form.email || !form.name || !form.password) { showToast('All fields required'); return }
    setSaving(true)
    const res = await fetch('/api/admin/admins', { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify(form) })
    const d = await res.json()
    setSaving(false)
    if (!res.ok) { showToast(d.error || 'Error'); return }
    setAdding(false); setForm({ email:'', name:'', password:'', is_super:false })
    showToast('Admin account created'); load()
  }

  const toggle = async (admin: Admin) => {
    await fetch('/api/admin/admins', { method:'PATCH', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({id:admin.id,active:!admin.active}) })
    load()
  }

  const del = async (admin: Admin) => {
    if (admin.id === me?.id) { showToast('You cannot delete your own account'); return }
    if (!confirm(`Delete ${admin.name}?`)) return
    await fetch('/api/admin/admins', { method:'DELETE', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({id:admin.id}) })
    showToast('Admin removed'); load()
  }

  return (
    <AdminShell>
      <div className="p-5 lg:p-8 max-w-2xl">
        {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2 rounded-xl text-xs font-medium">{toast}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest mb-1">SUPER ADMIN</p>
            <h1 className="text-xl font-black text-[#0a0a0a]">Admin Accounts</h1>
            <p className="text-[#6b6b6b] text-sm mt-1">Only super admins can manage admin accounts.</p>
          </div>
          {!adding && <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/>Add Admin</button>}
        </div>

        {adding && (
          <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 mb-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-[#0a0a0a] text-sm">New Admin Account</h3>
              <button onClick={() => setAdding(false)}><X className="w-4 h-4 text-[#aaa]"/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Full Name *</label>
                <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="input" placeholder="e.g. John Okonkwo"/>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} className="input" placeholder="admin@mouau.edu.ng"/>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Password *</label>
                <input type="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} className="input" placeholder="Min. 6 characters"/>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_super} onChange={e => setForm({...form,is_super:e.target.checked})} className="w-4 h-4 accent-[#1a6b3a]"/>
                <span className="text-sm font-medium text-[#0a0a0a]">Super Admin (can manage other admins)</span>
              </label>
              <div className="flex gap-2">
                <button onClick={add} disabled={saving} className="btn-primary flex items-center gap-1.5">
                  {saving?<><Loader2 className="w-3.5 h-3.5 animate-spin"/>Creating...</>:<><Save className="w-3.5 h-3.5"/>Create Admin</>}
                </button>
                <button onClick={() => setAdding(false)} className="btn-outline">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {loading ? <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div> : (
          <div className="space-y-2.5">
            {admins.map(admin => (
              <div key={admin.id} className={`bg-white border rounded-xl p-4 flex items-center gap-3 ${!admin.active ? 'opacity-50' : 'border-[#e8e8e8]'}`}>
                <div className="w-9 h-9 bg-[#0a0a0a] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-sm">{admin.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-[#0a0a0a] text-sm">{admin.name}</p>
                    {admin.is_super && <span className="badge bg-[#1a6b3a]/10 text-[#1a6b3a] text-[9px]">Super</span>}
                    {!admin.active && <span className="badge badge-gray text-[9px]">Inactive</span>}
                    {admin.id === me?.id && <span className="badge badge-gray text-[9px]">You</span>}
                  </div>
                  <p className="text-[#aaa] text-xs">{admin.email}</p>
                </div>
                {admin.id !== me?.id && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => toggle(admin)} className="p-1.5 rounded-lg hover:bg-[#f9f9f7] text-[#6b6b6b] transition-all">
                      {admin.active ? <ShieldOff className="w-3.5 h-3.5"/> : <Shield className="w-3.5 h-3.5 text-[#1a6b3a]"/>}
                    </button>
                    <button onClick={() => del(admin)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
