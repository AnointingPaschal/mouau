'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import {
  Zap, Clock, User, MapPin, Calendar, CheckCircle2, Loader2,
  Lightbulb, AlertTriangle, Quote, Star, ChevronLeft, ArrowRight
} from 'lucide-react'

type Skill = {
  id:string; title:string; tagline:string; description:string
  category:string; level:string; duration:string; instructor:string
  image_url:string; what_you_learn:string; requirements:string
}
type Nugget  = { id:string; content:string; type:'tip'|'fact'|'warning'|'quote'; sort_order:number }
type SkillClass = { id:string; title:string; description:string; date:string; location:string; duration_hours:number; max_attendees:number }

const NUGGET_STYLE: Record<string,{ icon: any; bg:string; border:string; text:string; label:string }> = {
  tip:     { icon: Lightbulb,     bg:'#f0f9f4', border:'#1a6b3a30', text:'#1a6b3a', label:'Tip'     },
  fact:    { icon: Star,          bg:'#eff6ff',  border:'#3b82f630', text:'#1e3a8a', label:'Fact'    },
  warning: { icon: AlertTriangle, bg:'#fffbeb',  border:'#d9770630', text:'#b45309', label:'Note'    },
  quote:   { icon: Quote,         bg:'#faf5ff',  border:'#7c3aed30', text:'#7c3aed', label:'Quote'   },
}
const LEVEL_COLOR: Record<string,string> = { beginner:'#1a6b3a', intermediate:'#d97706', advanced:'#b91c1c' }

