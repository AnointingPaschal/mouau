'use client'
import { useState, useEffect } from 'react'
import AdminShell from '@/components/AdminShell'
import { Plus, Trash2, Save, Loader2, GripVertical, HelpCircle, MessageCircle, Link2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

type FAQ = { q: string; a: string }

export default function AdminFaqPage() {
  const [faqs,    setFaqs]    = useState<FAQ[]>([])
  const [waLink,  setWaLink]  = useState('')
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')
  const [toastOk, setToastOk] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  const show = (msg: string, ok = true) => {
    setToast(msg); setToastOk(ok); setTimeout(() => setToast(''), 4000)
  }

  useEffect(() => {
    fetch('/api/admin/faq').then(r => r.json()).then(d => {
      setFaqs(d.faqs || [])
      setWaLink(d.waLink || '')
      setLoading(false)
    })
  }, [])

  const addFaq = () => {
    setFaqs(prev => [...prev, { q: '', a: '' }])
    setExpanded(faqs.length)
  }

  const remove = (i: number) => {
    setFaqs(prev => prev.filter((_, idx) => idx !== i))
    if (expanded === i) setExpanded(null)
  }

  const update = (i: number, field: 'q' | 'a', val: string) => {
    setFaqs(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: val } : f))
  }

  const moveUp = (i: number) => {
    if (i === 0) return
    setFaqs(prev => { const n = [...prev]; [n[i-1], n[i]] = [n[i], n[i-1]]; return n })
    setExpanded(i - 1)
  }

  const moveDown = (i: number) => {
    if (i >= faqs.length - 1) return
    setFaqs(prev => { const n = [...prev]; [n[i], n[i+1]] = [n[i+1], n[i]]; return n })
    setExpanded(i + 1)
  }

  const save = async () => {
    const valid = faqs.filter(f => f.q.trim() && f.a.trim())
    if (valid.length !== faqs.length) { show('Fill in all question and answer fields before saving.', false); return }
    setSaving(true)
    const r = await fetch('/api/admin/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faqs: valid, waLink: waLink.trim() })
    })
    const d = await r.json()
    setSaving(false)
    if (d.ok) show('Saved successfully!')
    else show('Save failed. Please try again.', false)
  }

  return (
    <AdminShell>
      <div className="p-4 pb-28 max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-[#0a0a0a]">FAQ & Community</h1>
          <p className="text-[#6b6b6b] text-sm mt-1">Manage FAQ questions shown on the student dashboard and the WhatsApp group link.</p>
        </div>

        {/* WhatsApp Group Link */}
        <div className="bg-white rounded-2xl border border-[#e8e8e8] p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#075e54,#128c7e)'}}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.117 1.535 5.845L.057 23.571a.75.75 0 0 0 .915.903l5.913-1.55A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.713 9.713 0 0 1-4.925-1.338l-.353-.209-3.655.958.975-3.563-.23-.368A9.726 9.726 0 0 1 2.25 12c0-5.376 4.374-9.75 9.75-9.75s9.75 4.374 9.75 9.75-4.374 9.75-9.75 9.75z"/></svg>
            </div>
            <div>
              <p className="font-black text-[#0a0a0a] text-sm">WhatsApp Group Link</p>
              <p className="text-[#6b6b6b] text-[11px]">Shown as a join banner on the student dashboard</p>
            </div>
          </div>
          <div className="flex gap-2 items-center bg-[#f5f5f3] rounded-xl px-3 py-2.5 border border-[#e8e8e8]">
            <Link2 className="w-4 h-4 text-[#aaa] flex-shrink-0"/>
            <input
              type="url"
              placeholder="https://chat.whatsapp.com/..."
              value={waLink}
              onChange={e => setWaLink(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-[#0a0a0a] placeholder:text-[#bbb]"
            />
          </div>
          {waLink && !waLink.startsWith('https://chat.whatsapp.com/') && (
            <p className="text-amber-500 text-[11px] flex items-center gap-1">
              <AlertCircle className="w-3 h-3"/> Link should start with https://chat.whatsapp.com/
            </p>
          )}
          {waLink && (
            <p className="text-[11px] text-[#6b6b6b]">
              Leave blank to hide the WhatsApp banner from the dashboard.
            </p>
          )}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#1a6b3a]"/>
              <p className="font-black text-[#0a0a0a]">FAQ Questions <span className="text-[#aaa] font-normal text-sm">({faqs.length})</span></p>
            </div>
            <button onClick={addFaq}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
              style={{background:'linear-gradient(135deg,#1a6b3a,#145530)'}}>
              <Plus className="w-3.5 h-3.5"/> Add FAQ
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#1a6b3a]"/>
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#e8e8e8]">
              <HelpCircle className="w-8 h-8 text-[#ddd] mx-auto mb-2"/>
              <p className="text-[#aaa] text-sm font-medium">No FAQs yet</p>
              <p className="text-[#bbb] text-xs mt-1">Click &ldquo;Add FAQ&rdquo; to create your first question</p>
            </div>
          ) : (
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
                  {/* Row header */}
                  <div className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none"
                    onClick={() => setExpanded(expanded === i ? null : i)}>
                    <div className="w-6 h-6 rounded-full bg-[#1a6b3a] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="flex-1 min-w-0 text-sm font-semibold text-[#0a0a0a] truncate">
                      {faq.q || <span className="text-[#bbb] font-normal italic">Empty question…</span>}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); moveUp(i) }} disabled={i === 0}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#aaa] hover:text-[#0a0a0a] hover:bg-[#f0f0f0] disabled:opacity-30 transition-colors">
                        <ChevronUp className="w-3.5 h-3.5"/>
                      </button>
                      <button onClick={e => { e.stopPropagation(); moveDown(i) }} disabled={i >= faqs.length - 1}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#aaa] hover:text-[#0a0a0a] hover:bg-[#f0f0f0] disabled:opacity-30 transition-colors">
                        <ChevronDown className="w-3.5 h-3.5"/>
                      </button>
                      <button onClick={e => { e.stopPropagation(); remove(i) }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>

                  {/* Expanded editor */}
                  {expanded === i && (
                    <div className="px-4 pb-4 pt-0 space-y-2.5 border-t border-[#f0f0f0]">
                      <div className="pt-3">
                        <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide mb-1 block">Question</label>
                        <input
                          value={faq.q}
                          onChange={e => update(i, 'q', e.target.value)}
                          placeholder="e.g. How do I start registration?"
                          className="w-full bg-[#f5f5f3] rounded-xl px-3 py-2.5 text-sm text-[#0a0a0a] outline-none border border-transparent focus:border-[#1a6b3a] placeholder:text-[#bbb] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide mb-1 block">Answer</label>
                        <textarea
                          value={faq.a}
                          onChange={e => update(i, 'a', e.target.value)}
                          placeholder="Write a clear, helpful answer…"
                          rows={4}
                          className="w-full bg-[#f5f5f3] rounded-xl px-3 py-2.5 text-sm text-[#0a0a0a] outline-none border border-transparent focus:border-[#1a6b3a] placeholder:text-[#bbb] resize-none transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ask Anything CTA info */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
          <MessageCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"/>
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Students can ask their own questions on the <strong>Ask Anything</strong> page — FAQs here are shown on the dashboard as quick reference. Add the most common questions you get from students.
          </p>
        </div>

        {/* Save button */}
        <button onClick={save} disabled={saving || loading}
          className="w-full py-3.5 rounded-2xl font-black text-white text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          style={{background:'linear-gradient(135deg,#1a6b3a,#145530)'}}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin"/> Saving…</> : <><Save className="w-4 h-4"/> Save Changes</>}
        </button>

      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-2xl text-white text-sm font-bold flex items-center gap-2 shadow-xl z-50 ${toastOk ? 'bg-[#1a6b3a]' : 'bg-red-500'}`}>
          {toastOk ? <CheckCircle2 className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
          {toast}
        </div>
      )}
    </AdminShell>
  )
}
