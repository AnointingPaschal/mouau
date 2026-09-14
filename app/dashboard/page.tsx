'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import GallerySlideshow from '@/components/GallerySlideshow'
import { useAuth } from '@/components/AuthProvider'
import { getAnnouncements } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  ClipboardList, Users, Calculator, Clock,
  AlertTriangle, Info, CheckCircle2, Calendar,
  ChevronRight, Navigation2, MapPin, Zap,
  BookOpen, GraduationCap, TrendingUp, Star
} from 'lucide-react'

type Ann = { id:string; title:string; body:string; type:string; pinned:boolean; created_at:string }

// Level-specific quick actions
const FRESHER_ACTIONS = [
  { href:'/register',   label:'Register',   icon:ClipboardList, color:'#d97706' },
  { href:'/navigate',   label:'Map',        icon:MapPin,        color:'#1e3a8a' },
  { href:'/library',    label:'Library',    icon:BookOpen,      color:'#1a6b3a' },
  { href:'/pdm',        label:'PDM',        icon:Users,         color:'#b91c1c' },
  { href:'/timetable',  label:'Timetable',  icon:Clock,         color:'#059669' },
]

const RETURNING_ACTIONS = [
  { href:'/skills',     label:'Skills',     icon:Zap,           color:'#7c3aed' },
  { href:'/calculator', label:'CGPA',       icon:Calculator,    color:'#0284c7' },
  { href:'/library',    label:'Library',    icon:BookOpen,      color:'#1a6b3a' },
  { href:'/pdm',        label:'PDM',        icon:Users,         color:'#b91c1c' },
  { href:'/timetable',  label:'Timetable',  icon:Clock,         color:'#059669' },
]

const annBorder = (t:string) => {
  if(t==='warning') return 'border-l-amber-400'
  if(t==='success') return 'border-l-[#1a6b3a]'
  if(t==='event')   return 'border-l-blue-400'
  return 'border-l-[#1e3a8a]'
}
const annIcon = (t:string) => {
  if(t==='warning') return <AlertTriangle className="w-3.5 h-3.5 text-amber-500"/>
  if(t==='success') return <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/>
  if(t==='event')   return <Calendar className="w-3.5 h-3.5 text-blue-500"/>
  return <Info className="w-3.5 h-3.5 text-[#1e3a8a]"/>
}

