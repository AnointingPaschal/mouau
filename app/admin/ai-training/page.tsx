'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Plus, Trash2, Save, X, Loader2, Brain, ToggleLeft, ToggleRight } from 'lucide-react'

type Entry = { id:string; question:string; answer:string; category:string; active:boolean; created_at:string }

export default function AITrainingPage() {
  const { token } = useAdmin()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ question:'', answer:'', category:'general' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const load = () => {
    fetch('/api/admin/ai-training', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setEntries(d.data || []); setLoading(false) })
  }
  useEffect(() => { if (token) load() }, [token])
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const add = async () => {
    if (!form.question || !form.answer) { showToast('Question and answer are required'); return }
    setSaving(true)
    await fetch('/api/admin/ai-training', { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify(form) })
    setSaving(false); setAdding(false); setForm({ question:'', answer:'', category:'general' })
    showToast('Training entry added'); load()
  }

  const toggle = async (entry: Entry) => {
    await fetch('/api/admin/ai-training', { method:'PATCH', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({id:entry.id,active:!entry.active}) })
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this training entry?')) return
    await fetch('/api/admin/ai-training', { method:'DELETE', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body:JSON.stringify({id}) })
    showToast('Entry deleted'); load()
  }

  return (
    <AdminShell>
      <div className="p-5 lg:p-8 max-w-3xl">
        {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2 rounded-xl text-xs font-medium animate-slide-up">{toast}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest mb-1">ADMIN</p>
            <h1 className="text-xl font-black text-[#0a0a0a]">AI Training</h1>
            <p className="text-[#6b6b6b] text-sm mt-1">Add Q&amp;A pairs to teach the AI assistant about MOUAU. Active entries are sent with every chat request.</p>
          </div>
          {!adding && (
            <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5"/>Add Entry
            </button>
          )}
        </div>

        <div className="bg-[#f9f9f7] border border-[#e8e8e8] rounded-xl p-4 mb-5 flex items-start gap-3">
          <Brain className="w-4 h-4 text-[#1a6b3a] flex-shrink-0 mt-0.5"/>
          <div>
            <p className="font-semibold text-[#0a0a0a] text-xs">How AI training works</p>
            <p className="text-[#6b6b6b] text-xs mt-0.5 leading-relaxed">Active Q&A pairs are injected into the AI system prompt as facts. The AI will use this knowledge when answering student questions. Write clear, factual answers without markdown formatting.</p>
          </div>
        </div>

        {adding && (
          <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 mb-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-[#0a0a0a] text-sm">New Training Entry</h3>
              <button onClick={() => setAdding(false)}><X className="w-4 h-4 text-[#aaa]"/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm({...form,category:e.target.value})} className="input py-2 text-sm">
                  {['general','registration','navigation','fees','academic','campus-life','clearance'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Question *</label>
                <input value={form.question} onChange={e => setForm({...form,question:e.target.value})} className="input" placeholder="What is the deadline for course registration?"/>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-1 block">Answer * (plain text, no markdown)</label>
                <textarea rows={4} value={form.answer} onChange={e => setForm({...form,answer:e.target.value})} className="input resize-none" placeholder="Course registration for the current semester closes on the last day of the second week of lectures. Late registration incurs a penalty fee. Log into the portal at mouau.edu.ng to register your courses."/>
              </div>
              <div className="flex gap-2">
                <button onClick={add} disabled={saving} className="btn-primary flex items-center gap-1.5">
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/>Saving...</> : <><Save className="w-3.5 h-3.5"/>Save Entry</>}
                </button>
                <button onClick={() => setAdding(false)} className="btn-outline">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">{entries.filter(e => e.active).length} ACTIVE · {entries.length} TOTAL</p>
            {entries.map(entry => (
              <div key={entry.id} className={`bg-white border rounded-xl p-4 transition-all ${entry.active ? 'border-[#e8e8e8]' : 'border-[#f0f0f0] opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge badge-gray text-[9px]">{entry.category}</span>
                      {entry.active ? <span className="badge badge-green text-[9px]">Active</span> : <span className="badge badge-gray text-[9px]">Inactive</span>}
                    </div>
                    <p className="font-bold text-[#0a0a0a] text-sm leading-tight">{entry.question}</p>
                    <p className="text-[#6b6b6b] text-xs mt-1 leading-relaxed line-clamp-3">{entry.answer}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => toggle(entry)} className="p-1.5 rounded-lg hover:bg-[#f9f9f7] text-[#6b6b6b] transition-all">
                      {entry.active ? <ToggleRight className="w-4 h-4 text-[#1a6b3a]"/> : <ToggleLeft className="w-4 h-4"/>}
                    </button>
                    <button onClick={() => del(entry.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500 transition-all">
                      <Trash2 className="w-3.5 h-3.5"/>
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
