'use client'
import WalletGuard from '@/components/WalletGuard'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { Wifi, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

const NETWORKS = [
  { name: 'MTN',     color: '#ffcc00', textColor: '#000', bg: '#fffbeb' },
  { name: 'GLO',     color: '#007a3d', textColor: '#fff', bg: '#f0fdf4' },
  { name: 'AIRTEL',  color: '#ed1c24', textColor: '#fff', bg: '#fef2f2' },
  { name: '9MOBILE', color: '#006633', textColor: '#fff', bg: '#f0fdf4' },
]

// Plan type from Bigisub /api/databundles/
type Plan = {
  id: number
  network: number
  name: string
  data_type?: string
  month_validate?: string
  validity?: string
  price?: number
  plan_amount?: number
  plan?: string
}

export default function DataPage() {
  const { student } = useAuth()
  const [network,      setNetwork]      = useState('MTN')
  const [phone,        setPhone]        = useState('')
  const [plans,        setPlans]        = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [plansError,   setPlansError]   = useState('')
  const [balance,      setBalance]      = useState(0)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')
  const [planFilter,   setPlanFilter]   = useState('ALL')

  const net = NETWORKS.find(n => n.name === network)!

  useEffect(() => {
    if (!student?.idNumber) return
    fetch(`/api/wallet?studentId=${student.idNumber}`)
      .then(r => r.json()).then(d => setBalance(parseFloat(d.wallet?.balance || 0)))
  }, [student?.idNumber])

  useEffect(() => {
    setLoadingPlans(true); setSelectedPlan(null); setPlans([]); setPlansError('')
    fetch(`/api/admin/bigisub/data-plans?network=${network}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setPlansError(d.error)
        else setPlans(Array.isArray(d.plans) ? d.plans : [])
        setLoadingPlans(false)
      })
      .catch(() => { setPlansError('Could not load plans'); setLoadingPlans(false) })
  }, [network])

  // Plan types for filter tabs
  const planTypes = ['ALL', ...Array.from(new Set(plans.map(p => p.data_type || p.plan || 'Other').filter(Boolean)))]

  const filteredPlans = planFilter === 'ALL'
    ? plans
    : plans.filter(p => (p.data_type || p.plan || 'Other') === planFilter)

  const getPrice = (p: Plan) => p.price ?? p.plan_amount ?? 0
  const getValidity = (p: Plan) => p.month_validate || p.validity || ''

  const submit = async () => {
    if (!student || !phone || !selectedPlan) return
    if (phone.length < 11) { setError('Enter a valid 11-digit phone number'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      const r = await fetch('/api/wallet/data', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.idNumber,
          phone,
          amount:    getPrice(selectedPlan),
          network,
          planId:    selectedPlan.id,
          planName:  selectedPlan.name,
        }),
      })
      const d = await r.json()
      if (d.error) setError(d.error)
      else {
        setSuccess(d.message)
        setPhone('')
        setSelectedPlan(null)
        fetch(`/api/wallet?studentId=${student.idNumber}`).then(r=>r.json()).then(d=>setBalance(parseFloat(d.wallet?.balance||0)))
      }
    } catch { setError('Network error. Please try again.') }
    setLoading(false)
  }

  return (
    <WalletGuard>
      <AppShell>
        <TopBar title="Buy Data" />
        <main className="pb-28 pt-4 px-4 max-w-lg mx-auto space-y-4">

          {/* Balance */}
          <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg,#1e3a8a,#1a6b3a)' }}>
            <span className="text-white/70 text-xs">Wallet Balance</span>
            <span className="text-white font-black text-base">₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
          </div>

          {success && (
            <div className="rounded-2xl p-4 bg-green-50 border border-green-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#1a6b3a] mt-0.5 flex-shrink-0"/>
              <p className="text-sm text-[#1a6b3a] font-semibold">{success}</p>
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
                {NETWORKS.map(n => (
                  <button key={n.name} onClick={() => setNetwork(n.name)}
                    className="py-3 rounded-2xl text-xs font-black border-2 transition-all active:scale-95"
                    style={{
                      borderColor:     n.color,
                      backgroundColor: network === n.name ? n.color : 'transparent',
                      color:           network === n.name ? n.textColor : n.color,
                    }}>
                    {n.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-1.5 block">Phone Number</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="08012345678"
                inputMode="numeric"
                className="input w-full text-base font-mono tracking-wider"
                maxLength={11}
              />
            </div>

            {/* Plans */}
            <div>
              <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2.5 block">Select Plan</label>

              {/* Plan type filter */}
              {!loadingPlans && plans.length > 0 && planTypes.length > 2 && (
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 -mx-1 px-1 hide-scrollbar">
                  {planTypes.map(t => (
                    <button key={t} onClick={() => setPlanFilter(t)}
                      className="flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold border transition-all"
                      style={{
                        borderColor:     planFilter === t ? net.color : '#e0e0e0',
                        backgroundColor: planFilter === t ? net.color : 'white',
                        color:           planFilter === t ? net.textColor : '#666',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {loadingPlans ? (
                <div className="flex flex-col items-center py-8 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: net.color }}/>
                  <p className="text-xs text-[#aaa]">Loading {network} plans...</p>
                </div>
              ) : plansError ? (
                <div className="text-center py-6">
                  <p className="text-sm text-[#b91c1c] mb-1">{plansError}</p>
                  <p className="text-[10px] text-[#aaa]">Check your Bigisub API key in Admin → Bigisub Settings</p>
                </div>
              ) : filteredPlans.length === 0 ? (
                <p className="text-xs text-[#aaa] text-center py-4">No plans available for {network}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-0.5">
                  {filteredPlans.map(plan => {
                    const price    = getPrice(plan)
                    const validity = getValidity(plan)
                    const selected = selectedPlan?.id === plan.id
                    return (
                      <button key={plan.id} onClick={() => setSelectedPlan(plan)}
                        className="p-3 rounded-2xl border-2 text-left transition-all active:scale-95"
                        style={{
                          borderColor:     selected ? net.color : '#f0f0f0',
                          backgroundColor: selected ? net.color + '10' : '#fafafa',
                        }}>
                        <p className="text-xs font-bold text-[#0a0a0a] leading-tight line-clamp-2">{plan.name}</p>
                        {validity && <p className="text-[9px] text-[#aaa] mt-0.5">{validity}</p>}
                        <p className="text-sm font-black mt-1" style={{ color: selected ? net.color : '#1e3a8a' }}>
                          ₦{price.toLocaleString()}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {selectedPlan && phone.length === 11 && (
            <div className="card p-4 border-2" style={{ borderColor: net.color + '40' }}>
              <p className="text-xs text-[#888] mb-2 font-semibold">Order Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-[#555]">Plan</span>
                <span className="font-bold text-[#0a0a0a] text-right max-w-[60%] text-xs">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-[#555]">Phone</span>
                <span className="font-bold font-mono text-[#0a0a0a]">{phone}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-[#555]">Amount</span>
                <span className="font-black text-[#0a0a0a]">₦{getPrice(selectedPlan).toLocaleString()}</span>
              </div>
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading || !phone || phone.length < 11 || !selectedPlan}
            className="w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]"
            style={{ backgroundColor: net.color, color: net.textColor }}>
            {loading
              ? <Loader2 className="w-5 h-5 animate-spin"/>
              : <Wifi className="w-5 h-5"/>}
            {loading ? 'Processing...' : selectedPlan ? `Buy ${selectedPlan.name}` : 'Select a Plan'}
          </button>

          <p className="text-center text-[10px] text-[#aaa]">Powered by Bigisub · Instant delivery</p>
        </main>
      </AppShell>
    </WalletGuard>
  )
}
