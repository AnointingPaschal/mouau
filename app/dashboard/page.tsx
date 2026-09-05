'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { ANNOUNCEMENTS, REGISTRATION_STEPS } from '@/lib/data'
import { getRegistrationProgress, getDownloadHistory } from '@/lib/auth'
import Link from 'next/link'
import {
  MapPin, ClipboardList, BookOpen, MessageCircle, Users,
  Download, Star, AlertTriangle, Info, CheckCircle2, Calendar,
  ChevronRight, Sparkles, TrendingUp, Bell
} from 'lucide-react'

export default function Dashboard() {
  const { student } = useAuth()
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [downloads, setDownloads] = useState<string[]>([])

  useEffect(() => {
    setProgress(getRegistrationProgress())
    setDownloads(getDownloadHistory())
  }, [])

  const totalSteps = REGISTRATION_STEPS.reduce((acc, s) => acc + s.substeps.length, 0)
  const completedSteps = Object.values(progress).filter(Boolean).length
  const regPercent = Math.round((completedSteps / totalSteps) * 100)

  const quickActions = [
    { href:'/navigate', icon:MapPin, label:'Campus Map', desc:'Find buildings & routes', iconBg:'bg-emerald-100', iconColor:'text-emerald-700' },
    { href:'/register', icon:ClipboardList, label:'Registration', desc:'Your admission checklist', iconBg:'bg-blue-100', iconColor:'text-blue-700' },
    { href:'/library', icon:BookOpen, label:'Materials', desc:'Handouts & past questions', iconBg:'bg-purple-100', iconColor:'text-purple-700' },
    { href:'/chat', icon:MessageCircle, label:'AI Assistant', desc:'Ask campus questions', iconBg:'bg-amber-100', iconColor:'text-amber-700' },
    { href:'/forum', icon:Users, label:'Community', desc:'Connect with students', iconBg:'bg-pink-100', iconColor:'text-pink-700' },
  ]

  const annIcon = (type: string) => {
    if (type==='warning') return <AlertTriangle className="w-4 h-4 text-amber-500"/>
    if (type==='success') return <CheckCircle2 className="w-4 h-4 text-green-500"/>
    if (type==='event') return <Calendar className="w-4 h-4 text-blue-500"/>
    return <Info className="w-4 h-4 text-mouau"/>
  }
  const annBg = (type: string) => {
    if (type==='warning') return 'border-l-amber-400 bg-amber-50'
    if (type==='success') return 'border-l-green-400 bg-green-50'
    if (type==='event') return 'border-l-blue-400 bg-blue-50'
    return 'border-l-mouau bg-mouau-surface'
  }

  return (
    <AppShell>
      <TopBar />
      <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
        {/* Hero Banner */}
        <div className="relative bg-green-gradient rounded-2xl p-5 lg:p-7 overflow-hidden shadow-lg">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full"/>
          <div className="absolute -right-4 bottom-0 w-24 h-24 bg-white/5 rounded-full"/>
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-gold"/>
                  <span className="text-gold text-xs font-semibold uppercase tracking-wider">Welcome to MOUAU</span>
                </div>
                <h2 className="text-white font-black text-2xl leading-tight">
                  {student?.name?.split(' ')[0]}'s Campus Hub
                </h2>
                <p className="text-white/70 text-sm mt-1">Session 2024/2025 · {student?.level || '100'} Level</p>
              </div>
              <div className="text-right">
                <div className="text-white font-black text-3xl">{regPercent}%</div>
                <div className="text-white/60 text-xs">Registered</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-white/60 mb-1.5">
                <span>Registration Progress</span>
                <span>{completedSteps}/{totalSteps} steps</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{width:`${regPercent}%`}}/></div>
            </div>
            {regPercent < 100 && (
              <Link href="/register" className="inline-flex items-center gap-2 mt-4 bg-gold text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-gold-light transition-all">
                Continue Registration <ChevronRight className="w-3.5 h-3.5"/>
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {label:'Downloads',value:downloads.length,icon:Download,color:'text-purple-600',bg:'bg-purple-50'},
            {label:'Reg. Progress',value:`${regPercent}%`,icon:TrendingUp,color:'text-mouau',bg:'bg-mouau-surface'},
            {label:'Points',value:student?.points||0,icon:Star,color:'text-amber-600',bg:'bg-amber-50'},
          ].map(({label,value,icon:Icon,color,bg})=>(
            <div key={label} className="card p-3 lg:p-4 text-center">
              <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-4 h-4 ${color}`}/>
              </div>
              <div className={`font-black text-lg ${color}`}>{value}</div>
              <div className="text-gray-500 text-xs">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="section-title mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions.map(({href,icon:Icon,label,desc,iconBg,iconColor})=>(
              <Link key={href} href={href} className="card card-hover p-4 flex flex-col gap-3 group animate-slide-up">
                <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2}/>
                </div>
                <div>
                  <p className="font-bold text-mouau-dark text-sm">{label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-mouau group-hover:translate-x-1 transition-all mt-auto self-end"/>
              </Link>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Announcements</h2>
            <Bell className="w-4 h-4 text-gray-400"/>
          </div>
          <div className="space-y-3">
            {ANNOUNCEMENTS.map(ann=>(
              <div key={ann.id} className={`card border-l-4 ${annBg(ann.type)} p-4 ${ann.pinned?'ring-1 ring-gold/20':''}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{annIcon(ann.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-gray-800 leading-tight">{ann.title}</h3>
                      {ann.pinned&&<span className="badge badge-gold flex-shrink-0">Pinned</span>}
                    </div>
                    <p className="text-gray-600 text-xs mt-1 leading-relaxed line-clamp-2">{ann.body}</p>
                    <p className="text-gray-400 text-xs mt-2">{ann.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-mouau-surface to-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-gold"/>
            <h3 className="font-bold text-mouau text-sm">Did You Know?</h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            The MOUAU library holds over 50,000 volumes and has dedicated computer labs. Your student ID gives you free access — register at the library today!
          </p>
        </div>
      </div>
    </AppShell>
  )
}
