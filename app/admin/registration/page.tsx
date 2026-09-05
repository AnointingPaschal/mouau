'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Plus, Trash2, Edit2, Save, X, Loader2, GripVertical, PlusCircle, MinusCircle } from 'lucide-react'

type Step = { id: string; step_number: number; title: string; description: string; substeps: string[]; sort_order: number; active: boolean }

export default function RegistrationPage() {
  const { token } = useAdmin()
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Step | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', substeps: [''], step_number: 1, sort_order: 1, active: true })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const h = { Authorization: `Bearer ${token}` }

  const load = () => {
    fetch('/api/admin/registration', { headers: h })
      .then(r => r.json()).then(d => {
        setSteps((d.data || []).map((s: any) => ({ ...s, substeps: Array.isArray(s.substeps) ? s.substeps : JSON.parse(s.substeps || '[]') })))
        setLoading(false)
      })
  }
  useEffect(() => { if (token) load() }, [token])
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const save = async () => {
    if (!form.title) return
    setSaving(true)
    const body = { ...form, substeps: JSON.stringify(form.substeps.filter(Boolean)) }
    if (editing) {
      await fetch('/api/admin/registration', { method: 'PATCH', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...body }) })
    } else {
      await fetch('/api/admin/registration', { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setSaving(false); setAdding(false); setEditing(null)
    setForm({ title: '', description: '', substeps: [''], step_number: 1, sort_order: 1, active: true })
    showToast(editing ? 'Step updated' : 'Step added'); load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this step?')) return
    await fetch('/api/admin/registration', { method: 'DELETE', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    showToast('Step deleted'); load()
  }

  const toggleActive = async (step: Step) => {
    await fetch('/api/admin/registration', { method: 'PATCH', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: step.id, active: !step.active }) })
    load()
  }

  const startEdit = (step: Step) => {
    setEditing(step); setAdding(true)
    setForm({ title: step.title, description: step.description, substeps: step.substeps.length ? step.substeps : [''], step_number: step.step_number, sort_order: step.sort_order, active: step.active })
  }

  const addSubstep = () => setForm(f => ({ ...f, substeps: [...f.substeps, ''] }))
  const removeSubstep = (i: number) => setForm(f => ({ ...f, substeps: f.substeps.filter((_, idx) => idx !== i) }))
  const updateSubstep = (i: number, val: string) => setForm(f => ({ ...f, substeps: f.substeps.map((s, idx) => idx === i ? val : s) }))

  return (
    <AdminShell>
      <div className="p-5 lg:p-8 max-w-2xl">
        {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2 rounded-xl text-xs font-medium animate-slide-up">{toast}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest mb-1">ADMIN</p>
            <h1 className="text-xl font-black text-[#0a0a0a]">Registration Guide</h1>
            <p className="text-[#6b6b6b] text-sm mt-1">Edit the step-by-step checklist shown to students.</p>
          </div>
          {!adding && (
            <button onClick={() => {
              setAdding(true); setEditing(null)
              const nextNum = (steps.length > 0 ? Math.max(...steps.map(s => s.step_number)) : 0) + 1
              setForm({ title: '', description: '', substeps: [''], step_number: nextNum, sort_order: nextNum, active: true })
            }} className="btn-primary flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/>Add Step</button>
          )}
        </div>

        {adding && (
          <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 mb-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-[#0a0a0a] text-sm">{editing ? 'Edit Step' : 'New Step'}</h3>
              <button onClick={() => { setAdding(false); setEditing(null) }}><X className="w-4 h-4 text-[#aaa]"/></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Step Number</label>
                  <input type="number" value={form.step_number} onChange={e => setForm({ ...form, step_number: parseInt(e.target.value) || 1, sort_order: parseInt(e.target.value) || 1 })} className="input"/>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-[#1a6b3a]"/>
                    <span className="text-sm font-medium text-[#0a0a0a]">Active</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Step Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" placeholder="e.g. JAMB Admission Verification"/>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" placeholder="Brief description of this step"/>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">Substeps (checklist items)</label>
                  <button onClick={addSubstep} className="flex items-center gap-1 text-xs text-[#1a6b3a] font-semibold hover:underline">
                    <PlusCircle className="w-3.5 h-3.5"/>Add
                  </button>
                </div>
                <div className="space-y-1.5">
                  {form.substeps.map((sub, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <GripVertical className="w-3.5 h-3.5 text-[#ddd] flex-shrink-0"/>
                      <input value={sub} onChange={e => updateSubstep(i, e.target.value)} className="input flex-1 py-1.5 text-xs" placeholder={`Substep ${i + 1}...`}/>
                      <button onClick={() => removeSubstep(i)} className="text-[#ddd] hover:text-red-400 flex-shrink-0">
                        <MinusCircle className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={save} disabled={saving || !form.title} className="btn-primary flex items-center gap-1.5">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Saving...</> : <><Save className="w-3.5 h-3.5"/>{editing ? 'Update' : 'Add'} Step</>}
                </button>
                <button onClick={() => { setAdding(false); setEditing(null) }} className="btn-outline">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : (
          <div className="space-y-2.5">
            {steps.map(step => (
              <div key={step.id} className={`bg-white border border-[#e8e8e8] rounded-xl p-4 ${!step.active ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-[#0a0a0a] rounded-lg flex items-center justify-center flex-shrink-0 text-white font-black text-xs">
                    {step.step_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#0a0a0a] text-sm">{step.title}</p>
                      {!step.active && <span className="badge badge-gray text-[9px]">Hidden</span>}
                    </div>
                    <p className="text-[#aaa] text-xs mt-0.5">{step.description}</p>
                    {step.substeps.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {step.substeps.map((sub, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-[#ddd] mt-1.5 flex-shrink-0"/>
                            <p className="text-[10px] text-[#6b6b6b]">{sub}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => toggleActive(step)} className={`p-1.5 rounded-lg transition-all text-xs font-semibold px-2 ${step.active ? 'bg-[#1a6b3a]/10 text-[#1a6b3a] hover:bg-red-50 hover:text-red-500' : 'bg-[#f9f9f7] text-[#aaa] hover:text-[#1a6b3a]'}`}>
                      {step.active ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => startEdit(step)} className="p-1.5 rounded-lg hover:bg-[#f9f9f7] text-[#6b6b6b] transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                    <button onClick={() => del(step.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
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