export default function Dashboard() {
  const { student } = useAuth()
  const [anns,        setAnns]        = useState<Ann[]>([])
  const [pct,         setPct]         = useState(0)
  const [doneCount,   setDoneCount]   = useState(0)
  const [totalCount,  setTotalCount]  = useState(0)

  useEffect(() => {
    getAnnouncements().then(({ data }) => { if(data) setAnns(data as Ann[]) })

    if(!student?.idNumber) return
    try {
      const raw = localStorage.getItem(`reg_progress_${student.idNumber}`)
      const checked: Record<string,boolean> = raw ? JSON.parse(raw) : {}
      const done = Object.values(checked).filter(Boolean).length
      setDoneCount(done)
      supabase.from('registration_steps').select('substeps').eq('active',true)
        .then(({ data }) => {
          if(!data) return
          let total=0
          data.forEach((s:any)=>{
            const subs=Array.isArray(s.substeps)?s.substeps:(()=>{try{return JSON.parse(s.substeps||'[]')}catch{return[]}})()
            total+=subs.length
          })
          setTotalCount(total)
          setPct(total>0?Math.round((done/total)*100):0)
        })
    } catch {}
  }, [student?.idNumber])

  const h = new Date().getHours()
  const greet = h<5?'Good night':h<12?'Good morning':h<17?'Good afternoon':'Good evening'
  const firstName  = student?.name?.split(' ')[0] || 'Student'
  const isFresher  = !student?.level || student.level === '100'
  const quickActions = isFresher ? FRESHER_ACTIONS : RETURNING_ACTIONS

  return (
    <AppShell>
      <TopBar/>
      <div className="pb-24 animate-fade-in">

        {/* ── Pneuma Domain Hero ── */}
        <div className="relative overflow-hidden" style={{background:'#0a0a0a'}}>
          {/* Tri-color glow blobs */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl" style={{background:'#1e3a8a', transform:'translate(30%, -30%)'}}/>
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-15 blur-3xl" style={{background:'#b91c1c', transform:'translate(-30%, 30%)'}}/>
          <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full opacity-10 blur-3xl" style={{background:'#c2410c'}}/>

          <div className="relative z-10 px-4 pt-5 pb-4">
            {/* Presented by badge */}
            <div className="inline-flex items-center gap-2 mb-4 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
              <div className="flex gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a]"/>
                <div className="w-1.5 h-1.5 rounded-full bg-[#b91c1c]"/>
                <div className="w-1.5 h-1.5 rounded-full bg-[#c2410c]"/>
              </div>
              <span className="text-white/60 text-[9px] font-bold tracking-widest uppercase">Presented by Pneuma Domain Ministry</span>
            </div>

            {/* Greeting + name */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/40 text-xs">{greet},</p>
                <h1 className="text-white font-black text-2xl leading-tight">
                  {firstName}'s<br/>
                  <span style={{background: isFresher
                    ? 'linear-gradient(90deg,#fbbf24,#f87171)'
                    : 'linear-gradient(90deg,#60a5fa,#f87171,#fb923c)',
                    WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                    {isFresher ? 'Fresher Hub' : 'Campus Hub'}
                  </span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-white/40 text-xs">MOUAU · 2024/2025</p>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full
                    ${isFresher ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/60'}`}>
                    {student?.level || '100'}L {isFresher ? '• Fresher' : ''}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-white">{pct}%</div>
                <div className="text-white/40 text-[9px] uppercase tracking-wide">Registered</div>
              </div>
            </div>

            {/* Registration progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-[9px] text-white/30 mb-1">
                <span>Registration Progress</span>
                <span>{doneCount}/{totalCount} steps</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{width:`${pct}%`, background:'linear-gradient(90deg,#1e3a8a,#b91c1c,#c2410c)'}}/>
              </div>
            </div>

            {pct < 100 && (
              <Link href="/register"
                className="inline-flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2 rounded-xl"
                style={{background:'linear-gradient(135deg,#1e3a8a,#b91c1c)'}}>
                Continue Registration <ChevronRight className="w-3 h-3"/>
              </Link>
            )}
          </div>

        </div>

        <div className="px-4 pt-4 space-y-4">

          {/* Quick Actions — level-aware */}
          <div>
            <p className="section-label mb-2.5">QUICK ACTIONS</p>
            <div className="grid grid-cols-5 gap-2">
              {quickActions.map(({ href, label, icon:Icon, color }) => (
                <Link key={href} href={href}
                  className="card card-hover flex flex-col items-center gap-1.5 py-2.5 px-1 text-center group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
                    style={{ background: color+'18' }}>
                    <Icon className="w-4 h-4" style={{ color }}/>
                  </div>
                  <span className="text-[9px] font-semibold text-[#0a0a0a] leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Level-specific featured section */}
          {isFresher ? (
            <div>
              <p className="section-label mb-2.5">FRESHER CORNER</p>
              <div className="space-y-2">
                <Link href="/register" className="card flex items-center gap-3 p-3.5 border-l-4 border-l-amber-400 hover:shadow-md transition-all">
                  <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0"><ClipboardList className="w-5 h-5 text-amber-500"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0a0a0a] text-sm">Complete Your Registration</p>
                    <p className="text-[11px] text-[#6b6b6b]">Follow our 49-step guide to complete MOUAU registration</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0"/>
                </Link>
                <Link href="/navigate" className="card flex items-center gap-3 p-3.5 border-l-4 border-l-[#1e3a8a] hover:shadow-md transition-all">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-[#1e3a8a]"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0a0a0a] text-sm">Explore the Campus</p>
                    <p className="text-[11px] text-[#6b6b6b]">GPS map of hostels, lecture halls, admin blocks & more</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#1e3a8a] flex-shrink-0"/>
                </Link>
                <Link href="/pdm" className="card flex items-center gap-3 p-3.5 border-l-4 border-l-[#1a6b3a] hover:shadow-md transition-all">
                  <div className="w-9 h-9 bg-[#1a6b3a]/10 rounded-xl flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5 text-[#1a6b3a]"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0a0a0a] text-sm">Join Pneuma Domain Ministry</p>
                    <p className="text-[11px] text-[#6b6b6b]">Faith, fellowship & growth for every MOUAU student</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#1a6b3a] flex-shrink-0"/>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="section-label mb-2.5">STUDENT TOOLS</p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { href:'/skills',     label:'Skill Acquisition', sub:'Learn new practical skills',   icon:Zap,        bg:'bg-purple-50',   color:'#7c3aed' },
                  { href:'/calculator', label:'CGPA Calculator',   sub:'Track academic progress',       icon:Calculator, bg:'bg-blue-50',     color:'#0284c7' },
                  { href:'/library',    label:'Study Library',     sub:'Past questions & notes',        icon:BookOpen,   bg:'bg-[#1a6b3a]/10',color:'#1a6b3a' },
                  { href:'/timetable',  label:'Class Timetable',   sub:'Weekly schedule builder',       icon:Clock,      bg:'bg-green-50',    color:'#059669' },
                ].map(({ href, label, sub, icon:Icon, bg, color }) => (
                  <Link key={href} href={href} className="card p-3.5 flex flex-col gap-2 hover:shadow-md transition-all group">
                    <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}><Icon className="w-5 h-5" style={{color}}/></div>
                    <div><p className="font-bold text-[#0a0a0a] text-sm">{label}</p><p className="text-[10px] text-[#aaa]">{sub}</p></div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Navigate to Church + Explore Campus */}
          <div className="grid grid-cols-2 gap-2.5">
            <Link href="/places"
              className="relative overflow-hidden rounded-2xl flex items-center gap-2.5 px-3.5 py-3 bg-[#0a0a0a] group">
              <div className="absolute inset-0 opacity-30" style={{background:'linear-gradient(135deg,#1e3a8a,#b91c1c)'}}/>
              <MapPin className="w-4 h-4 text-white relative z-10 flex-shrink-0"/>
              <div className="relative z-10 min-w-0">
                <p className="text-white font-bold text-xs leading-tight">Campus Places</p>
                <p className="text-white/50 text-[9px]">Navigate MOUAU</p>
              </div>
            </Link>
            <Link
              href="/navigate?to=5.478133%2C7.533195&name=Pneuma+Domain+Ministry&auto=1"
              className="relative overflow-hidden rounded-2xl flex items-center gap-2.5 px-3.5 py-3 bg-[#0a0a0a] group">
              <div className="absolute inset-0 opacity-30" style={{background:'linear-gradient(135deg,#b91c1c,#c2410c)'}}/>
              <Navigation2 className="w-4 h-4 text-white relative z-10 flex-shrink-0"/>
              <div className="relative z-10 min-w-0 text-left">
                <p className="text-white font-bold text-xs leading-tight">Pneuma Domain</p>
                <p className="text-white/50 text-[9px]">Get directions</p>
              </div>
            </Link>
          </div>

          {/* Gallery */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="section-label">PNEUMA DOMAIN GALLERY</p>
              <Link href="/library" className="text-[9px] font-bold" style={{color:'#1e3a8a'}}>Library →</Link>
            </div>
            <GallerySlideshow/>
          </div>

          {/* Announcements */}
          {anns.length > 0 && (
            <div>
              <p className="section-label mb-2.5">ANNOUNCEMENTS</p>
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
            </div>
          )}

        </div>
      </div>
    </AppShell>
  )
}
