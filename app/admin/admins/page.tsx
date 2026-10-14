'use client'
import { useEffect, useState, useRef } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import {
  Plus, Trash2, X, Save, Loader2, Shield, ShieldOff,
  Search, UserPlus, Users, ChevronRight, CheckCircle2
} from 'lucide-react'

type Admin   = { id:string; email:string; name:string; is_super:boolean; active:boolean; created_at:string }
type Student = { id_number:string; name:string; email:string; department?:string; level?:string }

type Tab = 'list' | 'add-manual' | 'add-student'

export default function AdminsPage() {
  const { token, admin: me } = useAdmin()
  const [admins,   setAdmins]   = useState<Admin[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<Tab>('list')
  const [toast,    setToast]    = useState({ msg:'', ok:true })
  const [saving,   setSaving]   = useState(false)

  // Manual form
  const [form, setForm] = useState({ email:'', name:'', password:'', is_super:false })

  // Student picker
  const [query,      setQuery]      = useState('')
  const [students,   setStudents]   = useState<Student[]>([])
  const [searching,  setSearching]  = useState(false)
  const [picked,     setPicked]     = useState<Student|null>(null)
  const [stuPass,    setStuPass]    = useState('')
  const [stuSuper,   setStuSuper]   = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>|null>(null)

  const load = () => {
    fetch('/api/admin/admins', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setAdmins(d.data||[]); setLoading(false) })
  }
  useEffect(() => { if (token) load() }, [token])

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast({ msg:'', ok:true }), 3500)
  }

  // ── Student search ──────────────────────────────────────────────────────
  const searchStudents = async (q: string) => {
    if (!q.trim()) { setStudents([]); return }
    setSearching(true)
    try {
      const r = await fetch(`/api/admin/students?search=${encodeURIComponent(q)}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      setStudents(d.data || [])
    } catch { setStudents([]) }
    setSearching(false)
  }

  const handleQueryChange = (v: string) => {
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchStudents(v), 350)
  }

  // ── Add manual admin ────────────────────────────────────────────────────
  const addManual = async () => {
    if (!form.email || !form.name || !form.password) { showToast('All fields required', false); return }
    setSaving(true)
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify(form)
    })
    const d = await res.json()
    setSaving(false)
    if (!res.ok) { showToast(d.error || 'Error', false); return }
    setTab('list'); setForm({ email:'', name:'', password:'', is_super:false })
    showToast('Admin account created'); load()
  }

  // ── Promote student to admin ────────────────────────────────────────────
  const promoteStudent = async () => {
    if (!picked) return
    if (!stuPass || stuPass.length < 6) { showToast('Password must be at least 6 characters', false); return }
    // Check if already an admin
    if (admins.some(a => a.email.toLowerCase() === picked.email.toLowerCase())) {
      showToast('This student is already an admin', false); return
    }
    setSaving(true)
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({
        email:    picked.email,
        name:     picked.name,
        password: stuPass,
        is_super: stuSuper,
        student_id: picked.id_number,
      })
    })
    const d = await res.json()
    setSaving(false)
    if (!res.ok) { showToast(d.error || 'Error', false); return }
    setTab('list'); setPicked(null); setQuery(''); setStudents([]); setStuPass(''); setStuSuper(false)
    showToast(`${picked.name} promoted to admin`); load()
  }

  const toggle = async (admin: Admin) => {
    await fetch('/api/admin/admins', {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ id:admin.id, active:!admin.active })
    })
    load()
  }

  const del = async (admin: Admin) => {
    if (admin.id === me?.id) { showToast('You cannot delete your own account', false); return }
    if (!confirm(`Remove ${admin.name} as admin?`)) return
    await fetch('/api/admin/admins', {
      method: 'DELETE',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ id:admin.id })
    })
    showToast('Admin removed'); load()
  }

  return (
    <AdminShell>
      {toast.msg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-xl text-white text-xs font-medium flex items-center gap-2 ${toast.ok ? 'bg-[#1a6b3a]' : 'bg-[#b91c1c]'}`}>
          {toast.ok ? <CheckCircle2 className="w-3.5 h-3.5"/> : <X className="w-3.5 h-3.5"/>}
          {toast.msg}
        </div>
      )}

      <div className="p-4 max-w-xl pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">SUPER ADMIN</p>
            <h1 className="text-2xl font-black text-[#0a0a0a]">Admin Accounts</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">{admins.length} admin{admins.length!==1?'s':''} · only super admins can manage</p>
          </div>
          {tab === 'list' && (
            <button onClick={() => setTab('add-student')}
              className="flex items-center gap-1.5 bg-[#1a6b3a] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl">
              <Plus className="w-3.5 h-3.5"/> Add Admin
            </button>
          )}
          {tab !== 'list' && (
            <button onClick={() => { setTab('list'); setPicked(null); setQuery(''); setStudents([]) }}
              className="p-2 rounded-xl bg-[#f0f0f0] text-[#555]">
              <X className="w-4 h-4"/>
            </button>
          )}
        </div>

        {/* ── Admin list ── */}
        {tab === 'list' && (
          <>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
            ) : (
              <div className="space-y-2">
                {admins.map(admin => (
                  <div key={admin.id} className={`card p-4 flex items-center gap-3 ${!admin.active ? 'opacity-50' : ''}`}>
                    <div className="w-10 h-10 bg-[#0a0a0a] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-black text-sm">{admin.name[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-[#0a0a0a] text-sm">{admin.name}</p>
                        {admin.is_super && <span className="badge bg-[#1a6b3a]/10 text-[#1a6b3a] text-[9px] font-bold">Super</span>}
                        {!admin.active && <span className="badge bg-[#f0f0f0] text-[#aaa] text-[9px]">Inactive</span>}
                        {admin.id === me?.id && <span className="badge bg-[#f0f0f0] text-[#6b6b6b] text-[9px]">You</span>}
                      </div>
                      <p className="text-[#aaa] text-xs truncate">{admin.email}</p>
                    </div>
                    {admin.id !== me?.id && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => toggle(admin)}
                          className={`p-1.5 rounded-lg transition-all ${admin.active ? 'hover:bg-amber-50 text-[#aaa] hover:text-amber-500' : 'hover:bg-green-50 text-[#aaa] hover:text-[#1a6b3a]'}`}>
                          {admin.active ? <ShieldOff className="w-3.5 h-3.5"/> : <Shield className="w-3.5 h-3.5"/>}
                        </button>
                        <button onClick={() => del(admin)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500 transition-all">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {admins.length === 0 && (
                  <div className="card p-8 text-center text-[#aaa]">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                    <p className="text-sm">No admin accounts yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Add from students vs manual */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setTab('add-student')}
                className="card p-4 flex flex-col items-center gap-2 hover:border-[#1a6b3a] hover:bg-[#1a6b3a]/5 transition-all border border-[#e8e8e8]">
                <Users className="w-5 h-5 text-[#1a6b3a]"/>
                <p className="text-xs font-bold text-[#0a0a0a]">From Students</p>
                <p className="text-[10px] text-[#aaa] text-center">Search & promote a registered student</p>
              </button>
              <button onClick={() => setTab('add-manual')}
                className="card p-4 flex flex-col items-center gap-2 hover:border-[#1a6b3a] hover:bg-[#1a6b3a]/5 transition-all border border-[#e8e8e8]">
                <UserPlus className="w-5 h-5 text-[#1e3a8a]"/>
                <p className="text-xs font-bold text-[#0a0a0a]">Manual Entry</p>
                <p className="text-[10px] text-[#aaa] text-center">Create with email & password</p>
              </button>
            </div>
          </>
        )}

        {/* ── Add from students ── */}
        {tab === 'add-student' && (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-[#aaa] uppercase tracking-widest mb-3">From Registered Students</p>
              {!picked ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaa]"/>
                    <input
                      value={query}
                      onChange={e => handleQueryChange(e.target.value)}
                      placeholder="Search by name, ID, or email..."
                      className="input pl-9 text-sm w-full"
                      autoFocus
                    />
                    {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a6b3a] animate-spin"/>}
                  </div>

                  {students.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {students.map(s => {
                        const isAdmin = admins.some(a => a.email.toLowerCase() === s.email.toLowerCase())
                        return (
                          <button key={s.id_number} onClick={() => !isAdmin && setPicked(s)} disabled={isAdmin}
                            className={`w-full card p-3 flex items-center gap-3 text-left transition-all ${isAdmin ? 'opacity-40 cursor-not-allowed' : 'hover:border-[#1a6b3a] hover:bg-[#1a6b3a]/5'}`}>
                            <div className="w-9 h-9 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-black text-sm">{s.name[0].toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[#0a0a0a] text-sm truncate">{s.name}</p>
                              <p className="text-[10px] text-[#aaa]">{s.id_number} · {s.email}</p>
                              {s.department && <p className="text-[10px] text-[#bbb]">{s.department} {s.level ? `· ${s.level}` : ''}</p>}
                            </div>
                            {isAdmin
                              ? <span className="text-[9px] font-bold text-[#1a6b3a] bg-[#1a6b3a]/10 px-2 py-0.5 rounded-full flex-shrink-0">Admin</span>
                              : <ChevronRight className="w-4 h-4 text-[#ccc] flex-shrink-0"/>
                            }
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {query && !searching && students.length === 0 && (
                    <p className="text-center text-xs text-[#aaa] mt-4">No students found for &ldquo;{query}&rdquo;</p>
                  )}
                </>
              ) : (
                /* Picked a student — set password + role */
                <div className="space-y-4">
                  <div className="card p-4 flex items-center gap-3 border border-[#1a6b3a]/30 bg-[#1a6b3a]/5">
                    <div className="w-10 h-10 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-black">{picked.name[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0a0a0a] text-sm">{picked.name}</p>
                      <p className="text-[10px] text-[#aaa]">{picked.id_number} · {picked.email}</p>
                    </div>
                    <button onClick={() => setPicked(null)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa]">
                      <X className="w-3.5 h-3.5"/>
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide mb-1 block">Admin Password *</label>
                    <input type="password" value={stuPass} onChange={e => setStuPass(e.target.value)}
                      className="input text-sm" placeholder="Set a password for admin login (min 6 chars)"/>
                    <p className="text-[9px] text-[#bbb] mt-1">This is separate from their student login</p>
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl hover:bg-[#f9f9f7]">
                    <input type="checkbox" checked={stuSuper} onChange={e => setStuSuper(e.target.checked)}
                      className="w-4 h-4 accent-[#1a6b3a]"/>
                    <div>
                      <p className="text-sm font-semibold text-[#0a0a0a]">Super Admin</p>
                      <p className="text-[10px] text-[#aaa]">Can manage other admin accounts</p>
                    </div>
                  </label>

                  <button onClick={promoteStudent} disabled={saving}
                    className="w-full py-3 bg-[#1a6b3a] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                    {saving
                      ? <><Loader2 className="w-4 h-4 animate-spin"/>Promoting...</>
                      : <><Shield className="w-4 h-4"/>Promote to Admin</>
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Manual add form ── */}
        {tab === 'add-manual' && (
          <div className="card p-5 space-y-3">
            <p className="text-[10px] font-black text-[#aaa] uppercase tracking-widest mb-1">New Admin Account</p>
            <div>
              <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide mb-1 block">Full Name *</label>
              <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="input" placeholder="e.g. John Okonkwo"/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide mb-1 block">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} className="input" placeholder="admin@mouau.edu.ng"/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide mb-1 block">Password *</label>
              <input type="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} className="input" placeholder="Min. 6 characters"/>
            </div>
            <label className="flex items-center gap-2 cursor-pointer py-1">
              <input type="checkbox" checked={form.is_super} onChange={e => setForm({...form,is_super:e.target.checked})} className="w-4 h-4 accent-[#1a6b3a]"/>
              <span className="text-sm font-medium text-[#0a0a0a]">Super Admin (can manage other admins)</span>
            </label>
            <div className="flex gap-2 pt-1">
              <button onClick={addManual} disabled={saving}
                className="flex-1 py-3 bg-[#1a6b3a] rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5">
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Creating...</> : <><Save className="w-3.5 h-3.5"/>Create Admin</>}
              </button>
              <button onClick={() => setTab('list')} className="flex-1 py-3 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
