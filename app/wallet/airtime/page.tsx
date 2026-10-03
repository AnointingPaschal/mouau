'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { Phone, Loader2, CheckCircle2 } from 'lucide-react'

const NETWORKS = [
  { name:'MTN',     color:'#ffcc00', bg:'#fffbeb' },
  { name:'GLO',     color:'#007a3d', bg:'#f0fdf4' },
  { name:'AIRTEL',  color:'#ed1c24', bg:'#fef2f2' },
  { name:'9MOBILE', color:'#006633', bg:'#f0fdf4' },
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

  useEffect(() => {
    if (!student?.idNumber) return
    fetch(`/api/wallet?studentId=${student.idNumber}`)
      .then(r => r.json())
      .then(d => setBalance(parseFloat(d.wallet?.balance || 0)))
  }, [student?.idNumber])

  const submit = async () => {
    if (!student || !phone || !amount) return
    setLoading(true); setError(''); setSuccess('')
    const r = await fetch('/api/wallet/airtime', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ studentId: student.idNumber, phone, amount: parseFloat(amount), network }),
    })
    const d = await r.json()
    setLoading(false)
    if (d.error) setError(d.error)
    else { setSuccess(d.message); setAmount(''); setPhone('') }
  }

  const net = NETWORKS.find(n => n.name === network)!

  return (
    <AppShell>
      <TopBar title="Buy Airtime" />
      <main className="pb-28 pt-4 px-4 max-w-lg mx-auto space-y-4">
        {/* Balance */}
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
                  className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all`}
                  style={{
                    borderColor: n.color,
                    backgroundColor: network === n.name ? n.color : n.bg,
                    color: network === n.name ? (n.name === 'MTN' ? '#000' : '#fff') : n.color,
                  }}>
                  {n.name}
                </button>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-semibold text-[#333] mb-1 block">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/,'').slice(0,11))}
              placeholder="08012345678" className="input w-full text-sm font-mono" maxLength={11}/>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-[#333] mb-2 block">Amount (₦)</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(a.toString())}
                  className={`py-2 rounded-lg text-sm font-semibold border transition-all ${amount===a.toString()
                    ?'text-white border-transparent' : 'bg-[#f5f5f5] border-transparent text-[#333]'}`}
                  style={amount===a.toString()?{backgroundColor:net.color,color:net.name==='MTN'?'#000':'#fff'}:{}}>
                  ₦{a}
                </button>
              ))}
            </div>
            <input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/,''))}
              placeholder="Or enter custom amount" className="input w-full text-sm" type="number" min="50"/>
          </div>
        </div>

        <button onClick={submit} disabled={loading || !phone || !amount}
          className="w-full py-3.5 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: net.color, color: network==='MTN'?'#000':'#fff' }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Phone className="w-4 h-4"/>}
          Buy ₦{amount || '0'} {network} Airtime
        </button>
      </main>
    </AppShell>
  )
}
