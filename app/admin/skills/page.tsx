'use client'
import { useEffect, useState, useRef } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import Link from 'next/link'
import { Plus, Zap, Users, Loader2, Eye, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

type Skill = { id:string; title:string; category:string; level:string; active:boolean; sort_order:number }

const CATEGORIES = ['Tech','Business','Creative','Vocational','Ministry','Academic','General']
const LEVELS     = ['Beginner','Intermediate','Advanced']

export default function AdminSkillsPage() {
  const { token } = useAdmin()
  const authH = { Authorization: `Bearer ${token}` }
  const [skills,   setSkills]   = useState<Skill[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState('')
  const [form,     setForm]     = useState({ title:'', category:'Tech', level:'Beginner', tagline:'', instructor:'' })

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const load = () => {
    if (!token) return
    fetch('/api/admin/skills', { headers: authH })
      .then(r => r.json()).then(d => { setSkills(d.data || []); setLoading(false) })
  }
  useEffect(() => { load() }, [token])

  const create = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const r = await fetch('/api/admin/skills', { method:'POST', headers:{'Content-Type':'application/json',...authH}, body:JSON.stringify(form) })
    const d = await r.json()
    setSaving(false)
    if (d.data) { setSkills(p => [d.data, ...p]); setForm({ title:'', category:'Tech', level:'Beginner', tagline:'', instructor:'' }); setShowForm(false); showToast('Skill created!') }
    else showToast(d.error || 'Failed')
  }

  const toggle = async (skill: Skill) => {
    await fetch(`/api/admin/skills/${skill.id}`, { method:'PUT', headers:{'Content-Type':'application/json',...authH}, body:JSON.stringify({ active: !skill.active }) })
    setSkills(p => p.map(s => s.id === skill.id ? {...s, active: !s.active} : s))
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this skill and all its data?')) return
    await fetch(`/api/admin/skills/${id}`, { method:'DELETE', headers: authH })
    setSkills(p => p.filter(s => s.id !== id))
    showToast('Deleted')
  }

  return (
    <AdminShell>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium">
          <Zap className="w-3.5 h-3.5 text-[#C9A227]"/> {toast}
        </div>
      )}
      <div className="p-4 w-full pb-24 space-y-4 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
            <h1 className="font-black text-[#0a0a0a] text-2xl">Skills</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">Manage skill acquisition programs</p>
          </div>
          <button onClick={() => setShowForm(p => !p)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1a6b3a] text-white rounded-xl text-sm font-bold">
            <Plus className="w-4 h-4"/> New Skill
          </button>
        </div>

        {/* New skill form */}
        {showForm && (
          <div className="card p-4 space-y-3 border-2 border-[#1a6b3a]/20">
            <h3 className="font-bold text-sm text-[#0a0a0a]">New Skill</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))}
                  placeholder="Skill title *" className="input w-full text-sm font-semibold"/>
              </div>
              <input value={form.tagline} onChange={e => setForm(p=>({...p,tagline:e.target.value}))}
                placeholder="Tagline" className="input w-full text-sm col-span-2"/>
              <select value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))} className="input text-sm">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={form.level} onChange={e => setForm(p=>({...p,level:e.target.value}))} className="input text-sm">
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
              <input value={form.instructor} onChange={e => setForm(p=>({...p,instructor:e.target.value}))}
                placeholder="Instructor name" className="input text-sm col-span-2"/>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 text-xs font-semibold text-[#aaa] border border-[#e8e8e8] rounded-xl">Cancel</button>
              <button onClick={create} disabled={saving || !form.title.trim()} className="flex-1 py-2 text-xs font-bold text-white bg-[#1a6b3a] rounded-xl disabled:opacity-50">
                {saving ? 'Creating…' : 'Create Skill'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : skills.length === 0 ? (
          <div className="card p-10 text-center">
            <Zap className="w-8 h-8 text-[#ddd] mx-auto mb-2"/>
            <p className="text-sm text-[#aaa]">No skills yet. Create your first skill above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {skills.map(skill => (
              <div key={skill.id} className={`card p-3.5 flex items-center gap-3 transition-all ${!skill.active?'opacity-60':''}`}>
                <div className="w-9 h-9 bg-[#1a6b3a]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-[#1a6b3a]"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#0a0a0a] text-sm truncate">{skill.title}</p>
                  <div className="flex gap-1.5 mt-0.5">
                    <span className="text-[9px] font-semibold text-[#aaa]">{skill.category}</span>
                    <span className="text-[9px] text-[#ddd]">·</span>
                    <span className="text-[9px] font-semibold text-[#aaa]">{skill.level}</span>
                    {!skill.active && <span className="text-[9px] font-bold text-red-400">· Hidden</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Link href={`/admin/skills/${skill.id}`}
                    className="w-8 h-8 bg-[#f9f9f7] rounded-lg flex items-center justify-center hover:bg-[#e8e8e8] transition-colors">
                    <Eye className="w-3.5 h-3.5 text-[#6b6b6b]"/>
                  </Link>
                  <button onClick={() => toggle(skill)}
                    className="w-8 h-8 bg-[#f9f9f7] rounded-lg flex items-center justify-center hover:bg-[#e8e8e8] transition-colors">
                    {skill.active ? <ToggleRight className="w-3.5 h-3.5 text-[#1a6b3a]"/> : <ToggleLeft className="w-3.5 h-3.5 text-[#aaa]"/>}
                  </button>
                  <button onClick={() => remove(skill.id)}
                    className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-400"/>
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
