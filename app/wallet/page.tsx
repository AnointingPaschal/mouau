'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Phone, Wifi,
  Gamepad2, Plus, RefreshCw, Loader2, ChevronRight, Copy, CheckCircle2
} from 'lucide-react'

type Wallet = { balance: number; account_number: string | null; bank_name: string | null; account_name: string | null }
type Txn = {
  id: string; type: 'credit'|'debit'; category: string; amount: number; fee: number;
  status: string; narration: string; created_at: string
}

const CATEGORY_ICONS: Record<string,any> = {
  deposit:     ArrowDownLeft,
  transfer:    ArrowUpRight,
  airtime:     Phone,
  data:        Wifi,
  betting:     Gamepad2,
  electricity: Wallet,
  cable:       Wallet,
  other:       Wallet,
}

const QUICK_ACTIONS = [
  { href:'/wallet/fund',     label:'Fund',     icon:Plus,        color:'#1a6b3a' },
  { href:'/wallet/transfer', label:'Transfer', icon:ArrowUpRight, color:'#1e3a8a' },
  { href:'/wallet/airtime',  label:'Airtime',  icon:Phone,       color:'#c2410c' },
  { href:'/wallet/data',     label:'Data',     icon:Wifi,        color:'#7c3aed' },
  { href:'/wallet/bills',    label:'Bills',    icon:Gamepad2,    color:'#d97706' },
]

function fmt(n: number) { return `₦${n.toLocaleString('en-NG', { minimumFractionDigits:2, maximumFractionDigits:2 })}` }
function fmtDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-NG', { day:'numeric', month:'short' }) + ' · ' +
         dt.toLocaleTimeString('en-NG', { hour:'2-digit', minute:'2-digit' })
}

export default function WalletPage() {
  const { student } = useAuth()
  const [wallet,      setWallet]      = useState<Wallet|null>(null)
  const [txns,        setTxns]        = useState<Txn[]>([])
  const [loading,     setLoading]     = useState(true)
  const [creating,    setCreating]    = useState(false)
  const [copied,      setCopied]      = useState(false)
  const [error,       setError]       = useState('')

  const load = async (sid: string) => {
    setLoading(true)
    try {
      const [wRes, tRes] = await Promise.all([
        fetch(`/api/wallet?studentId=${sid}`),
        fetch(`/api/wallet/transactions?studentId=${sid}&limit=15`),
      ])
      const wData = await wRes.json()
      const tData = await tRes.json()
      setWallet(wData.wallet)
      setTxns(tData.transactions || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (student?.idNumber) load(student.idNumber)
    else setLoading(false)
  }, [student?.idNumber])

  const createVirtualAccount = async () => {
    if (!student) return
    setCreating(true); setError('')
    const r = await fetch('/api/wallet/create-virtual-account', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        studentId:   student.idNumber,
        email:       student.email || `${student.idNumber}@mouau.edu.ng`,
        studentName: student.name,
      }),
    })
    const d = await r.json()
    setCreating(false)
    if (d.error) setError(d.error)
    else if (student?.idNumber) { setWallet(d.wallet); load(student.idNumber) }
  }

  const copyAcct = () => {
    if (wallet?.account_number) {
      navigator.clipboard.writeText(wallet.account_number)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }
  }

  const balance = wallet?.balance ?? 0

  return (
    <AppShell>
      <TopBar title="My Wallet" />
      <main className="pb-28 pt-4 px-4 max-w-lg mx-auto space-y-4">

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#aaa]"/></div>
        ) : (
          <>
            {/* Balance card */}
            <div className="rounded-2xl p-5 text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1a6b3a 100%)' }}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-2 right-4 w-32 h-32 rounded-full border-2 border-white"/>
                <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full border-2 border-white"/>
              </div>
              <p className="text-white/70 text-xs uppercase tracking-wide">Available Balance</p>
              <p className="text-3xl font-bold mt-1">{fmt(balance)}</p>
              <p className="text-white/60 text-xs mt-0.5">{student?.name}</p>
              <button onClick={() => student?.idNumber && load(student.idNumber)} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20">
                <RefreshCw className="w-3.5 h-3.5 text-white"/>
              </button>
            </div>

            {/* Virtual account */}
            {wallet?.account_number ? (
              <div className="card p-4">
                <p className="text-[10px] font-bold text-[#888] uppercase tracking-wide mb-3">Fund Wallet — Bank Transfer</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#888]">Account Number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm font-mono text-[#0a0a0a]">{wallet.account_number}</span>
                      <button onClick={copyAcct} className="p-1 rounded-lg bg-[#f5f5f5]">
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/> : <Copy className="w-3.5 h-3.5 text-[#888]"/>}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#888]">Bank Name</span>
                    <span className="text-sm font-semibold text-[#0a0a0a]">{wallet.bank_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#888]">Account Name</span>
                    <span className="text-sm font-semibold text-[#0a0a0a]">{wallet.account_name}</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#aaa] mt-3">Transfer any amount to this account to fund your wallet instantly.</p>
              </div>
            ) : (
              <div className="card p-4 text-center">
                <Wallet className="w-8 h-8 text-[#aaa] mx-auto mb-2"/>
                <p className="text-sm font-semibold text-[#333] mb-1">No wallet yet</p>
                <p className="text-xs text-[#aaa] mb-3">Create a dedicated bank account to receive money into your wallet.</p>
                {error && <p className="text-xs text-[#b91c1c] mb-2">{error}</p>}
                <button onClick={createVirtualAccount} disabled={creating}
                  className="px-4 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>}
                  Create Wallet
                </button>
              </div>
            )}

            {/* Quick actions */}
            <div className="card p-4">
              <p className="text-xs font-bold text-[#888] uppercase tracking-wide mb-3">Quick Actions</p>
              <div className="grid grid-cols-5 gap-2">
                {QUICK_ACTIONS.map(({ href, label, icon:Icon, color }) => (
                  <Link key={href} href={href}
                    className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: color + '15' }}>
                      <Icon className="w-5 h-5" style={{ color }}/>
                    </div>
                    <span className="text-[10px] font-semibold text-[#555] text-center">{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Transactions */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
                <p className="text-xs font-bold text-[#888] uppercase tracking-wide">Recent Transactions</p>
              </div>
              {txns.length === 0 ? (
                <div className="text-center py-8 text-[#aaa]">
                  <p className="text-sm">No transactions yet</p>
                </div>
              ) : (
                txns.map((txn, i) => {
                  const Icon = CATEGORY_ICONS[txn.category] || Wallet
                  const isCredit = txn.type === 'credit'
                  return (
                    <div key={txn.id}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{ borderBottom: i < txns.length-1 ? '1px solid #f7f7f7' : undefined }}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isCredit?'bg-green-100':'bg-red-50'}`}>
                        <Icon className={`w-4 h-4 ${isCredit?'text-[#1a6b3a]':'text-[#b91c1c]'}`}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0a0a0a] truncate">{txn.narration}</p>
                        <p className="text-[10px] text-[#aaa]">{fmtDate(txn.created_at)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${isCredit?'text-[#1a6b3a]':'text-[#b91c1c]'}`}>
                          {isCredit?'+':'-'}{fmt(txn.amount)}
                        </p>
                        <p className={`text-[9px] capitalize ${txn.status==='success'?'text-[#1a6b3a]':txn.status==='pending'?'text-amber-500':'text-[#b91c1c]'}`}>
                          {txn.status}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </main>
    </AppShell>
  )
}
