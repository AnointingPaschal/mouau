'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Plus, Trash2, Edit2, Save, X, Loader2, PlusCircle, MinusCircle, GraduationCap, UserCheck } from 'lucide-react'

type Step = { id: string; step_number: number; title: string; description: string; substeps: string[]; sort_order: number; active: boolean; student_type: string }

const TABS = [
  { id: 'new',       label: 'New Students',       icon: UserCheck,    desc: '100 Level freshers — admission & JAMB-based steps' },
  { id: 'returning', label: 'Returning Students',  icon: GraduationCap,desc: '200L+ — course reg, fees, clearance & more' },
]

export default function RegistrationPage() {
  const { token } = useAdmin()
  const [tab,     setTab]     = useState<'new'|'returning'>('new')
  const [steps,   setSteps]   = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Step | null>(null)
  const [adding,  setAdding]  = useState(false)
  const [form,    setForm]    = useState({ title:'', description:'', substeps:[''], step_number:1, sort_order:1, active:true })
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')

  const h = { Authorization: `Bearer ${token}` }
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const load = () => {
    setLoading(true)
    fetch(`/api/admin/registration?type=${tab}`, { headers: h })
      .then(r => r.json()).then(d => {
        setSteps((d.data || []).map((s: any) => ({
          ...s,
          substeps: Array.isArray(s.substeps) ? s.substeps : (() => { try { return JSON.parse(s.substeps || '[]') } catch { return [] } })()
        })))
        setLoading(false)
      })
  }

  useEffect(() => { if (token) load() }, [token, tab])

  const save = async () => {
    if (!form.title) return
    setSaving(true)
    const body = { ...form, student_type: tab, substeps: JSON.stringify(form.substeps.filter(Boolean)) }
    if (editing) {
      await fetch('/api/admin/registration', { method:'PATCH', headers:{...h,'Content-Type':'application/json'}, body: JSON.stringify({ id: editing.id, ...body }) })
    } else {
      await fetch('/api/admin/registration', { method:'POST', headers:{...h,'Content-Type':'application/json'}, body: JSON.stringify(body) })
    }
    setSaving(false); setAdding(false); setEditing(null)
    setForm({ title:'', description:'', substeps:[''], step_number: steps.length + 1, sort_order: steps.length + 1, active:true })
    showToast(editing ? 'Step updated' : 'Step added')
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this step?')) return
    await fetch('/api/admin/registration', { method:'DELETE', headers:{...h,'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
    showToast('Step deleted'); load()
  }

  const toggleActive = async (step: Step) => {
    await fetch('/api/admin/registration', { method:'PATCH', headers:{...h,'Content-Type':'application/json'}, body: JSON.stringify({ id: step.id, active: !step.active }) })
    load()
  }

  const startEdit = (step: Step) => {
    setEditing(step); setAdding(true)
    setForm({ title: step.title, description: step.description, substeps: step.substeps.length ? step.substeps : [''], step_number: step.step_number, sort_order: step.sort_order, active: step.active })
  }

  const cancelAdd = () => {
    setAdding(false); setEditing(null)
    setForm({ title:'', description:'', substeps:[''], step_number: steps.length + 1, sort_order: steps.length + 1, active:true })
  }

  return (
    <AdminShell>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium">
          {toast}
        </div>
      )}
      <div className="p-4 w-full pb-24 max-w-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
            <h1 className="font-black text-[#0a0a0a] text-2xl">Registration Guide</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">Separate guides for new and returning students</p>
          </div>
          <button onClick={() => { setAdding(true); setEditing(null); setForm({ title:'', description:'', substeps:[''], step_number: steps.length+1, sort_order: steps.length+1, active:true }) }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1a6b3a] text-white rounded-xl text-sm font-bold flex-shrink-0">
            <Plus className="w-4 h-4"/> Add Step
          </button>
        </div>

        {/* Student type tabs */}
        <div className="grid grid-cols-2 gap-2.5">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => { setTab(t.id as any); setAdding(false); setEditing(null) }}
                className={`flex items-start gap-2.5 p-3.5 rounded-2xl border-2 text-left transition-all
                  ${active ? 'border-[#1a6b3a] bg-[#f0f9f4]' : 'border-[#e8e8e8] bg-white hover:border-[#1a6b3a]/30'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-[#1a6b3a]' : 'bg-[#f0f0f0]'}`}>
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#aaa]'}`}/>
                </div>
                <div>
                  <p className={`font-bold text-xs ${active ? 'text-[#1a6b3a]' : 'text-[#0a0a0a]'}`}>{t.label}</p>
                  <p className="text-[9px] text-[#aaa] leading-snug mt-0.5">{t.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Add/Edit form */}
        {adding && (
          <div className="card p-4 space-y-3 border-2 border-[#1a6b3a]/30">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#0a0a0a]">{editing ? 'Edit Step' : `Add ${tab === 'new' ? 'Fresher' : 'Returning'} Step`}</h3>
              <button onClick={cancelAdd}><X className="w-4 h-4 text-[#aaa]"/></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1">Step #</label>
                <input type="number" value={form.step_number} onChange={e => setForm(p=>({...p,step_number:+e.target.value,sort_order:+e.target.value}))}
                  className="input w-full text-sm"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1">Active</label>
                <button onClick={() => setForm(p=>({...p,active:!p.active}))}
                  className={`w-full py-2 rounded-xl text-xs font-bold border-2 transition-all
                    ${form.active ? 'bg-[#1a6b3a] text-white border-[#1a6b3a]' : 'bg-white text-[#aaa] border-[#e8e8e8]'}`}>
                  {form.active ? 'Visible' : 'Hidden'}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))}
                placeholder="e.g. Course Registration" className="input w-full text-sm font-semibold"/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))}
                placeholder="Brief overview of this step" className="input w-full text-sm resize-none"/>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide">Sub-steps</label>
                <button onClick={() => setForm(p=>({...p,substeps:[...p.substeps,'']}))}
                  className="text-[#1a6b3a] flex items-center gap-1 text-[10px] font-semibold">
                  <PlusCircle className="w-3.5 h-3.5"/> Add
                </button>
              </div>
              <div className="space-y-1.5">
                {form.substeps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={s} onChange={e => { const ss=[...form.substeps]; ss[i]=e.target.value; setForm(p=>({...p,substeps:ss})) }}
                      placeholder={`Sub-step ${i+1}`} className="input flex-1 text-xs"/>
                    {form.substeps.length > 1 && (
                      <button onClick={() => setForm(p=>({...p,substeps:p.substeps.filter((_,j)=>j!==i)}))} className="text-red-400">
                        <MinusCircle className="w-4 h-4"/>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <button onClick={save} disabled={saving || !form.title}
              className="w-full py-2.5 text-sm font-bold text-white bg-[#1a6b3a] rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
              {saving ? 'Saving…' : editing ? 'Update Step' : 'Add Step'}
            </button>
          </div>
        )}

        {/* Steps list */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : steps.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-[#aaa] mb-1">No {tab === 'new' ? 'fresher' : 'returning student'} steps yet.</p>
            <p className="text-[11px] text-[#ccc]">Click "Add Step" to create the registration guide for {tab === 'new' ? '100 Level freshers' : 'returning students'}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map(step => (
              <div key={step.id} className={`card overflow-hidden transition-all ${!step.active?'opacity-50':''}`}>
                <div className="flex items-start justify-between gap-3 p-3.5">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ${step.active?'bg-[#0a0a0a] text-white':'bg-[#e8e8e8] text-[#aaa]'}`}>
                      {step.step_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0a0a0a] text-sm">{step.title}</p>
                      {step.description && <p className="text-[11px] text-[#6b6b6b] mt-0.5 leading-snug">{step.description}</p>}
                      {step.substeps.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                          {step.substeps.slice(0,3).map((s,i) => (
                            <li key={i} className="text-[10px] text-[#aaa] flex items-start gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-[#ccc] flex-shrink-0 mt-1.5"/>
                              <span className="truncate">{s}</span>
                            </li>
                          ))}
                          {step.substeps.length > 3 && <li className="text-[10px] text-[#1a6b3a]">+{step.substeps.length-3} more</li>}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => toggleActive(step)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all
                        ${step.active ? 'text-[#1a6b3a] border-[#1a6b3a]/30 bg-[#f0f9f4] hover:bg-[#e0f4e8]' : 'text-[#aaa] border-[#e8e8e8] hover:bg-[#f5f5f5]'}`}>
                      {step.active ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => startEdit(step)} className="w-7 h-7 rounded-lg bg-[#f0f0f0] flex items-center justify-center hover:bg-[#e8e8e8]">
                      <Edit2 className="w-3 h-3 text-[#6b6b6b]"/>
                    </button>
                    <button onClick={() => del(step.id)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100">
                      <Trash2 className="w-3 h-3 text-red-400"/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
