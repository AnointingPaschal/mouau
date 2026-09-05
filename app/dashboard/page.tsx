'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { REGISTRATION_STEPS } from '@/lib/data'
import { getRegistrationProgress, getDownloadHistory } from '@/lib/auth'
import { getAnnouncements, getSiteContent } from '@/lib/db'
import Link from 'next/link'
import { MapPin, ClipboardList, BookOpen, MessageCircle, Users, AlertTriangle, Info, CheckCircle2, Calendar, ChevronRight, TrendingUp, Bell, Download } from 'lucide-react'

type Ann = { id:string; title:string; body:string; type:string; pinned:boolean; created_at:string }

export default function Dashboard() {
  const { student } = useAuth()
  const [progress, setProgress] = useState<Record<string,boolean>>({})
  const [downloads, setDownloads] = useState<string[]>([])
  const [anns, setAnns] = useState<Ann[]>([])
  const [content, setContent] = useState<Record<string,string>>({})

  useEffect(() => {
    setProgress(getRegistrationProgress())
    setDownloads(getDownloadHistory())
    getAnnouncements().then(({ data }) => { if (data) setAnns(data as Ann[]) })
    getSiteContent().then(setContent)
  }, [])

  const total = REGISTRATION_STEPS.reduce((a,s)=>a+s.substeps.length,0)
  const done = Object.values(progress).filter(Boolean).length
  const pct = Math.round((done/total)*100)

  const annIcon = (t: string) => {
    if (t==='warning') return <AlertTriangle className="w-3.5 h-3.5 text-amber-500"/>
    if (t==='success') return <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/>
    if (t==='event') return <Calendar className="w-3.5 h-3.5 text-blue-500"/>
    return <Info className="w-3.5 h-3.5 text-[#1a6b3a]"/>
  }
  const annBorder = (t: string) => {
    if (t==='warning') return 'border-l-amber-400'
    if (t==='success') return 'border-l-[#1a6b3a]'
    if (t==='event') return 'border-l-blue-400'
    return 'border-l-[#1a6b3a]'
  }

  return (
    <AppShell>
      <TopBar/>
      <div className="p-4 lg:p-5 max-w-2xl mx-auto space-y-5 animate-fade-in">

        {/* Hero banner */}
        <div className="bg-[#0a0a0a] rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#1a6b3a]/20 rounded-full -translate-y-1/2 translate-x-1/2"/>
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/40 text-[10px] font-semibold tracking-widest uppercase mb-1">MOUAU · 2024/2025</p>
                <h2 className="text-white font-black text-lg leading-tight">
                  {student?.name?.split(' ')[0]}'s<br/>
                  <span className="text-[#1a6b3a]">Campus Hub</span>
                </h2>
                <p className="text-white/40 text-xs mt-1">{student?.level||'100'} Level Student</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-white">{pct}%</div>
                <div className="text-white/40 text-[10px] uppercase tracking-wide">Registered</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
                <span>Registration Progress</span><span>{done}/{total} steps</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#1a6b3a] rounded-full transition-all duration-700" style={{width:`${pct}%`}}/>
              </div>
            </div>
            {pct < 100 && (
              <Link href="/register" className="inline-flex items-center gap-1.5 mt-3 bg-[#1a6b3a] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#145530] transition-colors">
                Continue Registration <ChevronRight className="w-3 h-3"/>
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            {label:'Downloads',value:downloads.length,icon:Download,color:'#6b6b6b'},
            {label:'Progress',value:`${pct}%`,icon:TrendingUp,color:'#1a6b3a'},
            {label:'Points',value:student?.points||0,icon:Bell,color:'#6b6b6b'},
          ].map(({label,value,icon:Icon,color})=>(
            <div key={label} className="card p-3 text-center">
              <Icon className="w-4 h-4 mx-auto mb-1.5" style={{color}} strokeWidth={2}/>
              <div className="font-black text-sm text-[#0a0a0a]">{value}</div>
              <div className="text-[10px] text-[#aaa] uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <div className="section-label mb-3">QUICK ACTIONS</div>
          <div className="space-y-2">
            {[
              { href:'/navigate', icon:MapPin, label:'Campus Map', desc:'Find buildings, routes & locations' },
              { href:'/register', icon:ClipboardList, label:'Registration Guide', desc:'Step-by-step admission checklist' },
              { href:'/library', icon:BookOpen, label:'Study Library', desc:'Past questions, notes & projects' },
              { href:'/chat', icon:MessageCircle, label:'AI Assistant', desc:'Ask any question about MOUAU' },
              { href:'/forum', icon:Users, label:'Community Forum', desc:'Connect with fellow students' },
            ].map(({href,icon:Icon,label,desc})=>(
              <Link key={href} href={href} className="card card-hover flex items-center gap-3 px-4 py-3 group">
                <div className="w-8 h-8 border border-[#e8e8e8] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:border-[#1a6b3a]/30 transition-colors">
                  <Icon className="w-4 h-4 text-[#1a6b3a]" strokeWidth={2}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0a0a0a] text-sm">{label}</p>
                  <p className="text-[#aaa] text-xs truncate">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#ddd] group-hover:text-[#1a6b3a] group-hover:translate-x-0.5 transition-all flex-shrink-0"/>
              </Link>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div>
          <div className="section-label mb-3">ANNOUNCEMENTS</div>
          {anns.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-[#aaa] text-sm">No announcements yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {anns.map(ann=>(
                <div key={ann.id} className={`card border-l-4 ${annBorder(ann.type)} p-3.5`}>
                  <div className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 mt-0.5">{annIcon(ann.type)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#0a0a0a] text-xs leading-tight">{ann.title}</p>
                        {ann.pinned && <span className="badge badge-green text-[9px]">Pinned</span>}
                      </div>
                      <p className="text-[#6b6b6b] text-[11px] mt-1 leading-relaxed line-clamp-2">{ann.body}</p>
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
