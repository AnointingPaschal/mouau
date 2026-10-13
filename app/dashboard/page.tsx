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
  ClipboardList, Users, Calculator,
  AlertTriangle, Info, CheckCircle2, Calendar,
  ChevronRight, Navigation2, MapPin, Zap,
  BookOpen, Award, ArrowUpRight, Phone, Wifi,
  Gamepad2, Plus, Copy, Building2, RefreshCw,
  Wallet, Send, Eye, EyeOff, Hash, MessageSquare,
} from 'lucide-react'

type Ann = { id:string; title:string; body:string; type:string; pinned:boolean; created_at:string }

const CAMPUS_ACTIONS_FRESHER = [
  { href:'/register',   label:'Register', icon:ClipboardList, color:'#d97706' },
  { href:'/cutoff',     label:'Cut-Off',  icon:Award,         color:'#1e3a8a' },
  { href:'/skills',     label:'Skills',   icon:Zap,           color:'#7c3aed' },
  { href:'/library',    label:'Library',  icon:BookOpen,      color:'#1a6b3a' },
  { href:'/pdm',        label:'PDM',      icon:Users,         color:'#b91c1c' },
]
const CAMPUS_ACTIONS_RETURNING = [
  { href:'/skills',     label:'Skills',   icon:Zap,           color:'#7c3aed' },
  { href:'/calculator', label:'CGPA',     icon:Calculator,    color:'#0284c7' },
  { href:'/cutoff',     label:'Cut-Off',  icon:Award,         color:'#1e3a8a' },
  { href:'/library',    label:'Library',  icon:BookOpen,      color:'#1a6b3a' },
  { href:'/pdm',        label:'PDM',      icon:Users,         color:'#b91c1c' },
]
const BILL_ACTIONS = [
  { href:'/wallet/fund',     label:'Fund',    icon:Plus,         color:'#059669' },
  { href:'/wallet/transfer', label:'Send',    icon:Send,         color:'#1e3a8a' },
  { href:'/wallet/airtime',  label:'Airtime', icon:Phone,        color:'#c2410c' },
  { href:'/wallet/data',     label:'Data',    icon:Wifi,         color:'#7c3aed' },
  { href:'/wallet/bills',    label:'Bills',   icon:Gamepad2,     color:'#d97706' },
]

const annBorder = (t:string) => {
  if(t==='warning') return 'border-l-amber-400'
  if(t==='success') return 'border-l-[#1a6b3a]'
  if(t==='event')   return 'border-l-blue-400'
  return 'border-l-[#1e3a8a]'
}
const annIcon = (t:string) => {
  if(t==='warning') return <AlertTriangle className="w-3.5 h-3.5 text-amber-500"/>
  if(t==='success') return <CheckCircle2  className="w-3.5 h-3.5 text-[#1a6b3a]"/>
  if(t==='event')   return <Calendar      className="w-3.5 h-3.5 text-blue-500"/>
  return <Info className="w-3.5 h-3.5 text-[#1e3a8a]"/>
}

