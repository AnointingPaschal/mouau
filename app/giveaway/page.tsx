'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'
import {
  Gift, Trophy, Users, Zap, CheckCircle2, Loader2,
  ExternalLink, ChevronRight, Clock, Star, PartyPopper,
} from 'lucide-react'

type Task = { id:string; label:string; type:'whatsapp'|'forum'|'share'|'custom'; value:string; bonus_entries:number }
type ClaimField = { label:string; required:boolean }
type Giveaway = {
  id:string; title:string; description:string; prize_type:'wallet'|'announcement'|'custom'
  prize_amount:number; prize_label:string; claim_fields:ClaimField[]; tasks:Task[]
  entry_count:number; deadline:string; image_url:string
  winner_id:string; winner_name:string; winner_confirmed:boolean; ended:boolean; active:boolean
}

function Countdown({ deadline }: { deadline: string }) {
  const [left, setLeft] = useState('')
  useEffect(() => {
    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) { setLeft('Ended'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`)
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [deadline])
  return <span>{left}</span>
}

export default function GiveawayPage() {
  const { student } = useAuth()
  const [giveaway,   setGiveaway]   = useState<Giveaway|null>(null)
  const [loading,    setLoading]    = useState(true)
  const [entered,    setEntered]    = useState(false)
  const [myEntries,  setMyEntries]  = useState(1)
  const [tasksDone,  setTasksDone]  = useState<string[]>([])
  const [entering,   setEntering]   = useState(false)
  const [taskLoading,setTaskLoading]= useState<string|null>(null)
  const [claimData,  setClaimData]  = useState<Record<string,string>>({})
  const [claiming,   setClaiming]   = useState(false)
  const [claimed,    setClaimed]    = useState(false)
  const [toast,      setToast]      = useState('')
  const [toastErr,   setToastErr]   = useState(false)

  const showToast = (m:string, err=false) => { setToast(m); setToastErr(err); setTimeout(()=>setToast(''),3500) }

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/giveaway')
    const d = await r.json()
    setGiveaway(d.giveaway)
    setLoading(false)
    if (d.giveaway && student?.idNumber) {
      // Check if already entered
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'')
      const { data: entry } = await sb.from('giveaway_entries').select('entries, tasks_done, claim_submitted')
        .eq('giveaway_id', d.giveaway.id).eq('student_id', student.idNumber).maybeSingle()
      if (entry) { setEntered(true); setMyEntries(entry.entries||1); setTasksDone(entry.tasks_done||[]); setClaimed(entry.claim_submitted||false) }
    }
  }
  useEffect(() => { load() }, [student?.idNumber])

  const enter = async () => {
    if (!giveaway || !student) return
    setEntering(true)
    const r = await fetch('/api/giveaway/enter', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ giveawayId: giveaway.id, studentId: student.idNumber, studentName: student.name, studentEmail: student.email })
    })
    const d = await r.json()
    setEntering(false)
    if (!d.ok) { showToast(d.error || 'Failed to enter', true); return }
    setEntered(true); showToast('You\'re in the draw! 🎉')
  }

  const doTask = async (task: Task) => {
    if (!giveaway || !student || tasksDone.includes(task.id)) return
    // Open link first if applicable
    if (task.value && (task.type === 'whatsapp' || task.type === 'custom')) window.open(task.value, '_blank')
    setTaskLoading(task.id)
    const r = await fetch('/api/giveaway/task', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ giveawayId: giveaway.id, studentId: student.idNumber, taskId: task.id, bonusEntries: task.bonus_entries })
    })
    const d = await r.json()
    setTaskLoading(null)
    if (!d.ok) { showToast(d.error || 'Task failed', true); return }
    setTasksDone(p => [...p, task.id]); setMyEntries(d.entries); showToast(`+${task.bonus_entries} bonus entries added!`)
  }

  const submitClaim = async () => {
    if (!giveaway || !student) return
    setClaiming(true)
    const r = await fetch('/api/giveaway/claim', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ giveawayId: giveaway.id, studentId: student.idNumber, claimData })
    })
    const d = await r.json()
    setClaiming(false)
    if (!d.ok) { showToast(d.error || 'Failed', true); return }
    setClaimed(true); showToast('Claim submitted! Admin will process your prize.')
  }

  const isWinner = giveaway?.winner_confirmed && giveaway?.winner_id === student?.idNumber

  return (
    <AppShell>
      <TopBar title="Giveaway" subtitle="Win amazing prizes"/>
      <div className="px-4 py-4 pb-28 space-y-4">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 left-4 right-4 z-50 flex items-center gap-2 p-3.5 rounded-2xl shadow-lg text-sm font-bold transition-all
            ${toastErr ? 'bg-red-600 text-white' : 'bg-[#1a6b3a] text-white'}`}>
            {toastErr ? '✕' : '🎉'} {toast}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#1a6b3a]"/>
            <p className="text-sm text-[#6b6b6b]">Loading giveaway…</p>
          </div>
        ) : !giveaway ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-20 h-20 bg-[#f5f5f3] rounded-3xl flex items-center justify-center">
              <Gift className="w-10 h-10 text-[#ccc]"/>
            </div>
            <div>
              <p className="font-black text-[#0a0a0a] text-lg">No Active Giveaway</p>
              <p className="text-[#6b6b6b] text-sm mt-1">Check back soon for the next giveaway!</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Hero card ── */}
            <div className="relative rounded-3xl overflow-hidden"
              style={{background:'linear-gradient(135deg,#1a3a2a 0%,#0d2818 40%,#1e1a0e 100%)'}}>
              <div className="absolute inset-0 opacity-20" style={{background:'radial-gradient(circle at 70% 30%,#f59e0b,transparent 60%), radial-gradient(circle at 20% 80%,#10b981,transparent 60%)'}}/>
              {/* Confetti dots */}
              {['top-6 left-8','top-12 right-16','bottom-8 left-16','bottom-12 right-8'].map((pos,i) => (
                <div key={i} className={`absolute ${pos} w-2 h-2 rounded-full opacity-60`}
                  style={{background: ['#f59e0b','#10b981','#60a5fa','#f472b6'][i]}}/>
              ))}
              <div className="relative p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-amber-400/20 rounded-xl flex items-center justify-center border border-amber-400/30">
                    <Gift className="w-4 h-4 text-amber-400"/>
                  </div>
                  <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Active Giveaway</span>
                </div>
                <h1 className="text-white font-black text-2xl leading-tight mb-2">{giveaway.title}</h1>
                <p className="text-white/60 text-sm leading-relaxed mb-4">{giveaway.description}</p>

                {/* Prize */}
                <div className="flex items-center gap-3 p-3.5 bg-white/10 rounded-2xl border border-white/10 mb-4">
                  <div className="w-10 h-10 bg-amber-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-amber-400"/>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wide">Prize</p>
                    <p className="text-white font-black text-base">
                      {giveaway.prize_type === 'wallet' ? `₦${Number(giveaway.prize_amount).toLocaleString()} Wallet Credit` : giveaway.prize_label || 'Special Prize'}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-3">
                  <div className="flex-1 p-2.5 bg-white/10 rounded-xl text-center border border-white/10">
                    <p className="text-white font-black text-lg">{giveaway.entry_count}</p>
                    <p className="text-white/50 text-[10px] uppercase font-bold tracking-wide">Entries</p>
                  </div>
                  {giveaway.deadline && (
                    <div className="flex-1 p-2.5 bg-white/10 rounded-xl text-center border border-white/10">
                      <p className="text-amber-400 font-black text-sm"><Countdown deadline={giveaway.deadline}/></p>
                      <p className="text-white/50 text-[10px] uppercase font-bold tracking-wide">Time Left</p>
                    </div>
                  )}
                  {entered && (
                    <div className="flex-1 p-2.5 bg-emerald-400/20 rounded-xl text-center border border-emerald-400/30">
                      <p className="text-emerald-400 font-black text-lg">{myEntries}</p>
                      <p className="text-emerald-300/70 text-[10px] uppercase font-bold tracking-wide">Your Entries</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Winner announced ── */}
            {giveaway.winner_confirmed && (
              <div className="relative rounded-2xl overflow-hidden p-5"
                style={{background:'linear-gradient(135deg,#7c3aed,#5b21b6)'}}>
                <div className="absolute inset-0 opacity-20" style={{background:'radial-gradient(circle at 80% 20%,#c4b5fd,transparent)'}}/>
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <PartyPopper className="w-7 h-7 text-white"/>
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-wide">🎉 Winner Announced</p>
                    <p className="text-white font-black text-lg">{giveaway.winner_name}</p>
                    {isWinner && <p className="text-purple-200 text-xs mt-0.5">That's you! 🎊</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Winner claim form ── */}
            {isWinner && !claimed && (giveaway.claim_fields||[]).length > 0 && (
              <div className="card p-5 border-2 border-amber-300 bg-amber-50">
                <div className="flex items-center gap-2.5 mb-4">
                  <Trophy className="w-5 h-5 text-amber-600"/>
                  <div>
                    <p className="font-black text-[#0a0a0a]">Claim Your Prize!</p>
                    <p className="text-xs text-[#6b6b6b]">Fill in the details below so we can deliver your prize.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {(giveaway.claim_fields||[]).map((f,i) => (
                    <div key={i}>
                      <label className="label-xs">{f.label}{f.required && ' *'}</label>
                      <input value={claimData[f.label]||''} onChange={e => setClaimData(p => ({...p,[f.label]:e.target.value}))}
                        placeholder={f.label} className="input-field mt-1"/>
                    </div>
                  ))}
                </div>
                <button onClick={submitClaim} disabled={claiming}
                  className="mt-4 w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{background:'linear-gradient(135deg,#d97706,#b45309)'}}>
                  {claiming ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                  Submit Claim
                </button>
              </div>
            )}
            {isWinner && claimed && (
              <div className="card p-4 bg-green-50 border border-green-200 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0"/>
                <div>
                  <p className="font-bold text-green-800 text-sm">Claim submitted!</p>
                  <p className="text-[11px] text-green-700">Admin will process your prize shortly.</p>
                </div>
              </div>
            )}

            {/* ── Enter button ── */}
            {!giveaway.ended && !giveaway.winner_confirmed && (
              entered ? (
                <div className="card p-4 bg-[#f0faf4] border border-[#c6e8d4] flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#1a6b3a] flex-shrink-0"/>
                  <div>
                    <p className="font-bold text-[#1a6b3a] text-sm">You're entered!</p>
                    <p className="text-[11px] text-[#6b6b6b]">{myEntries} entr{myEntries===1?'y':'ies'} in the draw. Complete tasks below for more chances.</p>
                  </div>
                </div>
              ) : (
                <button onClick={enter} disabled={entering || !student}
                  className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-3 shadow-lg active:scale-[0.97] transition-transform disabled:opacity-50"
                  style={{background:'linear-gradient(135deg,#1a6b3a,#145530)'}}>
                  {entering ? <Loader2 className="w-5 h-5 animate-spin"/> : <Gift className="w-5 h-5"/>}
                  {!student ? 'Login to Enter' : 'Enter Giveaway — Free!'}
                </button>
              )
            )}

            {/* ── Bonus tasks ── */}
            {entered && !giveaway.ended && (giveaway.tasks||[]).length > 0 && (
              <div>
                <p className="section-label mb-3 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500"/> BONUS ENTRIES
                </p>
                <div className="space-y-2.5">
                  {(giveaway.tasks||[]).map(task => {
                    const done = tasksDone.includes(task.id)
                    return (
                      <div key={task.id}
                        className={`card p-4 flex items-center gap-3 transition-all ${done ? 'opacity-60' : ''}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${done ? 'bg-[#f0faf4]' : 'bg-[#f5f5f3]'}`}>
                          {done ? <CheckCircle2 className="w-5 h-5 text-[#1a6b3a]"/> : <Star className="w-5 h-5 text-amber-500"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${done ? 'text-[#6b6b6b] line-through' : 'text-[#0a0a0a]'}`}>{task.label}</p>
                          <p className="text-[11px] text-amber-600 font-bold">+{task.bonus_entries} entr{task.bonus_entries===1?'y':'ies'}</p>
                        </div>
                        {!done && (
                          <button onClick={() => doTask(task)} disabled={!!taskLoading}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white flex-shrink-0 disabled:opacity-50"
                            style={{background:'linear-gradient(135deg,#d97706,#b45309)'}}>
                            {taskLoading === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <>Do it <ExternalLink className="w-3 h-3"/></>}
                          </button>
                        )}
                        {done && <span className="text-[11px] font-bold text-[#1a6b3a] bg-[#f0faf4] px-2 py-0.5 rounded-full flex-shrink-0">Done ✓</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── How it works ── */}
            <div className="card p-4">
              <p className="text-xs font-black text-[#0a0a0a] mb-3">How it works</p>
              <div className="space-y-2.5">
                {[
                  { n:'1', t:'Enter for free', d:'Tap "Enter Giveaway" — one click, no cost.' },
                  { n:'2', t:'Earn bonus entries', d:'Complete tasks to increase your chances of winning.' },
                  { n:'3', t:'Random draw', d:'A winner is picked randomly — more entries = better odds.' },
                  { n:'4', t:'Win & claim', d:'Winner is announced here. Claim your prize instantly.' },
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#1a6b3a] text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</div>
                    <div>
                      <p className="text-xs font-bold text-[#0a0a0a]">{s.t}</p>
                      <p className="text-[11px] text-[#6b6b6b]">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
