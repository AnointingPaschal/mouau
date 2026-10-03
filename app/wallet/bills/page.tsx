'use client'
import WalletGuard from '@/components/WalletGuard'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { Zap, Tv, Gamepad2, Loader2, CheckCircle2, ChevronRight } from 'lucide-react'

const BILL_TYPES = [
  { id:'betting',     label:'Betting',     icon:Gamepad2, color:'#059669', desc:'Bet9ja, Sportybet, 1xBet etc.' },
  { id:'electricity', label:'Electricity', icon:Zap,      color:'#d97706', desc:'AEDC, EKEDC, IBEDC etc.' },
  { id:'cable',       label:'Cable TV',    icon:Tv,       color:'#7c3aed', desc:'DSTV, GOtv, Startimes' },
]

type BillType = typeof BILL_TYPES[0]

const BETTING_BILLERS = ['BET9JA', 'SPORTYBET', '1XBET', 'BETKING', 'PARIMATCH', 'NAIRABET', 'BANGBET']
const ELECTRICITY_BILLERS = ['AEDC', 'EKEDC', 'IBEDC', 'KEDCO', 'PHCN', 'PHED', 'EEDC']
const CABLE_BILLERS = ['DSTV', 'GOTV', 'STARTIMES']

const BILLER_MAP: Record<string, string[]> = {
  betting:     BETTING_BILLERS,
  electricity: ELECTRICITY_BILLERS,
  cable:       CABLE_BILLERS,
}

export default function BillsPage() {
  const { student } = useAuth()
  const [selectedType, setSelectedType] = useState<BillType|null>(null)
  const [biller,       setBiller]       = useState('')
  const [customer,     setCustomer]     = useState('')
  const [amount,       setAmount]       = useState('')
  const [balance,      setBalance]      = useState(0)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')

  useEffect(() => {
    if (!student?.idNumber) return
    fetch(`/api/wallet?studentId=${student.idNumber}`)
      .then(r=>r.json()).then(d=>setBalance(parseFloat(d.wallet?.balance||0)))
  }, [student?.idNumber])

  const submit = async () => {
    if (!student || !selectedType || !customer || !amount) return
    setLoading(true); setError(''); setSuccess('')
    const r = await fetch('/api/wallet/bills', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        studentId:  student.idNumber,
        category:   selectedType.id,
        customer,
        amount:     parseFloat(amount),
        billerName: biller || undefined,
        narration:  `${biller || selectedType.label} – ${customer}`,
      }),
    })
    const d = await r.json()
    setLoading(false)
    if (d.error) setError(d.error)
    else { setSuccess(d.message); setCustomer(''); setAmount(''); setBiller('') }
  }

  return (<WalletGuard>
    <AppShell>
      <TopBar title="Bill Payments" />
      <main className="pb-28 pt-4 px-4 max-w-lg mx-auto space-y-4">
        <div className="card p-4 flex items-center justify-between">
          <span className="text-sm text-[#888]">Wallet Balance</span>
          <span className="font-bold text-[#1e3a8a]">₦{balance.toLocaleString('en-NG',{minimumFractionDigits:2})}</span>
        </div>

        {success && (
          <div className="rounded-xl p-4 bg-green-50 border border-green-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#1a6b3a]"/>
            <p className="text-sm text-[#1a6b3a] font-semibold">{success}</p>
          </div>
        )}
        {error && <div className="rounded-xl p-4 bg-red-50 border border-red-200"><p className="text-sm text-[#b91c1c]">{error}</p></div>}

        {/* Bill type selector */}
        <div className="card p-4">
          <p className="text-xs font-bold text-[#888] uppercase tracking-wide mb-3">Select Bill Type</p>
          <div className="space-y-2">
            {BILL_TYPES.map(bt => (
              <button key={bt.id} onClick={() => { setSelectedType(bt); setBiller(''); setCustomer(''); setAmount('') }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selectedType?.id===bt.id?'border-[#1e3a8a] bg-[#1e3a8a]/5':'border-[#f0f0f0]'}`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{backgroundColor:bt.color+'20'}}>
                  <bt.icon className="w-4.5 h-4.5" style={{color:bt.color}}/>
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-[#0a0a0a]">{bt.label}</p>
                  <p className="text-[10px] text-[#aaa]">{bt.desc}</p>
                </div>
                {selectedType?.id===bt.id && <ChevronRight className="w-4 h-4 text-[#1e3a8a]"/>}
              </button>
            ))}
          </div>
        </div>

        {selectedType && (
          <div className="card p-4 space-y-4">
            {/* Biller */}
            <div>
              <label className="text-xs font-semibold text-[#333] mb-1 block">
                {selectedType.id === 'betting' ? 'Betting Platform' : selectedType.id === 'electricity' ? 'Disco / Provider' : 'Cable Provider'}
              </label>
              <div className="flex flex-wrap gap-2">
                {BILLER_MAP[selectedType.id].map(b => (
                  <button key={b} onClick={() => setBiller(b)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${biller===b?'text-white border-transparent':'bg-[#f5f5f5] border-transparent text-[#333]'}`}
                    style={biller===b?{backgroundColor:selectedType.color}:{}}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer ID */}
            <div>
              <label className="text-xs font-semibold text-[#333] mb-1 block">
                {selectedType.id === 'betting' ? 'User ID / Account Number' :
                 selectedType.id === 'electricity' ? 'Meter Number' : 'Smart Card Number'}
              </label>
              <input value={customer} onChange={e=>setCustomer(e.target.value)}
                placeholder={selectedType.id==='electricity' ? 'Enter meter number' : selectedType.id==='cable' ? 'Enter smart card number' : 'Enter account/user ID'}
                className="input w-full text-sm font-mono"/>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-[#333] mb-1 block">Amount (₦)</label>
              <input value={amount} onChange={e=>setAmount(e.target.value.replace(/\D/,''))}
                placeholder="Enter amount" className="input w-full text-sm" type="number" min="100"/>
            </div>
          </div>
        )}

        {selectedType && (
          <button onClick={submit} disabled={loading || !customer || !amount}
            className="w-full py-3.5 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: selectedType.color }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <selectedType.icon className="w-4 h-4"/>}
            Pay ₦{parseFloat(amount||'0').toLocaleString()} — {biller || selectedType.label}
          </button>
        )}
      </main>
    </AppShell>
  </WalletGuard>
  )
}
