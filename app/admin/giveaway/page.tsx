'use client'
import { useState, useEffect } from 'react'
import AdminShell from '@/components/AdminShell'
import { Gift, Plus, Trash2, Edit2, Loader2, CheckCircle2, XCircle, Trophy, Users, Zap, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

type Task = { id: string; label: string; type: 'whatsapp'|'forum'|'share'|'custom'; value: string; bonus_entries: number }
type ClaimField = { label: string; required: boolean }
type Giveaway = {
  id: string; title: string; description: string; prize_type: 'wallet'|'announcement'|'custom'
  prize_amount: number; prize_label: string; claim_fields: ClaimField[]; tasks: Task[]
  entry_count: number; active: boolean; ended: boolean; winner_id: string; winner_name: string
  winner_confirmed: boolean; deadline: string; image_url: string; created_at: string
}

const BLANK: Partial<Giveaway> = {
  title:'', description:'', prize_type:'announcement', prize_amount:0, prize_label:'',
  claim_fields:[], tasks:[], active:false, ended:false, deadline:'',
}

function TaskRow({ task, onChange, onRemove }: { task:Task; onChange:(t:Task)=>void; onRemove:()=>void }) {
  return (
    <div className="flex gap-2 items-start bg-[#f9f9f7] rounded-xl p-3 border border-[#e8e8e8]">
      <div className="flex-1 space-y-2">
        <input value={task.label} onChange={e => onChange({...task, label:e.target.value})}
          placeholder="Task description (e.g. Join our WhatsApp group)" className="input-field text-xs py-2"/>
        <div className="flex gap-2">
          <select value={task.type} onChange={e => onChange({...task, type:e.target.value as Task['type']})}
            className="input-field text-xs py-2 flex-1">
            <option value="whatsapp">WhatsApp join</option>
            <option value="forum">Post in forum</option>
            <option value="share">Share app</option>
            <option value="custom">Custom</option>
          </select>
          <input value={task.value} onChange={e => onChange({...task, value:e.target.value})}
            placeholder="Link or value" className="input-field text-xs py-2 flex-1"/>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#6b6b6b] whitespace-nowrap">+entries</span>
            <input type="number" min={1} max={10} value={task.bonus_entries}
              onChange={e => onChange({...task, bonus_entries:Number(e.target.value)})}
              className="input-field text-xs py-2 w-16"/>
          </div>
        </div>
      </div>
      <button onClick={onRemove} className="text-red-400 hover:text-red-600 mt-1"><Trash2 className="w-4 h-4"/></button>
    </div>
  )
}

function ClaimFieldRow({ field, onChange, onRemove }: { field:ClaimField; onChange:(f:ClaimField)=>void; onRemove:()=>void }) {
  return (
    <div className="flex gap-2 items-center bg-[#f9f9f7] rounded-xl p-2.5 border border-[#e8e8e8]">
      <input value={field.label} onChange={e => onChange({...field, label:e.target.value})}
        placeholder="Field label (e.g. Phone Number)" className="input-field text-xs py-2 flex-1"/>
      <label className="flex items-center gap-1 text-xs text-[#6b6b6b] whitespace-nowrap cursor-pointer">
        <input type="checkbox" checked={field.required} onChange={e => onChange({...field, required:e.target.checked})} className="w-3 h-3"/>
        Required
      </label>
      <button onClick={onRemove} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
    </div>
  )
}

export default function AdminGiveawayPage() {
  const [giveaways, setGiveaways]   = useState<Giveaway[]>([])
  const [loading,   setLoading]     = useState(true)
  const [saving,    setSaving]      = useState(false)
  const [drawing,   setDrawing]     = useState(false)
  const [confirming,setConfirming]  = useState(false)
  const [toast,     setToast]       = useState('')
  const [toastType, setToastType]   = useState<'ok'|'err'>('ok')
  const [editing,   setEditing]     = useState<Partial<Giveaway>|null>(null)
  const [expanded,  setExpanded]    = useState<string|null>(null)

  const showToast = (m:string, t:'ok'|'err'='ok') => { setToast(m); setToastType(t); setTimeout(()=>setToast(''),4000) }

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/giveaway')
    const d = await r.json()
    setGiveaways(d.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!editing) return
    if (!editing.title?.trim()) { showToast('Title is required','err'); return }
    setSaving(true)
    const r = await fetch('/api/admin/giveaway', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(editing) })
    const d = await r.json()
    setSaving(false)
    if (!d.ok) { showToast(d.error || 'Save failed','err'); return }
    showToast('Saved!'); setEditing(null); load()
  }

  const toggleActive = async (gw: Giveaway) => {
    await fetch('/api/admin/giveaway', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id: gw.id, active: !gw.active, ended: gw.active ? gw.ended : false }) })
    load()
  }

  const draw = async (gw: Giveaway) => {
    setDrawing(true)
    const r = await fetch('/api/admin/giveaway/draw', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ giveawayId: gw.id }) })
    const d = await r.json()
    setDrawing(false)
    if (!d.ok) { showToast(d.error || 'Draw failed','err'); return }
    showToast(`Winner drawn: ${d.winner.student_name}`)
    load()
  }

  const confirmWinner = async (gw: Giveaway) => {
    setConfirming(true)
    const r = await fetch('/api/admin/giveaway/confirm', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ giveawayId: gw.id }) })
    const d = await r.json()
    setConfirming(false)
    if (!d.ok) { showToast(d.error || 'Confirm failed','err'); return }
    showToast('Winner confirmed! Giveaway ended.'); load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this giveaway?')) return
    await fetch(`/api/admin/giveaway?id=${id}`, { method:'DELETE' })
    load()
  }

  return (
    <AdminShell>
      <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-widest">ADMIN</p>
            <h1 className="text-2xl font-black text-[#0a0a0a]">Giveaways</h1>
          </div>
          <button onClick={() => setEditing({...BLANK})}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{background:'linear-gradient(135deg,#1a6b3a,#145530)'}}>
            <Plus className="w-4 h-4"/> New Giveaway
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${toastType==='ok'?'bg-[#f0faf4] text-[#1a6b3a]':'bg-red-50 text-red-600'}`}>
            {toastType==='ok' ? <CheckCircle2 className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
            {toast}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#1a6b3a]"/></div>
        ) : giveaways.length === 0 ? (
          <div className="text-center py-16 text-[#aaa]">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-30"/>
            <p className="font-semibold">No giveaways yet</p>
            <p className="text-xs mt-1">Create your first giveaway to engage students</p>
          </div>
        ) : (
          <div className="space-y-3">
            {giveaways.map(gw => (
              <div key={gw.id} className="bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden">
                {/* Card header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${gw.active ? 'bg-[#f0faf4]' : 'bg-[#f5f5f3]'}`}>
                      <Gift className={`w-5 h-5 ${gw.active ? 'text-[#1a6b3a]' : 'text-[#aaa]'}`}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-[#0a0a0a] text-sm">{gw.title}</p>
                        {gw.active && !gw.ended && <span className="badge badge-green text-[9px]">LIVE</span>}
                        {gw.ended && <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">ENDED</span>}
                        {gw.winner_confirmed && <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">WINNER ANNOUNCED</span>}
                      </div>
                      <p className="text-[11px] text-[#6b6b6b] mt-0.5 line-clamp-1">{gw.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#6b6b6b]">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3"/>{gw.entry_count} entries</span>
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3"/>{(gw.tasks||[]).length} tasks</span>
                        <span className="capitalize">{gw.prize_type === 'wallet' ? `₦${gw.prize_amount} wallet` : gw.prize_label || gw.prize_type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Winner pending confirmation */}
                  {gw.winner_id && !gw.winner_confirmed && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-xs font-bold text-amber-800 flex items-center gap-2"><Trophy className="w-3.5 h-3.5"/> Pending Winner: {gw.winner_name}</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">ID: {gw.winner_id}</p>
                      <button onClick={() => confirmWinner(gw)} disabled={confirming}
                        className="mt-2 w-full py-2 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 flex items-center justify-center gap-2 disabled:opacity-60">
                        {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <CheckCircle2 className="w-3.5 h-3.5"/>}
                        Confirm &amp; Announce Winner
                      </button>
                    </div>
                  )}

                  {gw.winner_confirmed && (
                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                      <p className="text-xs font-bold text-purple-800 flex items-center gap-2"><Trophy className="w-3.5 h-3.5"/> Winner: {gw.winner_name}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 px-4 pb-3 border-t border-[#f5f5f3] pt-3">
                  {/* Toggle active */}
                  <button onClick={() => toggleActive(gw)} disabled={gw.ended}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 ${gw.active ? 'bg-[#f0faf4] text-[#1a6b3a]' : 'bg-[#f5f5f3] text-[#6b6b6b]'}`}>
                    {gw.active ? <ToggleRight className="w-4 h-4"/> : <ToggleLeft className="w-4 h-4"/>}
                    {gw.active ? 'Active' : 'Inactive'}
                  </button>

                  {/* Draw */}
                  {!gw.ended && !gw.winner_confirmed && (
                    <button onClick={() => draw(gw)} disabled={drawing || gw.entry_count === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-40">
                      {drawing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trophy className="w-3.5 h-3.5"/>}
                      {gw.winner_id ? 'Redraw' : 'Draw Winner'}
                    </button>
                  )}

                  {/* View entries */}
                  <button onClick={() => setExpanded(expanded === gw.id ? null : gw.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#f0f0f0] text-[#6b6b6b] hover:bg-[#e8e8e8]">
                    {expanded === gw.id ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                    Entries
                  </button>

                  <div className="flex-1"/>
                  <button onClick={() => setEditing({...gw})} className="p-2 rounded-lg hover:bg-[#f5f5f3] text-[#6b6b6b]"><Edit2 className="w-3.5 h-3.5"/></button>
                  <button onClick={() => del(gw.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>

                {/* Expanded entries */}
                {expanded === gw.id && <EntriesList giveawayId={gw.id}/>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e8e8e8] px-5 py-4 flex items-center justify-between">
              <h2 className="font-black text-[#0a0a0a]">{editing.id ? 'Edit Giveaway' : 'New Giveaway'}</h2>
              <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-full bg-[#f0f0f0] flex items-center justify-center text-[#6b6b6b]">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label-xs">Title *</label>
                <input value={editing.title||''} onChange={e => setEditing(p=>({...p!,title:e.target.value}))}
                  placeholder="e.g. MOUAU Back-to-School Giveaway" className="input-field mt-1"/>
              </div>
              <div>
                <label className="label-xs">Description</label>
                <textarea value={editing.description||''} onChange={e => setEditing(p=>({...p!,description:e.target.value}))}
                  rows={3} placeholder="Describe the giveaway..." className="input-field mt-1 resize-none"/>
              </div>
              <div>
                <label className="label-xs">Deadline (optional)</label>
                <input type="datetime-local" value={editing.deadline||''} onChange={e => setEditing(p=>({...p!,deadline:e.target.value}))} className="input-field mt-1"/>
              </div>

              {/* Prize */}
              <div>
                <label className="label-xs">Prize Type</label>
                <select value={editing.prize_type||'announcement'} onChange={e => setEditing(p=>({...p!, prize_type: e.target.value as Giveaway['prize_type']}))} className="input-field mt-1">
                  <option value="wallet">Wallet Credit (credited in-app)</option>
                  <option value="announcement">Announcement Only (no in-app credit)</option>
                  <option value="custom">Custom (winner submits claim details)</option>
                </select>
              </div>
              {editing.prize_type === 'wallet' && (
                <div>
                  <label className="label-xs">Amount (₦)</label>
                  <input type="number" value={editing.prize_amount||0} onChange={e => setEditing(p=>({...p!, prize_amount: Number(e.target.value)}))} className="input-field mt-1"/>
                </div>
              )}
              {editing.prize_type !== 'wallet' && (
                <div>
                  <label className="label-xs">Prize Label (shown to students)</label>
                  <input value={editing.prize_label||''} onChange={e => setEditing(p=>({...p!, prize_label:e.target.value}))}
                    placeholder="e.g. ₦5,000 airtime top-up" className="input-field mt-1"/>
                </div>
              )}

              {/* Claim fields (for custom/announcement) */}
              {editing.prize_type !== 'wallet' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label-xs">Claim Fields (winner fills these in)</label>
                    <button onClick={() => setEditing(p => ({...p!, claim_fields: [...(p!.claim_fields||[]), {label:'', required:true}]}))}
                      className="text-[10px] font-bold text-[#1a6b3a] flex items-center gap-1"><Plus className="w-3 h-3"/> Add field</button>
                  </div>
                  <div className="space-y-2">
                    {(editing.claim_fields||[]).map((f,i) => (
                      <ClaimFieldRow key={i} field={f}
                        onChange={nf => setEditing(p => ({...p!, claim_fields: (p!.claim_fields||[]).map((x,j) => j===i ? nf : x)}))}
                        onRemove={() => setEditing(p => ({...p!, claim_fields: (p!.claim_fields||[]).filter((_,j) => j!==i)}))}/>
                    ))}
                    {(editing.claim_fields||[]).length === 0 && <p className="text-[11px] text-[#aaa]">No fields added. Add fields like "Phone Number" or "Bank Account".</p>}
                  </div>
                </div>
              )}

              {/* Tasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-xs">Bonus Entry Tasks</label>
                  <button onClick={() => setEditing(p => ({...p!, tasks: [...(p!.tasks||[]), {id:`t${Date.now()}`, label:'', type:'custom', value:'', bonus_entries:1}]}))}
                    className="text-[10px] font-bold text-[#1a6b3a] flex items-center gap-1"><Plus className="w-3 h-3"/> Add task</button>
                </div>
                <div className="space-y-2">
                  {(editing.tasks||[]).map((t,i) => (
                    <TaskRow key={t.id} task={t}
                      onChange={nt => setEditing(p => ({...p!, tasks: (p!.tasks||[]).map((x,j) => j===i ? nt : x)}))}
                      onRemove={() => setEditing(p => ({...p!, tasks: (p!.tasks||[]).filter((_,j) => j!==i)}))}/>
                  ))}
                  {(editing.tasks||[]).length === 0 && <p className="text-[11px] text-[#aaa]">No tasks yet. Tasks award bonus entries to engaged students.</p>}
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 p-3 bg-[#f5f5f3] rounded-xl cursor-pointer">
                <div className={`w-10 h-6 rounded-full transition-colors relative ${editing.active ? 'bg-[#1a6b3a]' : 'bg-[#ccc]'}`}
                  onClick={() => setEditing(p => ({...p!, active: !p!.active}))}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${editing.active ? 'translate-x-5' : 'translate-x-1'}`}/>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0a0a0a]">Active / Visible to students</p>
                  <p className="text-[11px] text-[#6b6b6b]">Students can see and enter when active</p>
                </div>
              </label>

              <button onClick={save} disabled={saving}
                className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{background:'linear-gradient(135deg,#1a6b3a,#145530)'}}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                {editing.id ? 'Save Changes' : 'Create Giveaway'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}

function EntriesList({ giveawayId }: { giveawayId: string }) {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    import('@supabase/supabase-js').then(({ createClient }) => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      createClient(url, key).from('giveaway_entries').select('*').eq('giveaway_id', giveawayId).order('entries', { ascending: false })
        .then(({ data }) => { setEntries(data || []); setLoading(false) })
    })
  }, [giveawayId])
  if (loading) return <div className="px-4 pb-3 text-xs text-[#aaa] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Loading entries...</div>
  if (entries.length === 0) return <div className="px-4 pb-3 text-xs text-[#aaa]">No entries yet.</div>
  return (
    <div className="px-4 pb-4 space-y-1.5 border-t border-[#f5f5f3] pt-3">
      <p className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-wide mb-2">{entries.length} Entries</p>
      {entries.map((e,i) => (
        <div key={e.id} className="flex items-center gap-2 py-1.5">
          <span className="text-[10px] text-[#aaa] w-5">{i+1}.</span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#0a0a0a]">{e.student_name}</p>
            <p className="text-[10px] text-[#6b6b6b]">{e.student_id}</p>
          </div>
          <span className="text-[11px] font-bold text-[#1a6b3a] bg-[#f0faf4] px-2 py-0.5 rounded-full">{e.entries} entries</span>
          {e.claim_submitted && <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Claimed</span>}
        </div>
      ))}
    </div>
  )
}
