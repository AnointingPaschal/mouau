'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { REGISTRATION_STEPS } from '@/lib/data'
import { getRegistrationProgress, getDownloadHistory } from '@/lib/auth'
import { getAnnouncements } from '@/lib/db'
import Link from 'next/link'
import { MapPin, ClipboardList, BookOpen, MessageCircle, Users, Download, Star, AlertTriangle, Info, CheckCircle2, Calendar, ChevronRight, Sparkles, TrendingUp, Bell } from 'lucide-react'

type Announcement = { id: string; title: string; body: string; type: string; pinned: boolean; created_at: string }

export default function Dashboard() {
  const { student } = useAuth()
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [downloads, setDownloads] = useState<string[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    setProgress(getRegistrationProgress())
    setDownloads(getDownloadHistory())
    getAnnouncements().then(({ data }) => { if (data) setAnnouncements(data as Announcement[]) })
  }, [])

  const totalSteps = REGISTRATION_STEPS.reduce((a, s) => a + s.substeps.length, 0)
  const completed = Object.values(progress).filter(Boolean).length
  const percent = Math.round((completed / totalSteps) * 100)

  const quickActions = [
    { href:'/navigate', icon:MapPin, label:'Campus Map', desc:'Find locations', iconBg:'bg-emerald-100', iconColor:'text-emerald-700' },
    { href:'/register', icon:ClipboardList, label:'Registration', desc:'Admission steps', iconBg:'bg-blue-100', iconColor:'text-blue-700' },
    { href:'/library', icon:BookOpen, label:'Materials', desc:'Handouts & PQs', iconBg:'bg-purple-100', iconColor:'text-purple-700' },
    { href:'/chat', icon:MessageCircle, label:'AI Assistant', desc:'Ask anything', iconBg:'bg-amber-100', iconColor:'text-amber-700' },
    { href:'/forum', icon:Users, label:'Community', desc:'Ask students', iconBg:'bg-pink-100', iconColor:'text-pink-700' },
  ]

  const annIcon = (t: string) => {
    if (t==='warning') return <AlertTriangle className="w-3 h-3 text-amber-500"/>
    if (t==='success') return <CheckCircle2 className="w-3 h-3 text-green-500"/>
    if (t==='event') return <Calendar className="w-3 h-3 text-blue-500"/>
    return <Info className="w-3 h-3 text-mouau"/>
  }
  const annBg = (t: string) => {
    if (t==='warning') return 'border-l-amber-400 bg-amber-50'
    if (t==='success') return 'border-l-green-400 bg-green-50'
    if (t==='event') return 'border-l-blue-400 bg-blue-50'
    return 'border-l-mouau bg-mouau-surface'
  }

  return (
    <AppShell>
      <TopBar/>
      <div className="p-3 lg:p-4 space-y-3 animate-fade-in">

        {/* Hero */}
        <div className="relative bg-green-gradient rounded-xl p-3.5 overflow-hidden shadow-md">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full"/>
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-gold"/>
                  <span className="text-gold text-[10px] font-semibold uppercase tracking-wide">Welcome to MOUAU</span>
                </div>
                <h2 className="text-white font-black text-base leading-tight">{student?.name?.split(' ')[0]}'s Campus Hub</h2>
                <p className="text-white/60 text-[10px] mt-0.5">Session 2024/2025 · {student?.level||'100'} Level</p>
              </div>
              <div className="text-right">
                <div className="text-white font-black text-2xl leading-none">{percent}%</div>
                <div className="text-white/50 text-[10px]">Registered</div>
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex justify-between text-[10px] text-white/50 mb-1">
                <span>Registration</span><span>{completed}/{totalSteps}</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{width:`${percent}%`}}/></div>
            </div>
            {percent < 100 && (
              <Link href="/register" className="inline-flex items-center gap-1 mt-2 bg-gold text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg hover:bg-gold-light transition-all">
                Continue Registration <ChevronRight className="w-3 h-3"/>
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {label:'Downloads',value:downloads.length,icon:Download,color:'text-purple-600',bg:'bg-purple-50'},
            {label:'Progress',value:`${percent}%`,icon:TrendingUp,color:'text-mouau',bg:'bg-mouau-surface'},
            {label:'Points',value:student?.points||0,icon:Star,color:'text-amber-600',bg:'bg-amber-50'},
          ].map(({label,value,icon:Icon,color,bg})=>(
            <div key={label} className="card p-2.5 text-center">
              <div className={`w-6 h-6 ${bg} rounded-lg flex items-center justify-center mx-auto mb-1`}>
                <Icon className={`w-3.5 h-3.5 ${color}`}/>
              </div>
              <div className={`font-black text-sm ${color}`}>{value}</div>
              <div className="text-gray-400 text-[10px]">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="section-title mb-2">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {quickActions.map(({href,icon:Icon,label,desc,iconBg,iconColor})=>(
              <Link key={href} href={href} className="card card-hover p-3 flex items-center gap-2.5 group">
                <div className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-3.5 h-3.5 ${iconColor}`} strokeWidth={2}/>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-mouau-dark text-xs">{label}</p>
                  <p className="text-gray-400 text-[10px] truncate">{desc}</p>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-mouau group-hover:translate-x-0.5 transition-all flex-shrink-0"/>
              </Link>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="section-title">Announcements</h2>
            <Bell className="w-3.5 h-3.5 text-gray-400"/>
          </div>
          {announcements.length === 0 ? (
            <div className="card p-4 text-center">
              <p className="text-gray-400 text-xs">No announcements yet.</p>
              <p className="text-gray-300 text-[10px] mt-0.5">Check back later or visit the Admin Block.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {announcements.map(ann=>(
                <div key={ann.id} className={`card border-l-4 ${annBg(ann.type)} p-3 ${ann.pinned?'ring-1 ring-gold/20':''}`}>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex-shrink-0">{annIcon(ann.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-semibold text-xs text-gray-800 leading-tight">{ann.title}</h3>
                        {ann.pinned&&<span className="badge badge-gold flex-shrink-0">Pinned</span>}
                      </div>
                      <p className="text-gray-500 text-[10px] mt-0.5 leading-relaxed line-clamp-2">{ann.body}</p>
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
