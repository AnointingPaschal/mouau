'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { getAnnouncements } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  MapPin, ClipboardList, BookOpen, Brain, Users, AlertTriangle,
  Info, CheckCircle2, Calendar, ChevronRight, Calculator, Clock,
  Navigation, TrendingUp, Award, BarChart2, FileText, Layers,
  GraduationCap, Star, Zap
} from 'lucide-react'

type Ann = { id: string; title: string; body: string; type: string; pinned: boolean; created_at: string }
type Event = { id: string; title: string; event_date: string; category: string; location: string }

const annIcon = (t: string) => {
  if (t === 'warning') return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
  if (t === 'success') return <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]" />
  if (t === 'event')   return <Calendar className="w-3.5 h-3.5 text-blue-500" />
  return <Info className="w-3.5 h-3.5 text-[#1a6b3a]" />
}
const annBorder = (t: string) => {
  if (t === 'warning') return 'border-l-amber-400'
  if (t === 'success') return 'border-l-[#1a6b3a]'
  if (t === 'event')   return 'border-l-blue-400'
  return 'border-l-[#1a6b3a]'
}
const CAT_COLOR: Record<string, string> = {
  academic: '#1a6b3a', ceremony: '#d97706', social: '#7c3aed', sports: '#2563eb', general: '#6b6b6b'
}

