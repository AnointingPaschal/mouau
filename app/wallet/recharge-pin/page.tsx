'use client'
import WalletGuard from '@/components/WalletGuard'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { Phone, Loader2, CheckCircle2, AlertCircle, Copy } from 'lucide-react'

const NETWORKS = [
  { name: 'MTN',     color: '#ffcc00', text: '#000' },
  { name: 'GLO',     color: '#007a3d', text: '#fff' },
  { name: 'AIRTEL',  color: '#ed1c24', text: '#fff' },
  { name: '9MOBILE', color: '#006633', text: '#fff' },
]
const NET_COLORS: Record<string, string> = { mtn:'#ffcc00', glo:'#007a3d', airtel:'#ed1c24', '9mobile':'#006633' }

type Plan = { id:number; network_name:string; size:string; regular_price:number; info?:string }

export default function RechargePinPage() {
  const { student } = useAuth()
  const [network,    setNetwork]    = useState('MTN')
  const [plans,      setPlans]      = useState<Plan[]>([])
  const [selPlan,    setSelPlan]    = useState<Plan|null>(null)
  const [quantity,   setQuantity]   = useState(1)
  const [loading,    setLoading]    = useState(false)
  const [loadPlans,  setLoadPlans]  = useState(false)
  const [balance,    setBalance]    = useState(0)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')
  const [pins,       setPins]       = useState<string[]>([])
  const [copied,     setCopied]     = useState<string|null>(null)

  useEffect(() => {
    if (!student?.idNumber) return
    fetch(`/api/wallet?studentId=${student.idNumber}`)
      .then(r=>r.json()).then(d=>setBalance(parseFloat(d.wallet?.balance||0)))
  }, [student?.idNumber])

  useEffect(() => {
    setLoadPlans(true); setSelPlan(null); setPlans([])
    fetch('/api/admin/bigisub/recharge-pins')
      .then(r=>r.json())
      .then(d => { setPlans(Array.isArray(d.plans) ? d.plans : []); setLoadPlans(false) })
      .catch(()=>setLoadPlans(false))
  }, [])

  const netPlans = plans.filter(p => (p.network_name||'').toLowerCase().replace(' ','') === network.toLowerCase())
  const totalCost = selPlan ? selPlan.regular_price * quantity : 0

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin).then(()=>{ setCopied(pin); setTimeout(()=>setCopied(null),2000) })
  }

  const submit = async () => {
    if (!student || !selPlan) return
    setLoading(true); setError(''); setSuccess(''); setPins([])
    try {
      const r = await fetch('/api/wallet/recharge-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.idNumber,
          planId:    selPlan.id,
          quantity,
          amount:    totalCost,
          planLabel: `${network} ₦${selPlan.size} Recharge Pin`,
        }),
      })
      const d = await r.json()
      if (d.error) setError(d.error)
      else {
        setSuccess(d.message)
        if (d.pins?.length) setPins(d.pins)
        setSelPlan(null); setQuantity(1)
        fetch(`/api/wallet?studentId=${student.idNumber}`).then(r=>r.json()).then(d=>setBalance(parseFloat(d.wallet?.balance||0)))
      }
    } catch { setError('Network error. Please try again.') }
    setLoading(false)
  }

  const net = NETWORKS.find(n=>n.name===network)!

  return (
    <WalletGuard>
      <AppShell>
        <TopBar title="Recharge Pin" />
        <main className="pb-28 pt-4 px-4 max-w-lg mx-auto space-y-4">

          {/* Balance */}
          <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg,#1e3a8a,#1a6b3a)' }}>
            <span className="text-white/70 text-xs">Wallet Balance</span>
            <span className="text-white font-black text-base">₦{balance.toLocaleString('en-NG',{minimumFractionDigits:2})}</span>
          </div>

          {success && (
            <div className="rounded-2xl p-4 bg-green-50 border border-green-200 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#1a6b3a] mt-0.5 flex-shrink-0"/>
                <p className="text-sm text-[#1a6b3a] font-semibold">{success}</p>
              </div>
              {pins.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#555] mb-2 pl-8">Your Recharge Pin{pins.length>1?'s':''}:</p>
                  <div className="space-y-2 pl-8">
                    {pins.map((pin,i) => (
                      <div key={i} className="flex items-center justify-between bg-green-100 rounded-xl px-3 py-2">
                        <span className="font-mono text-sm font-black text-[#1a6b3a] tracking-widest">{pin}</span>
                        <button onClick={()=>copyPin(pin)} className="text-[#1a6b3a] p-1">
                          {copied===pin ? <CheckCircle2 className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {error && (
            <div className="rounded-2xl p-4 bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#b91c1c] mt-0.5 flex-shrink-0"/>
              <p className="text-sm text-[#b91c1c]">{error}</p>
            </div>
          )}

          <div className="card p-5 space-y-5">
            {/* Network */}
            <div>
              <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2.5 block">Network</label>
              <div className="grid grid-cols-4 gap-2">
                {NETWORKS.map(n=>(
                  <button key={n.name} onClick={()=>{ setNetwork(n.name); setSelPlan(null) }}
                    className="py-3 rounded-2xl text-xs font-black border-2 transition-all active:scale-95"
                    style={{
                      borderColor:     n.color,
                      backgroundColor: network===n.name ? n.color : 'transparent',
                      color:           network===n.name ? n.text : n.color,
                    }}>
                    {n.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Plans */}
            <div>
              <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2.5 block">Select Denomination</label>
              {loadPlans ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="w-5 h-5 animate-spin" style={{color:net.color}}/>
                  <span className="text-xs text-[#aaa]">Loading plans...</span>
                </div>
              ) : netPlans.length === 0 ? (
                <p className="text-xs text-[#aaa] py-4 text-center">No pins available for {network}</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {netPlans.map(plan=>{
                    const sel = selPlan?.id===plan.id
                    return (
                      <button key={plan.id} onClick={()=>setSelPlan(plan)}
                        className="p-3 rounded-2xl border-2 text-center transition-all active:scale-95"
                        style={{
                          borderColor:     sel ? net.color : '#f0f0f0',
                          backgroundColor: sel ? net.color+'15' : '#fafafa',
                        }}>
                        <p className="text-sm font-black" style={{color: sel ? net.color : '#1e3a8a'}}>₦{plan.size}</p>
                        <p className="text-[10px] text-[#888] mt-0.5">₦{plan.regular_price}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quantity */}
            {selPlan && (
              <div>
                <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2 block">Quantity</label>
                <div className="flex items-center gap-4">
                  <button onClick={()=>setQuantity(q=>Math.max(1,q-1))}
                    className="w-10 h-10 rounded-xl border-2 border-[#e0e0e0] text-xl font-black text-[#555] flex items-center justify-center active:scale-95">−</button>
                  <span className="text-xl font-black text-[#0a0a0a] min-w-[2ch] text-center">{quantity}</span>
                  <button onClick={()=>setQuantity(q=>Math.min(10,q+1))}
                    className="w-10 h-10 rounded-xl text-xl font-black text-white flex items-center justify-center active:scale-95"
                    style={{backgroundColor: net.color, color: net.text}}>+</button>
                  <span className="text-xs text-[#aaa] ml-2">max 10</span>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          {selPlan && (
            <div className="card p-4 border-2" style={{borderColor: net.color+'40'}}>
              <p className="text-xs text-[#888] mb-2 font-semibold">Order Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-[#555]">Pin</span>
                <span className="font-bold">{network} ₦{selPlan.size} Recharge Pin</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-[#555]">Quantity</span>
                <span className="font-bold">{quantity}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-[#555]">Total</span>
                <span className="font-black" style={{color: net.color}}>₦{totalCost.toLocaleString('en-NG',{minimumFractionDigits:2})}</span>
              </div>
            </div>
          )}

          <button onClick={submit}
            disabled={loading || !selPlan || totalCost > balance}
            className="w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]"
            style={{backgroundColor: net.color, color: net.text}}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Phone className="w-5 h-5"/>}
            {loading ? 'Processing...' : selPlan ? `Buy ${quantity} × ₦${selPlan.size} Pin${quantity>1?'s':''}` : 'Select a Denomination'}
          </button>

          <p className="text-center text-[10px] text-[#aaa]">Powered by Bigisub · Pins delivered instantly</p>
        </main>
      </AppShell>
    </WalletGuard>
  )
}
