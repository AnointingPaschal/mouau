'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { getAnnouncements } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  MapPin, ClipboardList, BookOpen, MessageCircle,
  Users, User, AlertTriangle, Info, CheckCircle2,
  Calendar, ChevronRight, Brain, Calculator, Clock,
  Zap, GraduationCap
} from 'lucide-react'

type Ann = { id: string; title: string; body: string; type: string; pinned: boolean; created_at: string }

const QUICK_ACTIONS = [
  { href:'/navigate',    label:'Campus Map',  icon:MapPin,        color:'#1a6b3a' },
  { href:'/register',    label:'Register',    icon:ClipboardList, color:'#d97706' },
  { href:'/library',     label:'Library',     icon:BookOpen,      color:'#2563eb' },
  { href:'/chat',        label:'AI Chat',     icon:Brain,         color:'#7c3aed' },
  { href:'/events',      label:'Events',      icon:Calendar,      color:'#e11d48' },
  { href:'/forum',       label:'Community',   icon:Users,         color:'#dc2626' },
  { href:'/calculator',  label:'Calculator',  icon:Calculator,    color:'#0284c7' },
  { href:'/timetable',   label:'Timetable',   icon:Clock,         color:'#059669' },
]

const annIcon = (t: string) => {
  if (t === 'warning') return <AlertTriangle className="w-3.5 h-3.5 text-amber-500"/>
  if (t === 'success') return <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/>
  if (t === 'event')   return <Calendar className="w-3.5 h-3.5 text-blue-500"/>
  return <Info className="w-3.5 h-3.5 text-[#1a6b3a]"/>
}
const annBorder = (t: string) => {
  if (t === 'warning') return 'border-l-amber-400'
  if (t === 'success') return 'border-l-[#1a6b3a]'
  if (t === 'event')   return 'border-l-blue-400'
  return 'border-l-[#1a6b3a]'
}

export default function Dashboard() {
  const { student } = useAuth()
  const [anns, setAnns]             = useState<Ann[]>([])
  const [pct, setPct]               = useState(0)
  const [doneCount, setDoneCount]   = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    getAnnouncements().then(({ data }) => { if (data) setAnns(data as Ann[]) })
    if (!student?.idNumber) return
    const progressKey = `reg_progress_${student.idNumber}`
    try {
      const raw = localStorage.getItem(progressKey)
      const checked: Record<string, boolean> = raw ? JSON.parse(raw) : {}
      const done = Object.values(checked).filter(Boolean).length
      setDoneCount(done)
      supabase.from('registration_steps').select('substeps').eq('active', true)
        .then(({ data }) => {
          if (!data) return
          let total = 0
          data.forEach((s: any) => {
            const subs = Array.isArray(s.substeps) ? s.substeps : (() => { try { return JSON.parse(s.substeps||'[]') } catch { return [] } })()
            total += subs.length
          })
          setTotalCount(total)
          setPct(total > 0 ? Math.round((done / total) * 100) : 0)
        })
    } catch {}
  }, [student?.idNumber])

  const h = new Date().getHours()
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <AppShell>
      <TopBar/>
      <div className="p-4 lg:p-5 max-w-2xl mx-auto space-y-5 pb-24 lg:pb-6 animate-fade-in">
        {/* Hero */}
        <div className="bg-[#0a0a0a] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#1a6b3a]/20 rounded-full -translate-y-1/2 translate-x-1/2"/>
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/40 text-[10px] font-semibold tracking-widest uppercase">MOUAU · 2024/2025</p>
                <h2 className="text-white font-black text-xl leading-tight mt-1">
                  {student?.name?.split(' ')[0]}'s<br/>
                  <span className="text-[#1a6b3a]">Campus Hub</span>
                </h2>
                <p className="text-white/40 text-xs mt-1">{student?.level || '100'} Level Student</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-white">{pct}%</div>
                <div className="text-white/40 text-[10px] uppercase tracking-wide">Registered</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
                <span>Registration Progress</span>
                <span>{doneCount}/{totalCount} steps</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#1a6b3a] rounded-full transition-all duration-700" style={{ width: `${pct}%` }}/>
              </div>
            </div>
            {pct < 100 && (
              <Link href="/register"
                className="inline-flex items-center gap-1.5 mt-3 bg-[#1a6b3a] text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-[#145530] transition-colors">
                Continue Registration <ChevronRight className="w-3 h-3"/>
              </Link>
            )}
          </div>
        </div>

        {/* Quick Actions 4×2 */}
        <div>
          <div className="section-label mb-3">QUICK ACTIONS</div>
          <div className="grid grid-cols-4 gap-2.5">
            {QUICK_ACTIONS.map(({ href, label, icon: Icon, color }) => (
              <Link key={href + label} href={href}
                className="card card-hover flex flex-col items-center gap-2 py-3.5 px-1 text-center group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
                  style={{ background: color + '18' }}>
                  <Icon className="w-5 h-5" style={{ color }}/>
                </div>
                <span className="text-[10px] font-semibold text-[#0a0a0a] leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div>
          <div className="section-label mb-3">ANNOUNCEMENTS</div>
          {anns.length === 0 ? (
            <div className="card p-6 text-center"><p className="text-[#aaa] text-sm">No announcements yet.</p></div>
          ) : (
            <div className="space-y-2">
              {anns.map(ann => (
                <div key={ann.id} className={`card border-l-4 ${annBorder(ann.type)} p-3.5`}>
                  <div className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 mt-0.5">{annIcon(ann.type)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#0a0a0a] text-xs">{ann.title}</p>
                        {ann.pinned && <span className="badge badge-green text-[9px]">Pinned</span>}
                      </div>
                      {ann.body && <p className="text-[#6b6b6b] text-[11px] mt-1 leading-relaxed line-clamp-2">{ann.body}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