export default function SkillDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const { student } = useAuth()

  const [skill,    setSkill]    = useState<Skill | null>(null)
  const [nuggets,  setNuggets]  = useState<Nugget[]>([])
  const [classes,  setClasses]  = useState<SkillClass[]>([])
  const [applied,  setApplied]  = useState<string | null>(null) // status
  const [tab,      setTab]      = useState<'overview'|'nuggets'|'classes'|'apply'>('overview')
  const [loading,  setLoading]  = useState(true)
  const [applying, setApplying] = useState(false)
  const [form,     setForm]     = useState({ phone:'', motivation:'' })
  const [toast,    setToast]    = useState('')

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    fetch(`/api/skills/${id}`).then(r => r.json()).then(d => {
      setSkill(d.skill); setNuggets(d.nuggets || []); setClasses(d.classes || [])
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!student?.idNumber) return
    fetch(`/api/skills/apply?student_id=${student.idNumber}`).then(r => r.json()).then(d => {
      const mine = (d.data || []).find((a: any) => a.skill_id === id)
      if (mine) setApplied(mine.status)
    })
  }, [id, student?.idNumber])

  const apply = async () => {
    if (!student) return
    setApplying(true)
    const r = await fetch('/api/skills/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skill_id: id, student_id: student.idNumber,
        student_name: student.name, matric_number: student.idNumber,
        student_phone: form.phone, motivation: form.motivation,
      }),
    })
    const d = await r.json()
    setApplying(false)
    if (d.ok) { setApplied('pending'); showToast('Application submitted! You\'ll be notified when approved.'); setTab('overview') }
    else showToast(d.error || 'Failed to apply')
  }

  if (loading) return (
    <AppShell>
      <TopBar title="Skill Detail"/>
      <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[#1a6b3a] animate-spin"/></div>
    </AppShell>
  )
  if (!skill) return (
    <AppShell><TopBar title="Not Found"/><div className="p-4 text-center text-[#aaa] py-20">Skill not found</div></AppShell>
  )

  const levelColor = LEVEL_COLOR[skill.level?.toLowerCase()] || '#1a6b3a'

  return (
    <AppShell>
      <TopBar title={skill.title} subtitle={skill.category}/>

      {toast && (
        <div className="fixed top-14 left-4 right-4 z-50 bg-[#0a0a0a] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-[#1a6b3a]"/> {toast}
        </div>
      )}

      {/* Hero */}
      <div className="relative h-44 overflow-hidden bg-[#0a0a0a]">
        {skill.image_url ? (
          <img src={skill.image_url} alt={skill.title} className="w-full h-full object-cover opacity-70"/>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]"/>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/>
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex gap-1.5 mb-1.5">
            {skill.category && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white">{skill.category}</span>}
            {skill.level    && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:`${levelColor}cc`}}>{skill.level}</span>}
          </div>
          <h1 className="text-white font-black text-xl leading-tight">{skill.title}</h1>
          {skill.tagline && <p className="text-white/60 text-xs mt-0.5">{skill.tagline}</p>}
        </div>
        <button onClick={() => router.back()} className="absolute top-3 left-3 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-white"/>
        </button>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#e8e8e8] bg-white overflow-x-auto">
        {skill.duration   && <div className="flex items-center gap-1 text-[10px] text-[#6b6b6b] flex-shrink-0"><Clock className="w-3 h-3"/>{skill.duration}</div>}
        {skill.instructor && <div className="flex items-center gap-1 text-[10px] text-[#6b6b6b] flex-shrink-0"><User className="w-3 h-3"/>{skill.instructor}</div>}
        {classes.length > 0 && <div className="flex items-center gap-1 text-[10px] text-[#1a6b3a] font-semibold flex-shrink-0"><Calendar className="w-3 h-3"/>{classes.length} class{classes.length>1?'es':''}</div>}
        {applied && (
          <div className={`ml-auto flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full
            ${applied==='approved'?'bg-[#1a6b3a] text-white':applied==='pending'?'bg-amber-100 text-amber-700':'bg-[#f0f0f0] text-[#6b6b6b]'}`}>
            {applied === 'approved' ? 'Approved' : applied === 'pending' ? 'Applied — Pending' : applied}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e8e8e8] bg-white overflow-x-auto">
        {([
          { id:'overview', label:'Overview' },
          { id:'nuggets',  label:`Nuggets ${nuggets.length ? `(${nuggets.length})` : ''}` },
          { id:'classes',  label:`Classes ${classes.length ? `(${classes.length})` : ''}` },
          { id:'apply',    label: applied ? 'Status' : 'Apply' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors
              ${tab === t.id ? 'border-[#1a6b3a] text-[#1a6b3a]' : 'border-transparent text-[#aaa] hover:text-[#6b6b6b]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 pb-28 space-y-4">

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <>
            {skill.description && (
              <div>
                <h3 className="font-bold text-[#0a0a0a] text-xs uppercase tracking-wide mb-2">About This Skill</h3>
                <p className="text-[#6b6b6b] text-sm leading-relaxed">{skill.description}</p>
              </div>
            )}
            {skill.what_you_learn && (
              <div className="bg-[#f0f9f4] border border-[#1a6b3a]/20 rounded-2xl p-4">
                <h3 className="font-bold text-[#1a6b3a] text-xs uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5"/> What You'll Learn
                </h3>
                {skill.what_you_learn.split('\n').filter(Boolean).map((line, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1a6b3a] mt-1.5 flex-shrink-0"/>
                    <p className="text-[#0a0a0a] text-xs leading-relaxed">{line}</p>
                  </div>
                ))}
              </div>
            )}
            {skill.requirements && (
              <div className="bg-[#fffbeb] border border-amber-200 rounded-2xl p-4">
                <h3 className="font-bold text-amber-700 text-xs uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5"/> Requirements
                </h3>
                {skill.requirements.split('\n').filter(Boolean).map((line, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"/>
                    <p className="text-amber-900 text-xs leading-relaxed">{line}</p>
                  </div>
                ))}
              </div>
            )}
            {!applied && (
              <button onClick={() => setTab('apply')}
                className="w-full py-3.5 bg-[#1a6b3a] hover:bg-[#145530] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                <Zap className="w-4 h-4"/> Apply to Join <ArrowRight className="w-4 h-4"/>
              </button>
            )}
          </>
        )}

        {/* ── Nuggets ── */}
        {tab === 'nuggets' && (
          <>
            <div className="text-center py-3">
              <p className="text-xs font-bold text-[#0a0a0a] mb-1">Knowledge Nuggets</p>
              <p className="text-[11px] text-[#aaa]">Key insights, tips and facts about this skill</p>
            </div>
            {nuggets.length === 0 ? (
              <div className="text-center py-10">
                <Lightbulb className="w-8 h-8 text-[#ddd] mx-auto mb-2"/>
                <p className="text-[#aaa] text-sm">No nuggets yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nuggets.map((n, i) => {
                  const style = NUGGET_STYLE[n.type] || NUGGET_STYLE.tip
                  const Icon  = style.icon
                  return (
                    <div key={n.id} className="rounded-2xl p-4 border" style={{background:style.bg, borderColor:style.border}}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-3.5 h-3.5" style={{color:style.text}}/>
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{color:style.text}}>{style.label} {i+1}</span>
                      </div>
                      <p className="text-[#0a0a0a] text-sm leading-relaxed">{n.content}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Classes ── */}
        {tab === 'classes' && (
          <>
            {classes.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-8 h-8 text-[#ddd] mx-auto mb-2"/>
                <p className="text-[#aaa] text-sm">No classes announced yet</p>
                <p className="text-[11px] text-[#ccc] mt-1">You'll be notified when a class is scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {classes.map(cls => (
                  <div key={cls.id} className="card p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-[#0a0a0a] text-sm">{cls.title}</h3>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#1a6b3a]/10 text-[#1a6b3a] flex-shrink-0">Upcoming</span>
                    </div>
                    {cls.description && <p className="text-xs text-[#6b6b6b] mb-3">{cls.description}</p>}
                    <div className="space-y-1.5">
                      {cls.date && (
                        <div className="flex items-center gap-2 text-[11px] text-[#0a0a0a]">
                          <Calendar className="w-3.5 h-3.5 text-[#1a6b3a]"/>
                          {new Date(cls.date).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                          {' '}{new Date(cls.date).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}
                        </div>
                      )}
                      {cls.location && (
                        <div className="flex items-center gap-2 text-[11px] text-[#0a0a0a]">
                          <MapPin className="w-3.5 h-3.5 text-[#1a6b3a]"/>
                          {cls.location}
                        </div>
                      )}
                      {cls.duration_hours && (
                        <div className="flex items-center gap-2 text-[11px] text-[#0a0a0a]">
                          <Clock className="w-3.5 h-3.5 text-[#1a6b3a]"/>
                          {cls.duration_hours} hour{cls.duration_hours > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Apply ── */}
        {tab === 'apply' && (
          <>
            {applied ? (
              <div className="text-center py-8">
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center
                  ${applied==='approved'?'bg-[#1a6b3a]/10':'bg-amber-50'}`}>
                  <CheckCircle2 className={`w-8 h-8 ${applied==='approved'?'text-[#1a6b3a]':'text-amber-500'}`}/>
                </div>
                <h3 className="font-black text-[#0a0a0a] text-base mb-1">
                  {applied === 'approved' ? 'You\'re Approved!' : 'Application Submitted'}
                </h3>
                <p className="text-[#6b6b6b] text-sm">
                  {applied === 'approved'
                    ? 'Congratulations! You\'ll be notified when a class is announced.'
                    : 'Your application is being reviewed. You\'ll receive a notification when it\'s processed.'}
                </p>
                <div className={`mt-4 inline-block text-xs font-bold px-4 py-1.5 rounded-full
                  ${applied==='approved'?'bg-[#1a6b3a] text-white':'bg-amber-100 text-amber-700'}`}>
                  Status: {applied.charAt(0).toUpperCase() + applied.slice(1)}
                </div>
              </div>
            ) : (
              <>
                <div className="bg-[#f0f9f4] border border-[#1a6b3a]/20 rounded-2xl p-4 mb-2">
                  <h3 className="font-bold text-[#1a6b3a] text-sm mb-1">Ready to learn {skill.title}?</h3>
                  <p className="text-[#6b6b6b] text-xs leading-relaxed">Fill in your details below. You'll be notified when approved and when classes are announced.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-wide block mb-1.5">Phone Number *</label>
                    <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}
                      placeholder="+234 8XX XXX XXXX"
                      className="input w-full text-sm"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-wide block mb-1.5">Why do you want this skill? (optional)</label>
                    <textarea value={form.motivation} onChange={e => setForm(p => ({...p, motivation: e.target.value}))}
                      rows={3} placeholder="Tell us your motivation…"
                      className="input w-full text-sm resize-none"/>
                  </div>
                  <button onClick={apply} disabled={applying || !form.phone.trim()}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]
                      ${applying || !form.phone.trim() ? 'bg-[#1a6b3a]/40 text-white cursor-not-allowed' : 'bg-[#1a6b3a] text-white hover:bg-[#145530]'}`}>
                    {applying ? <><Loader2 className="w-4 h-4 animate-spin"/> Submitting…</> : <><Zap className="w-4 h-4"/> Submit Application</>}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
