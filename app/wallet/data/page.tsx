'use client'
import WalletGuard from '@/components/WalletGuard'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { Wifi, Loader2, CheckCircle2 } from 'lucide-react'

const NETWORKS = [
  { name:'MTN',     color:'#ffcc00', bg:'#fffbeb' },
  { name:'GLO',     color:'#007a3d', bg:'#f0fdf4' },
  { name:'AIRTEL',  color:'#ed1c24', bg:'#fef2f2' },
  { name:'9MOBILE', color:'#006633', bg:'#f0fdf4' },
]

type Plan = { name: string; amount: number; id: number; item_code: string; biller_code: string }

export default function DataPage() {
  const { student } = useAuth()
  const [network,       setNetwork]      = useState('MTN')
  const [phone,         setPhone]        = useState('')
  const [plans,         setPlans]        = useState<Plan[]>([])
  const [selectedPlan,  setSelectedPlan] = useState<Plan|null>(null)
  const [loadingPlans,  setLoadingPlans] = useState(false)
  const [balance,       setBalance]      = useState(0)
  const [loading,       setLoading]      = useState(false)
  const [error,         setError]        = useState('')
  const [success,       setSuccess]      = useState('')

  useEffect(() => {
    if (!student?.idNumber) return
    fetch(`/api/wallet?studentId=${student.idNumber}`)
      .then(r=>r.json()).then(d=>setBalance(parseFloat(d.wallet?.balance||0)))
  }, [student?.idNumber])

  useEffect(() => {
    setLoadingPlans(true); setSelectedPlan(null); setPlans([])
    fetch(`/api/admin/flutterwave/data-plans?network=${network}`)
      .then(r=>r.json())
      .then(d=>{ setPlans(d.plans||[]); setLoadingPlans(false) })
      .catch(()=>setLoadingPlans(false))
  }, [network])

  const submit = async () => {
    if (!student || !phone || !selectedPlan) return
    setLoading(true); setError(''); setSuccess('')
    const r = await fetch('/api/wallet/data', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        studentId: student.idNumber,
        phone, amount: selectedPlan.amount, network,
        planId:   selectedPlan.item_code,
        planName: selectedPlan.name,
      }),
    })
    const d = await r.json()
    setLoading(false)
    if (d.error) setError(d.error)
    else { setSuccess(d.message); setPhone(''); setSelectedPlan(null) }
  }

  const net = NETWORKS.find(n=>n.name===network)!

  return (<WalletGuard>
    <AppShell>
      <TopBar title="Buy Data" />
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

        <div className="card p-4 space-y-4">
          {/* Network */}
          <div>
            <label className="text-xs font-semibold text-[#333] mb-2 block">Network</label>
            <div className="grid grid-cols-4 gap-2">
              {NETWORKS.map(n => (
                <button key={n.name} onClick={() => setNetwork(n.name)}
                  className="py-2.5 rounded-xl text-xs font-bold border-2 transition-all"
                  style={{
                    borderColor: n.color,
                    backgroundColor: network===n.name ? n.color : n.bg,
                    color: network===n.name ? (n.name==='MTN'?'#000':'#fff') : n.color,
                  }}>
                  {n.name}
                </button>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-semibold text-[#333] mb-1 block">Phone Number</label>
            <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/,'').slice(0,11))}
              placeholder="08012345678" className="input w-full text-sm font-mono" maxLength={11}/>
          </div>

          {/* Plans */}
          <div>
            <label className="text-xs font-semibold text-[#333] mb-2 block">Select Plan</label>
            {loadingPlans ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-[#aaa]"/></div>
            ) : plans.length === 0 ? (
              <p className="text-xs text-[#aaa] text-center py-4">No plans available for {network}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {plans.map(plan => (
                  <button key={plan.id} onClick={() => setSelectedPlan(plan)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${selectedPlan?.id===plan.id?'border-[#1e3a8a] bg-[#1e3a8a]/5':'border-[#f0f0f0] bg-[#fafafa]'}`}>
                    <p className="text-xs font-semibold text-[#0a0a0a] leading-tight">{plan.name}</p>
                    <p className="text-sm font-bold mt-0.5" style={{color:net.color}}>₦{plan.amount?.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button onClick={submit} disabled={loading || !phone || !selectedPlan}
          className="w-full py-3.5 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: net.color, color: network==='MTN'?'#000':'#fff' }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wifi className="w-4 h-4"/>}
          Buy {selectedPlan?.name || 'Data Plan'}
        </button>
      </main>
    </AppShell>
  </WalletGuard>
  )
}
