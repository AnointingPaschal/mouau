'use client'
import WalletGuard from '@/components/WalletGuard'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { Phone, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

const NETWORKS = [
  { name: 'MTN',     color: '#ffcc00', textColor: '#000', bg: '#fffbeb' },
  { name: 'GLO',     color: '#007a3d', textColor: '#fff', bg: '#f0fdf4' },
  { name: 'AIRTEL',  color: '#ed1c24', textColor: '#fff', bg: '#fef2f2' },
  { name: '9MOBILE', color: '#006633', textColor: '#fff', bg: '#f0fdf4' },
]
const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000]

export default function AirtimePage() {
  const { student } = useAuth()
  const [network,  setNetwork]  = useState('MTN')
  const [phone,    setPhone]    = useState('')
  const [amount,   setAmount]   = useState('')
  const [balance,  setBalance]  = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  const net = NETWORKS.find(n => n.name === network)!

  useEffect(() => {
    if (!student?.idNumber) return
    fetch(`/api/wallet?studentId=${student.idNumber}`)
      .then(r => r.json())
      .then(d => setBalance(parseFloat(d.wallet?.balance || 0)))
  }, [student?.idNumber])

  const handlePhone = (v: string) => setPhone(v.replace(/\D/g, '').slice(0, 11))

  const submit = async () => {
    if (!student || !phone || !amount) return
    if (phone.length < 11) { setError('Enter a valid 11-digit phone number'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      const r = await fetch('/api/wallet/airtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.idNumber, phone, amount: parseFloat(amount), network }),
      })
      const d = await r.json()
      if (d.error) setError(d.error)
      else {
        setSuccess(d.message)
        setAmount('')
        setPhone('')
        // Refresh balance
        fetch(`/api/wallet?studentId=${student.idNumber}`).then(r=>r.json()).then(d=>setBalance(parseFloat(d.wallet?.balance||0)))
      }
    } catch { setError('Network error. Please try again.') }
    setLoading(false)
  }

  return (
    <WalletGuard>
      <AppShell>
        <TopBar title="Buy Airtime" />
        <main className="pb-28 pt-4 px-4 max-w-lg mx-auto space-y-4">

          {/* Balance strip */}
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
                onChange={e => handlePhone(e.target.value)}
                placeholder="08012345678"
                inputMode="numeric"
                className="input w-full text-base font-mono tracking-wider"
                maxLength={11}
              />
              {phone.length > 0 && phone.length < 11 && (
                <p className="text-[10px] text-amber-600 mt-1">{11 - phone.length} more digits needed</p>
              )}
            </div>

            {/* Quick amounts */}
            <div>
              <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2.5 block">Amount (₦)</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {QUICK_AMOUNTS.map(a => (
                  <button key={a} onClick={() => setAmount(a.toString())}
                    className="py-2.5 rounded-xl text-sm font-bold border-2 transition-all active:scale-95"
                    style={{
                      borderColor:     amount === a.toString() ? net.color : '#f0f0f0',
                      backgroundColor: amount === a.toString() ? net.color : '#fafafa',
                      color:           amount === a.toString() ? net.textColor : '#333',
                    }}>
                    ₦{a}
                  </button>
                ))}
              </div>
              <input
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="Or enter custom amount"
                className="input w-full text-sm"
                type="number"
                min="50"
              />
            </div>
          </div>

          {/* Summary */}
          {amount && phone.length === 11 && (
            <div className="card p-4 border-2" style={{ borderColor: net.color + '40' }}>
              <p className="text-xs text-[#888] mb-2 font-semibold">Order Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-[#555]">Network</span>
                <span className="font-bold" style={{ color: net.color }}>{network}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-[#555]">Phone</span>
                <span className="font-bold font-mono text-[#0a0a0a]">{phone}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-[#555]">Amount</span>
                <span className="font-black text-[#0a0a0a]">₦{parseFloat(amount).toLocaleString()}</span>
              </div>
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading || !phone || phone.length < 11 || !amount || parseFloat(amount) < 50}
            className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]"
            style={{ backgroundColor: net.color, color: net.textColor }}>
            {loading
              ? <Loader2 className="w-5 h-5 animate-spin"/>
              : <Phone className="w-5 h-5"/>}
            {loading ? 'Processing...' : `Buy ₦${amount || '0'} ${network} Airtime`}
          </button>

          <p className="text-center text-[10px] text-[#aaa]">Powered by Bigisub · Instant delivery</p>
        </main>
      </AppShell>
    </WalletGuard>
  )
}