/* ════════════════════════════════════════════════════
   FRESHER DASHBOARD
═══════════════════════════════════════════════════════ */
function FresherDashboard() {
  const { student } = useAuth()
  const [anns, setAnns]           = useState<Ann[]>([])
  const [events, setEvents]       = useState<Event[]>([])
  const [pct, setPct]             = useState(0)
  const [doneCount, setDoneCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    getAnnouncements().then(({ data }) => { if (data) setAnns(data as Ann[]) })
    supabase.from('campus_events').select('id,title,event_date,category,location')
      .eq('active', true).order('event_date', { ascending: true }).limit(3)
      .then(({ data }) => setEvents((data as Event[]) || []))

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
            const subs = Array.isArray(s.substeps) ? s.substeps : (() => { try { return JSON.parse(s.substeps || '[]') } catch { return [] } })()
            total += subs.length
          })
          setTotalCount(total)
          setPct(total > 0 ? Math.round((done / total) * 100) : 0)
        })
    } catch {}
  }, [student?.idNumber])

  const QUICK_ACTIONS = [
    { href: '/navigate',   label: 'Campus Map',  icon: MapPin,       color: '#1a6b3a' },
    { href: '/register',   label: 'Register',    icon: ClipboardList, color: '#d97706' },
    { href: '/library',    label: 'Library',     icon: BookOpen,     color: '#2563eb' },
    { href: '/chat',       label: 'AI Chat',     icon: Brain,        color: '#7c3aed' },
    { href: '/events',     label: 'Events',      icon: Calendar,     color: '#e11d48' },
    { href: '/forum',      label: 'Forum',       icon: Users,        color: '#0891b2' },
    { href: '/calculator', label: 'Calculator',  icon: Calculator,   color: '#0284c7' },
    { href: '/timetable',  label: 'Timetable',   icon: Clock,        color: '#059669' },
  ]

  const hasMatric = !!(student as any)?.matricNumber

  return (
    <div className="p-4 lg:p-6 w-full space-y-5 pb-24 lg:pb-6 animate-fade-in">
      {/* Hero */}
      <div className="bg-[#0a0a0a] rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#1a6b3a]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold px-2 py-0.5 bg-[#1a6b3a]/20 text-[#4ade80] rounded-full uppercase tracking-wide">
                  🎓 Fresher · 2024/2025
                </span>
              </div>
              <h2 className="text-white font-black text-xl leading-tight">
                {student?.name?.split(' ')[0]}'s<br />
                <span className="text-[#4ade80]">Campus Hub</span>
              </h2>
              <p className="text-white/40 text-xs mt-1">
                {hasMatric ? `Matric: ${(student as any).matricNumber}` : `JAMB: ${student?.idNumber}`}
              </p>
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
              <div className="h-full bg-[#1a6b3a] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {pct < 100 && (
              <Link href="/register" className="inline-flex items-center gap-1.5 bg-[#1a6b3a] text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-[#145530] transition-colors">
                Continue Registration <ChevronRight className="w-3 h-3" />
              </Link>
            )}
            {!hasMatric && (
              <Link href="/profile" className="inline-flex items-center gap-1.5 bg-white/10 text-white/70 text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-white/20 transition-colors">
                Add Matric Number <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Matric number upgrade prompt */}
      {!hasMatric && pct >= 50 && (
        <Link href="/profile" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 hover:bg-amber-100 transition-colors">
          <Star className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-amber-800 text-sm">Got your Matric Number?</p>
            <p className="text-amber-600 text-xs">Add it to your profile to unlock more features.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400" />
        </Link>
      )}

      {/* Quick Actions */}
      <div>
        <div className="section-label mb-3">QUICK ACTIONS</div>
        <div className="grid grid-cols-4 gap-2.5">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href} className="card card-hover flex flex-col items-center gap-2 py-3.5 px-1 text-center group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105" style={{ background: color + '18' }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <span className="text-[10px] font-semibold text-[#0a0a0a] leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Campus Places Banner */}
      <Link href="/places" className="block relative overflow-hidden rounded-2xl cursor-pointer" style={{ minHeight: 72 }}>
        <div className="absolute inset-0 places-banner-gradient" />
        <div className="absolute inset-0 places-banner-shimmer" />
        <div className="relative z-10 flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm leading-tight">Explore Places in MOUAU</p>
              <p className="text-white/70 text-[10px] mt-0.5">Buildings, hostels, offices & landmarks</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5">
            <Navigation className="w-3 h-3 text-white" />
            <span className="text-white text-[10px] font-bold">Navigate</span>
          </div>
        </div>
      </Link>

      {/* Upcoming Events */}
      {events.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="section-label">UPCOMING EVENTS</div>
            <Link href="/events" className="text-[10px] font-semibold text-[#1a6b3a] hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {events.map(ev => {
              const color = CAT_COLOR[ev.category] || '#6b6b6b'
              return (
                <div key={ev.id} className="card flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
                    <span className="text-[8px] font-bold uppercase" style={{ color }}>{new Date(ev.event_date).toLocaleDateString('en', { month: 'short' })}</span>
                    <span className="text-base font-black text-[#0a0a0a] leading-none">{new Date(ev.event_date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0a0a0a] text-xs truncate">{ev.title}</p>
                    <p className="text-[10px] text-[#aaa] truncate">{ev.location} · {new Date(ev.event_date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
  )
}

/* ════════════════════════════════════════════════════
   RETURNING STUDENT DASHBOARD
═══════════════════════════════════════════════════════ */
function ReturningDashboard() {
  const { student } = useAuth()
  const [anns, setAnns]     = useState<Ann[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [cgpa, setCgpa]     = useState<number | null>(null)
  const [coursesCount, setCoursesCount] = useState(0)

  useEffect(() => {
    getAnnouncements().then(({ data }) => { if (data) setAnns(data as Ann[]) })
    supabase.from('campus_events').select('id,title,event_date,category,location')
      .eq('active', true).order('event_date', { ascending: true }).limit(4)
      .then(({ data }) => setEvents((data as Event[]) || []))

    if (!student?.idNumber) return
    // Load CGPA from DB
    supabase.from('student_cgpa').select('gpa').eq('student_id', student.idNumber).order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const totalGpa = data.reduce((sum: number, r: any) => sum + (r.gpa || 0), 0)
          setCgpa(parseFloat((totalGpa / data.length).toFixed(2)))
        }
      })
    // Course count for current session
    supabase.from('student_courses').select('id', { count: 'exact' }).eq('student_id', student.idNumber)
      .then(({ count }) => setCoursesCount(count || 0))
  }, [student?.idNumber])

  const s = student as any

  const QUICK_ACTIONS = [
    { href: '/cgpa',    label: 'CGPA',       icon: TrendingUp,  color: '#7c3aed', desc: 'Calculate' },
    { href: '/courses', label: 'Courses',    icon: Layers,      color: '#1a6b3a', desc: 'This semester' },
    { href: '/results', label: 'Results',    icon: Award,       color: '#d97706', desc: 'View grades' },
    { href: '/library', label: 'Library',    icon: BookOpen,    color: '#2563eb', desc: 'Materials' },
    { href: '/timetable', label: 'Timetable', icon: Clock,      color: '#059669', desc: 'Schedule' },
    { href: '/events',  label: 'Events',     icon: Calendar,    color: '#e11d48', desc: 'Campus' },
    { href: '/forum',   label: 'Forum',      icon: Users,       color: '#0891b2', desc: 'Community' },
    { href: '/navigate',label: 'Navigate',   icon: Navigation,  color: '#374151', desc: 'Campus map' },
  ]

  const cgpaGrade = (c: number) => {
    if (c >= 4.5) return { label: 'First Class', color: '#1a6b3a' }
    if (c >= 3.5) return { label: '2nd Class Upper', color: '#2563eb' }
    if (c >= 2.4) return { label: '2nd Class Lower', color: '#d97706' }
    if (c >= 1.5) return { label: 'Third Class', color: '#f97316' }
    return { label: 'Pass', color: '#e11d48' }
  }

  return (
    <div className="p-4 lg:p-6 w-full space-y-5 pb-24 lg:pb-6 animate-fade-in">
      {/* Hero — returning student style */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a] p-5 relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#2563eb]/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#7c3aed]/10 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-[9px] font-bold px-2 py-0.5 bg-[#2563eb]/20 text-[#60a5fa] rounded-full uppercase tracking-wide">
                📚 {s?.level || '200'}L · Returning Student
              </span>
              <h2 className="text-white font-black text-xl leading-tight mt-2">
                Welcome back,<br /><span className="text-[#60a5fa]">{student?.name?.split(' ')[0]}</span>
              </h2>
              <p className="text-white/40 text-xs mt-1 font-mono">{s?.matricNumber || student?.idNumber}</p>
            </div>
            {cgpa !== null && (
              <div className="text-right">
                <div className="text-3xl font-black text-white">{cgpa.toFixed(2)}</div>
                <div className="text-[10px] font-bold mt-0.5" style={{ color: cgpaGrade(cgpa).color }}>
                  {cgpaGrade(cgpa).label}
                </div>
              </div>
            )}
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'CGPA', value: cgpa !== null ? cgpa.toFixed(2) : '—', sub: 'Cumulative', icon: TrendingUp, color: '#7c3aed' },
              { label: 'Courses', value: coursesCount || '—', sub: 'Registered', icon: Layers, color: '#1a6b3a' },
              { label: 'Level', value: `${s?.level || '200'}L`, sub: student?.department?.slice(0, 8) || 'Student', icon: GraduationCap, color: '#2563eb' },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="bg-white/5 rounded-xl p-3">
                <Icon className="w-4 h-4 mb-1" style={{ color }} />
                <div className="text-white font-black text-lg leading-tight">{value}</div>
                <div className="text-white/30 text-[9px] uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="section-label mb-3">QUICK ACTIONS</div>
        <div className="grid grid-cols-4 gap-2.5">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, color, desc }) => (
            <Link key={href} href={href} className="card card-hover flex flex-col items-center gap-2 py-3.5 px-1 text-center group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105" style={{ background: color + '18' }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <span className="text-[10px] font-semibold text-[#0a0a0a] leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* CGPA prompt if not set */}
      {cgpa === null && (
        <Link href="/cgpa" className="flex items-center gap-3 bg-[#7c3aed]/5 border border-[#7c3aed]/20 rounded-xl p-4 hover:bg-[#7c3aed]/10 transition-colors">
          <div className="w-10 h-10 bg-[#7c3aed]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-[#7c3aed]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#0a0a0a] text-sm">Track Your CGPA</p>
            <p className="text-[#6b6b6b] text-xs">Enter your results to calculate and monitor your cumulative GPA.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-[#7c3aed]" />
        </Link>
      )}

      {/* Upcoming Events */}
      {events.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="section-label">UPCOMING EVENTS</div>
            <Link href="/events" className="text-[10px] font-semibold text-[#1a6b3a] hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {events.map(ev => {
              const color = CAT_COLOR[ev.category] || '#6b6b6b'
              return (
                <div key={ev.id} className="card flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
                    <span className="text-[8px] font-bold uppercase" style={{ color }}>{new Date(ev.event_date).toLocaleDateString('en', { month: 'short' })}</span>
                    <span className="text-base font-black text-[#0a0a0a] leading-none">{new Date(ev.event_date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0a0a0a] text-xs truncate">{ev.title}</p>
                    <p className="text-[10px] text-[#aaa] truncate">{ev.location}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
  )
}

/* ════════════════════════════════════════════════════
   MAIN DASHBOARD — routes to correct view
═══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { student } = useAuth()
  const s = student as any

  return (
    <AppShell>
      <TopBar />
      {s?.studentType === 'returning' ? <ReturningDashboard /> : <FresherDashboard />}
    </AppShell>
  )
}