export default function Dashboard() {
  const { student } = useAuth()
  const [anns,          setAnns]          = useState<Ann[]>([])
  const [pct,           setPct]           = useState(0)
  const [doneCount,     setDoneCount]     = useState(0)
  const [totalCount,    setTotalCount]    = useState(0)
  const [wallet,        setWallet]        = useState<any>(null)
  const [walletEnabled, setWalletEnabled] = useState(false)
  const [walletLoading, setWalletLoading] = useState(true)
  const [creating,      setCreating]      = useState(false)
  const [copied,        setCopied]        = useState(false)
  const [hideBalance,   setHideBalance]   = useState(false)
  const [createError,   setCreateError]   = useState('')

  const fetchWallet = async (sid: string) => {
    try {
      const r = await fetch(`/api/wallet?studentId=${sid}`)
      const d = await r.json()
      setWallet(d.wallet || null)
    } catch {}
    setWalletLoading(false)
  }

  useEffect(() => {
    getAnnouncements().then(({ data }) => { if(data) setAnns(data as Ann[]) })
    if(!student?.idNumber) { setWalletLoading(false); return }

    // Registration progress
    try {
      const raw = localStorage.getItem(`reg_progress_${student.idNumber}`)
      const checked: Record<string,boolean> = raw ? JSON.parse(raw) : {}
      const done = Object.values(checked).filter(Boolean).length
      setDoneCount(done)
      supabase.from('registration_steps').select('substeps').eq('active',true)
        .then(({ data }) => {
          if(!data) return
          let total = 0
          data.forEach((s:any) => {
            const subs = Array.isArray(s.substeps) ? s.substeps
              : (()=>{try{return JSON.parse(s.substeps||'[]')}catch{return[]}})()
            total += subs.length
          })
          setTotalCount(total)
          setPct(total>0 ? Math.round((done/total)*100) : 0)
        })
    } catch {}

    // Wallet
    fetch('/api/admin/wallet-toggle')
      .then(r => r.json())
      .then(d => {
        setWalletEnabled(!!d.enabled)
        if (d.enabled) fetchWallet(student.idNumber)
        else setWalletLoading(false)
      })
      .catch(() => setWalletLoading(false))
  }, [student?.idNumber])

  const createAccount = async () => {
    if (!student) return
    setCreating(true); setCreateError('')
    const r = await fetch('/api/wallet/create-virtual-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId:   student.idNumber,
        studentName: student.name,
        email:       student.email || `${student.idNumber}@mouau.edu.ng`,
        phone:       student.phone || '08000000000',
      }),
    })
    const d = await r.json()
    setCreating(false)
    if (d.error) setCreateError(d.error)
    else fetchWallet(student.idNumber)
  }

  const copyAcct = () => {
    if(!wallet?.account_number) return
    navigator.clipboard.writeText(wallet.account_number)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const h = new Date().getHours()
  const greet = h<5?'Good night':h<12?'Good morning':h<17?'Good afternoon':'Good evening'
  const firstName     = student?.name?.split(' ')[0] || 'Student'
  const isFresher     = !student?.level || student.level === '100'
  const campusActions = isFresher ? CAMPUS_ACTIONS_FRESHER : CAMPUS_ACTIONS_RETURNING
  const balance       = parseFloat(wallet?.balance ?? 0)

  return (
    <AppShell>
      <TopBar/>
      <div className="pb-28 animate-fade-in">

        {/* ══ TOP GREETING BAR ══════════════════════════════════════════════ */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#aaa]">{greet},</p>
            <h1 className="font-black text-[#0a0a0a] text-base leading-tight">{firstName} 👋</h1>
          </div>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border
            ${isFresher ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-[#f0f4ff] text-[#1e3a8a] border-[#1e3a8a]/20'}`}>
            {student?.level||'100'}L · MOUAU
          </span>
        </div>

        <div className="px-4 space-y-2.5">

          {/* ══ WALLET CARD ══════════════════════════════════════════════════ */}
          {walletEnabled && (
            <div className="rounded-2xl overflow-hidden shadow-md"
              style={{background:'linear-gradient(135deg,#0f2d1a 0%,#1a6b3a 60%,#145530 100%)'}}>

              {/* Balance row */}
              <div className="px-4 pt-3.5 pb-2.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Wallet className="w-3 h-3 text-white/50"/>
                    <span className="text-white/50 text-[9px] font-bold uppercase tracking-widest">PDM Wallet</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => student?.idNumber && fetchWallet(student.idNumber)}
                      className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                      <RefreshCw className="w-2.5 h-2.5 text-white/60"/>
                    </button>
                    <button onClick={() => setHideBalance(p => !p)}
                      className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                      {hideBalance ? <EyeOff className="w-2.5 h-2.5 text-white/60"/> : <Eye className="w-2.5 h-2.5 text-white/60"/>}
                    </button>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-white/40 text-[8px] uppercase tracking-widest mb-0.5">Balance</p>
                    {walletLoading
                      ? <div className="h-6 w-24 bg-white/10 rounded animate-pulse"/>
                      : <p className="text-white font-black text-xl leading-none">
                          {hideBalance ? '₦ ••••' : `₦${balance.toLocaleString('en-NG',{minimumFractionDigits:2})}`}
                        </p>}
                  </div>
                  {!walletLoading && wallet?.account_number && (
                    <button onClick={copyAcct}
                      className="flex items-center gap-1 bg-white/15 hover:bg-white/25 transition-all px-2.5 py-1.5 rounded-lg">
                      {copied ? <CheckCircle2 className="w-3 h-3 text-green-300"/> : <Copy className="w-3 h-3 text-white/60"/>}
                      <span className="text-white/60 text-[9px] font-bold">{copied ? 'Copied' : wallet.account_number}</span>
                    </button>
                  )}
                </div>
                {!walletLoading && wallet?.account_number && (
                  <p className="text-white/30 text-[8px] mt-0.5">{wallet.bank_name || 'Flutterwave MFB'} · {wallet.account_name || student?.name}</p>
                )}
              </div>

              {/* Create account (no wallet yet) */}
              {!walletLoading && !wallet?.account_number && (
                <div className="px-4 pb-3">
                  {createError && <p className="text-red-300 text-[9px] mb-1.5">{createError}</p>}
                  <button onClick={createAccount} disabled={creating}
                    className="w-full py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-60">
                    {creating
                      ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Creating…</>
                      : <><Building2 className="w-3 h-3"/> Create Virtual Account</>}
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="mx-4 h-px bg-white/10"/>

              {/* Quick wallet actions */}
              <div className="px-4 py-2.5">
                <div className="grid grid-cols-5 gap-1.5">
                  {BILL_ACTIONS.map(({ href, label, icon:Icon }) => (
                    <Link key={href} href={href}
                      className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-95">
                      <Icon className="w-3.5 h-3.5 text-white"/>
                      <span className="text-[8px] font-bold text-white/60">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ REGISTRATION PROGRESS ════════════════════════════════════════ */}
          {isFresher && totalCount > 0 && (
            <div className="card px-3.5 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <p className="text-[9px] font-black text-[#aaa] uppercase tracking-widest">Registration · MOUAU 2024/2025</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-black text-[#1a6b3a]">{pct}%</p>
                  <p className="text-[9px] text-[#aaa]">{doneCount}/{totalCount}</p>
                </div>
              </div>
              <div className="h-1 bg-[#f0f0f0] rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{width:`${pct}%`,background:'linear-gradient(90deg,#1a6b3a,#4ade80)'}}/>
              </div>
              {pct < 100 && (
                <Link href="/register"
                  className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-white text-[10px] font-bold"
                  style={{background:'linear-gradient(135deg,#1a6b3a,#145530)'}}>
                  <span>Continue Registration</span>
                  <ChevronRight className="w-3 h-3"/>
                </Link>
              )}
            </div>
          )}

          {/* ══ QUICK ACTIONS ════════════════════════════════════════════════ */}
          <div>
            <p className="section-label mb-2.5">QUICK ACTIONS</p>
            <div className="grid grid-cols-5 gap-2">
              {campusActions.map(({ href, label, icon:Icon, color }) => (
                <Link key={href} href={href}
                  className="card card-hover flex flex-col items-center gap-1.5 py-2.5 px-1 text-center group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
                    style={{background:color+'18'}}>
                    <Icon className="w-4 h-4" style={{color}}/>
                  </div>
                  <span className="text-[9px] font-semibold text-[#0a0a0a] leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ══ NAVIGATE ═════════════════════════════════════════════════════ */}
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
            <Link href="/navigate?to=5.478133%2C7.533195&name=Pneuma+Domain+Ministry&auto=1"
              className="relative overflow-hidden rounded-2xl flex items-center gap-2.5 px-3.5 py-3 bg-[#0a0a0a] group">
              <div className="absolute inset-0 opacity-30" style={{background:'linear-gradient(135deg,#b91c1c,#c2410c)'}}/>
              <Navigation2 className="w-4 h-4 text-white relative z-10 flex-shrink-0"/>
              <div className="relative z-10 min-w-0 text-left">
                <p className="text-white font-bold text-xs leading-tight">Pneuma Domain</p>
                <p className="text-white/50 text-[9px]">Get directions</p>
              </div>
            </Link>
          </div>

          {/* ══ GALLERY ══════════════════════════════════════════════════════ */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="section-label">PNEUMA DOMAIN GALLERY</p>
              <Link href="/library" className="text-[9px] font-bold" style={{color:'#1e3a8a'}}>Library →</Link>
            </div>
            <GallerySlideshow/>
          </div>

          {/* ══ JOIN PDM ══════════════════════════════════════════════════════ */}
          <Link href="/pdm"
            className="flex items-center gap-3.5 p-4 rounded-2xl overflow-hidden relative group hover:shadow-md transition-all"
            style={{background:'linear-gradient(135deg,#0a0a0a,#1a1a0a)'}}>
            <div className="absolute inset-0 opacity-20" style={{background:'linear-gradient(135deg,#1a6b3a,#C9A227)'}}/>
            <div className="relative w-11 h-11 bg-[#1a6b3a]/30 rounded-2xl flex items-center justify-center flex-shrink-0 border border-[#1a6b3a]/40">
              <Users className="w-5 h-5 text-[#4ade80]"/>
            </div>
            <div className="relative flex-1 min-w-0">
              <p className="text-white font-black text-sm leading-tight">Join Pneuma Domain Ministry</p>
              <p className="text-white/50 text-[10px] mt-0.5">Faith, fellowship &amp; growth for every MOUAU student</p>
            </div>
            <ChevronRight className="relative w-4 h-4 text-[#4ade80] flex-shrink-0"/>
          </Link>

          {/* ══ ANNOUNCEMENTS ════════════════════════════════════════════════ */}
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
