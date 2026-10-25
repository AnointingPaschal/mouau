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
  BookOpen, Award, Phone, Wifi,
  Gamepad2, Plus, Copy, Building2, RefreshCw,
  Wallet, Send, Eye, EyeOff, Hash, MessageSquare,
  HelpCircle, ChevronDown, MessageCircle, X, Gift,
} from 'lucide-react'

type Ann = { id:string; title:string; body:string; type:string; pinned:boolean; created_at:string }

const FAQS = [
  { q: 'How do I start my school registration?', a: 'Go to the Registration Guide page. Start from the Admission section — check your admission status on the JAMB portal, then accept and print your admission letter before moving to Development Levy.' },
  { q: 'What documents do I need for registration?', a: 'You need: JAMB result slip, O\'Level result (WAEC/NECO), birth certificate, passport photographs (white background), acceptance fee receipt, and your admission letter. Bring originals + 5 photocopies each.' },
  { q: 'Where is the ICT Centre on campus?', a: 'The ICT Centre is near the Faculty of Engineering. Use the Campus Map or Campus Places feature in this app to get directions.' },
  { q: 'How do I pay the development levy?', a: 'Visit the student portal at portal.mouau.edu.ng, generate your RRR code under Development Levy, pay at any bank or via Remita, then come back to validate on the portal.' },
  { q: 'What is the cost of school fees?', a: 'School fees vary by department and level. Visit the bursary or check your student portal after completing development levy. Contact your department for exact figures.' },
  { q: 'How do I register my courses?', a: 'After completing all payment steps, log in to the student portal and go to Course Registration. Select your courses for the semester, print your course form, and get it signed by your adviser.' },
  { q: 'Can I use the wallet to pay school fees?', a: 'The in-app wallet is currently for airtime, data, bills, and transfers. School fee payments go through the student portal (portal.mouau.edu.ng) using Remita.' },
  { q: 'Where do I get my student ID card?', a: 'After completing registration and getting your matric number, visit the ICT Centre with your registration documents and two passport photographs to collect your ID card.' },
]

function FAQItem({ faq, index }: { faq: typeof FAQS[0]; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-200 ${open ? 'border-[#1a6b3a]/30 bg-[#f0faf4]' : 'border-[#e8e8e8] bg-white'}`}>
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${open ? 'bg-[#1a6b3a] text-white' : 'bg-[#f0f0f0] text-[#aaa]'}`}>{index + 1}</span>
        <p className={`flex-1 text-xs font-bold leading-snug ${open ? 'text-[#1a6b3a]' : 'text-[#0a0a0a]'}`}>{faq.q}</p>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-[#1a6b3a]' : 'text-[#aaa]'}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0">
          <div className="ml-9 border-l-2 border-[#1a6b3a]/20 pl-3">
            <p className="text-[11px] text-[#6b6b6b] leading-relaxed">{faq.a}</p>
          </div>
        </div>
      )}
    </div>
  )
}

const CAMPUS_ACTIONS_FRESHER = [
  { href:'/register',   label:'Register', icon:ClipboardList,  color:'#d97706' },
  { href:'/cutoff',     label:'Cut-Off',  icon:Award,          color:'#1e3a8a' },
  { href:'/skills',     label:'Skills',   icon:Zap,            color:'#7c3aed' },
  { href:'/library',    label:'Library',  icon:BookOpen,       color:'#1a6b3a' },
  { href:'/forum',      label:'Ask',      icon:MessageCircle,  color:'#0891b2' },
]
const CAMPUS_ACTIONS_RETURNING = [
  { href:'/skills',     label:'Skills',   icon:Zap,            color:'#7c3aed' },
  { href:'/calculator', label:'CGPA',     icon:Calculator,     color:'#0284c7' },
  { href:'/cutoff',     label:'Cut-Off',  icon:Award,          color:'#1e3a8a' },
  { href:'/library',    label:'Library',  icon:BookOpen,       color:'#1a6b3a' },
  { href:'/forum',      label:'Ask',      icon:MessageCircle,  color:'#0891b2' },
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
  const [faqs,          setFaqs]          = useState<{q:string;a:string}[]>([])
  const [waLink,        setWaLink]        = useState('')
  const [waDismissed,   setWaDismissed]   = useState(false)
  const [giveaway,      setGiveaway]      = useState<{id:string;title:string;prize_label:string;prize_type:string;prize_amount:number;entry_count:number}|null>(null)

  const fetchWallet = async (sid: string) => {
    try {
      const r = await fetch(`/api/wallet?studentId=${sid}`)
      const d = await r.json()
      setWallet(d.wallet || null)
    } catch {}
    setWalletLoading(false)
  }

  useEffect(() => {
    // Check WhatsApp dismissal
    try { if (localStorage.getItem('wa_dismissed')) setWaDismissed(true) } catch {}
    // Fetch active giveaway
    fetch('/api/giveaway').then(r => r.json()).then(d => { if (d.giveaway) setGiveaway(d.giveaway) })
    // Fetch FAQs + WhatsApp link from app_settings
    supabase.from('app_settings').select('key,value').in('key', ['faqs', 'whatsapp_group_link']).then(({ data }) => {
      data?.forEach((row: any) => {
        if (row.key === 'faqs') { try { setFaqs(JSON.parse(row.value || '[]')) } catch {} }
        if (row.key === 'whatsapp_group_link') setWaLink(row.value || '')
      })
    })
    getAnnouncements().then(({ data }) => { if(data) setAnns(data as Ann[]) })
    if(!student?.idNumber) { setWalletLoading(false); return }

    // Registration progress — must use same key as register page
    const studentType = (!student.level || student.level === '100') ? 'new' : 'returning'
    const progressKey = `reg_progress_${student.idNumber}_${studentType}`
    const loadProgress = async () => {
      try {
        // Try Supabase first for accurate cross-device progress
        const { data: dbProgress } = await supabase
          .from('student_progress')
          .select('step_key, done')
          .eq('student_id', student.idNumber)
        if (dbProgress && dbProgress.length > 0) {
          const map: Record<string,boolean> = {}
          dbProgress.forEach((d:any) => { map[d.step_key] = d.done })
          const done = Object.values(map).filter(Boolean).length
          localStorage.setItem(progressKey, JSON.stringify(map))
          setDoneCount(done)
          supabase.from('registration_steps').select('substeps').eq('active',true).eq('student_type',studentType)
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
          return
        }
      } catch {}
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem(progressKey)
        const checked: Record<string,boolean> = raw ? JSON.parse(raw) : {}
        const done = Object.values(checked).filter(Boolean).length
        setDoneCount(done)
        supabase.from('registration_steps').select('substeps').eq('active',true).eq('student_type',studentType)
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
    }
    loadProgress()

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

          {/* ══ GIVEAWAY BANNER ══════════════════════════════════════════════ */}
          {giveaway && (
            <Link href="/giveaway"
              className="flex items-center gap-3.5 p-4 rounded-2xl overflow-hidden relative group active:scale-[0.98] transition-transform"
              style={{background:'linear-gradient(135deg,#1a3a2a 0%,#0d2818 50%,#1e1a0e 100%)'}}>
              <div className="absolute inset-0 opacity-25" style={{background:'radial-gradient(circle at 80% 50%,#f59e0b,transparent 60%)'}}/>
              <div className="relative w-11 h-11 bg-amber-400/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-amber-400/30">
                <Gift className="w-5 h-5 text-amber-400"/>
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-black text-sm leading-tight truncate">{giveaway.title}</p>
                  <span className="text-[9px] font-black bg-amber-400 text-black px-2 py-0.5 rounded-full flex-shrink-0">LIVE</span>
                </div>
                <p className="text-white/50 text-[11px] mt-0.5">
                  {giveaway.prize_type === 'wallet' ? `₦${Number(giveaway.prize_amount).toLocaleString()} prize` : giveaway.prize_label || 'Amazing prize'} · {giveaway.entry_count} entries
                </p>
              </div>
              <ChevronRight className="relative w-4 h-4 text-amber-400 flex-shrink-0"/>
            </Link>
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

          {/* ══ WHATSAPP BANNER ══════════════════════════════════════════════ */}
          {waLink && !waDismissed && (
            <div className="relative flex items-center gap-3 p-4 rounded-2xl overflow-hidden"
              style={{background:'linear-gradient(135deg,#075e54,#128c7e)'}}>
              <div className="absolute inset-0 opacity-20" style={{background:'radial-gradient(circle at 80% 50%,#25d366,transparent)'}}/>
              <div className="relative w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.117 1.535 5.845L.057 23.571a.75.75 0 0 0 .915.903l5.913-1.55A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.713 9.713 0 0 1-4.925-1.338l-.353-.209-3.655.958.975-3.563-.23-.368A9.726 9.726 0 0 1 2.25 12c0-5.376 4.374-9.75 9.75-9.75s9.75 4.374 9.75 9.75-4.374 9.75-9.75 9.75z"/></svg>
              </div>
              <div className="relative flex-1 min-w-0">
                <p className="text-white font-black text-sm leading-tight">Join Our WhatsApp Group</p>
                <p className="text-white/70 text-[11px] mt-0.5">Connect with fellow MOUAU students</p>
              </div>
              <div className="relative flex items-center gap-2">
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white rounded-xl text-[#075e54] text-xs font-black hover:bg-[#e8f5e9] transition-colors">
                  Join
                </a>
                <button onClick={() => { setWaDismissed(true); try { localStorage.setItem('wa_dismissed','1') } catch {} }}
                  className="w-7 h-7 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25 transition-colors">
                  <X className="w-3.5 h-3.5 text-white"/>
                </button>
              </div>
            </div>
          )}

          {/* ══ FAQ ══════════════════════════════════════════════════════════ */}
          {(() => { const displayFaqs = faqs.length > 0 ? faqs : FAQS; return displayFaqs.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#1a6b3a]"/>
                  <p className="section-label">FREQUENTLY ASKED</p>
                </div>
                <Link href="/forum" className="text-[9px] font-bold text-[#1a6b3a]">Ask more →</Link>
              </div>
              <div className="space-y-2">
                {displayFaqs.map((faq, i) => <FAQItem key={i} faq={faq} index={i} />)}
              </div>
            </div>
          ) : null })()}

          {/* ══ ASK ANYTHING CTA ══════════════════════════════════════════════ */}
          <Link href="/forum"
            className="flex items-center gap-3.5 p-4 rounded-2xl overflow-hidden relative group"
            style={{background:'linear-gradient(135deg,#0c1a2e,#1e3a8a)'}}>
            <div className="absolute inset-0 opacity-10" style={{background:'radial-gradient(circle at 80% 50%,#60a5fa,transparent)'}}/>
            <div className="relative w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20">
              <MessageCircle className="w-5 h-5 text-blue-300"/>
            </div>
            <div className="relative flex-1 min-w-0">
              <p className="text-white font-black text-sm leading-tight">Ask Anything</p>
              <p className="text-white/50 text-[10px] mt-0.5">Ask questions, share answers, connect with peers</p>
            </div>
            <ChevronRight className="relative w-4 h-4 text-blue-300 flex-shrink-0"/>
          </Link>

        </div>
      </div>
    </AppShell>
  )
}
