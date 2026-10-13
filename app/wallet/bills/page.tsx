'use client'
import WalletGuard from '@/components/WalletGuard'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import {
  Zap, Tv, Gamepad2, GraduationCap, Wifi as WifiIcon,
  Loader2, CheckCircle2, AlertCircle, ChevronRight
} from 'lucide-react'

// ── Category definitions ──────────────────────────────────────
const BILL_CATS = [
  { id: 'electricity', label: 'Electricity',  icon: Zap,          color: '#d97706', desc: 'Prepaid & postpaid meters'  },
  { id: 'cable',       label: 'Cable TV',     icon: Tv,           color: '#7c3aed', desc: 'DSTV, GOtv, Startimes'      },
  { id: 'betting',     label: 'Betting',      icon: Gamepad2,     color: '#059669', desc: 'Fund your betting wallet'    },
  { id: 'education',   label: 'Education',    icon: GraduationCap,color: '#1e3a8a', desc: 'WAEC, NECO result checkers'  },
  { id: 'isp',         label: 'Internet',     icon: WifiIcon,     color: '#0891b2', desc: 'Spectranet, Smile, etc.'    },
]

type Biller   = { id: number; name: string; image?: string }
type CablePlan= { id: number; name: string; price?: number; amount?: number; description?: string }

// Hardcoded cable providers since their IDs are known
const CABLE_PROVIDERS: Biller[] = [
  { id: 1, name: 'DSTV'      },
  { id: 2, name: 'GOTV'      },
  { id: 3, name: 'STARTIMES' },
]

const METER_TYPES = ['prepaid', 'postpaid']

export default function BillsPage() {
  const { student } = useAuth()
  const [selectedCat,  setSelectedCat]  = useState<typeof BILL_CATS[0] | null>(null)
  const [balance,      setBalance]      = useState(0)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')
  const [pins,         setPins]         = useState<string[]>([])

  // Dynamic biller state
  const [billers,      setBillers]      = useState<Biller[]>([])
  const [billerLoading,setBillerLoading]= useState(false)
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null)

  // Cable plan state
  const [cablePlans,   setCablePlans]   = useState<CablePlan[]>([])
  const [cablePlanLoading, setCablePlanLoading] = useState(false)
  const [selectedCablePlan, setSelectedCablePlan] = useState<CablePlan | null>(null)

  // Form fields
  const [customer,  setCustomer]  = useState('')
  const [amount,    setAmount]    = useState('')
  const [phone,     setPhone]     = useState('')
  const [meterType, setMeterType] = useState('prepaid')
  const [quantity,  setQuantity]  = useState(1)

  useEffect(() => {
    if (!student?.idNumber) return
    fetch(`/api/wallet?studentId=${student.idNumber}`)
      .then(r=>r.json()).then(d=>setBalance(parseFloat(d.wallet?.balance||0)))
  }, [student?.idNumber])

  // Load billers when category changes
  useEffect(() => {
    if (!selectedCat) return
    resetForm()
    if (selectedCat.id === 'cable') {
      setBillers(CABLE_PROVIDERS)
      return
    }
    const endpoints: Record<string, string> = {
      electricity: '/api/admin/bigisub/electricity-billers',
      betting:     '/api/admin/bigisub/betting-billers',
      education:   '/api/admin/bigisub/education-billers',
      isp:         '/api/admin/bigisub/isp-billers',
    }
    const ep = endpoints[selectedCat.id]
    if (!ep) return
    setBillerLoading(true)
    fetch(ep).then(r=>r.json()).then(d=>{
      setBillers(Array.isArray(d.billers) ? d.billers : [])
      setBillerLoading(false)
    }).catch(()=>setBillerLoading(false))
  }, [selectedCat])

  // Load cable TV plans when biller selected
  useEffect(() => {
    if (selectedCat?.id !== 'cable' || !selectedBiller) return
    setCablePlanLoading(true); setCablePlans([]); setSelectedCablePlan(null)
    fetch(`/api/admin/bigisub/cable-plans?cablename=${selectedBiller.id}`)
      .then(r=>r.json())
      .then(d=>{ setCablePlans(Array.isArray(d.plans) ? d.plans : []); setCablePlanLoading(false) })
      .catch(()=>setCablePlanLoading(false))
  }, [selectedCat, selectedBiller])

  const resetForm = () => {
    setSelectedBiller(null); setCustomer(''); setAmount(''); setPhone('')
    setMeterType('prepaid'); setQuantity(1); setSelectedCablePlan(null)
    setCablePlans([]); setBillers([])
  }

  const selectCat = (cat: typeof BILL_CATS[0]) => {
    setError(''); setSuccess(''); setPins([])
    if (selectedCat?.id === cat.id) { setSelectedCat(null); resetForm(); return }
    setSelectedCat(cat)
  }

  const getCablePlanPrice = (p: CablePlan) => p.price ?? p.amount ?? 0

  const getPayAmount = () => {
    if (selectedCat?.id === 'cable' && selectedCablePlan) return getCablePlanPrice(selectedCablePlan)
    return parseFloat(amount || '0')
  }

  const submit = async () => {
    if (!student || !selectedCat || !selectedBiller) return
    if (!customer) { setError('Enter the customer/account ID'); return }
    const payAmt = getPayAmount()
    if (selectedCat.id !== 'education' && (!payAmt || payAmt < 1)) {
      setError('Enter an amount'); return
    }

    setLoading(true); setError(''); setSuccess(''); setPins([])

    const payload: any = {
      studentId:  student.idNumber,
      category:   selectedCat.id,
      customer,
      billerCode: selectedBiller.id,
      narration:  `${selectedBiller.name} – ${customer}`,
    }

    if (selectedCat.id === 'cable') {
      payload.planCode = selectedCablePlan?.id
      payload.amount   = payAmt
    } else if (selectedCat.id === 'electricity') {
      payload.amount    = payAmt
      payload.phone     = phone
      payload.meterType = meterType
    } else if (selectedCat.id === 'education') {
      payload.quantity = quantity
      payload.amount   = payAmt
    } else {
      payload.amount = payAmt
    }

    try {
      const r = await fetch('/api/wallet/bills', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const d = await r.json()
      if (d.error) setError(d.error)
      else {
        setSuccess(d.message || `${selectedCat.label} payment successful!`)
        if (d.pins?.length) setPins(d.pins)
        resetForm(); setSelectedCat(null)
        fetch(`/api/wallet?studentId=${student.idNumber}`).then(r=>r.json()).then(d=>setBalance(parseFloat(d.wallet?.balance||0)))
      }
    } catch { setError('Network error. Please try again.') }
    setLoading(false)
  }

  return (
    <WalletGuard>
      <AppShell>
        <TopBar title="Bill Payments" />
        <main className="pb-28 pt-4 px-4 max-w-lg mx-auto space-y-4">

          {/* Balance */}
          <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg,#1e3a8a,#1a6b3a)' }}>
            <span className="text-white/70 text-xs">Wallet Balance</span>
            <span className="text-white font-black text-base">₦{balance.toLocaleString('en-NG',{minimumFractionDigits:2})}</span>
          </div>

          {success && (
            <div className="rounded-2xl p-4 bg-green-50 border border-green-200 space-y-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#1a6b3a] mt-0.5 flex-shrink-0"/>
                <p className="text-sm text-[#1a6b3a] font-semibold">{success}</p>
              </div>
              {pins.length > 0 && (
                <div className="pl-8">
                  <p className="text-xs font-bold text-[#555] mb-1">Your PIN(s):</p>
                  {pins.map((pin, i) => (
                    <div key={i} className="font-mono text-sm font-black text-[#1a6b3a] bg-green-100 rounded-lg px-3 py-1.5 inline-block mr-2 mb-1">{pin}</div>
                  ))}
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

          {/* Category picker */}
          <div className="card p-4">
            <p className="text-xs font-bold text-[#888] uppercase tracking-widest mb-3">Bill Type</p>
            <div className="space-y-2">
              {BILL_CATS.map(cat => {
                const active = selectedCat?.id === cat.id
                return (
                  <button key={cat.id} onClick={() => selectCat(cat)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all active:scale-[0.99]"
                    style={{
                      borderColor:     active ? cat.color : '#f0f0f0',
                      backgroundColor: active ? cat.color + '10' : 'transparent',
                    }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: cat.color + '20' }}>
                      <cat.icon className="w-5 h-5" style={{ color: cat.color }}/>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-bold text-[#0a0a0a]">{cat.label}</p>
                      <p className="text-[10px] text-[#aaa]">{cat.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 transition-transform"
                      style={{ color: active ? cat.color : '#ccc', transform: active ? 'rotate(90deg)' : '' }}/>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bill form */}
          {selectedCat && (
            <div className="card p-5 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: selectedCat.color }}>
                {selectedCat.label} Details
              </p>

              {/* Biller picker */}
              <div>
                <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2 block">
                  {selectedCat.id === 'cable' ? 'Cable Provider' :
                   selectedCat.id === 'electricity' ? 'DISCO / Provider' :
                   selectedCat.id === 'betting' ? 'Betting Platform' :
                   selectedCat.id === 'education' ? 'Exam Body' : 'ISP Provider'}
                </label>
                {billerLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#aaa]"/>
                    <span className="text-xs text-[#aaa]">Loading providers...</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {billers.map(b => (
                      <button key={b.id} onClick={() => setSelectedBiller(b)}
                        className="px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all active:scale-95"
                        style={{
                          borderColor:     selectedBiller?.id === b.id ? selectedCat.color : '#e0e0e0',
                          backgroundColor: selectedBiller?.id === b.id ? selectedCat.color : '#f9f9f9',
                          color:           selectedBiller?.id === b.id ? '#fff' : '#333',
                        }}>
                        {b.name}
                      </button>
                    ))}
                    {billers.length === 0 && !billerLoading && (
                      <p className="text-xs text-[#aaa]">No providers found — check your Bigisub API key</p>
                    )}
                  </div>
                )}
              </div>

              {/* Cable TV: plan picker */}
              {selectedCat.id === 'cable' && selectedBiller && (
                <div>
                  <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2 block">Select Bouquet</label>
                  {cablePlanLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" style={{color:selectedCat.color}}/>
                      <span className="text-xs text-[#aaa]">Loading plans...</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                      {cablePlans.map(p => {
                        const price   = getCablePlanPrice(p)
                        const selected= selectedCablePlan?.id === p.id
                        return (
                          <button key={p.id} onClick={() => setSelectedCablePlan(p)}
                            className="w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left"
                            style={{
                              borderColor:     selected ? selectedCat.color : '#f0f0f0',
                              backgroundColor: selected ? selectedCat.color + '10' : '#fafafa',
                            }}>
                            <div>
                              <p className="text-xs font-bold text-[#0a0a0a]">{p.name}</p>
                              {p.description && <p className="text-[9px] text-[#aaa]">{p.description}</p>}
                            </div>
                            <p className="text-sm font-black ml-3" style={{color: selected ? selectedCat.color : '#1e3a8a'}}>
                              {price ? `₦${price.toLocaleString()}` : '—'}
                            </p>
                          </button>
                        )
                      })}
                      {cablePlans.length === 0 && <p className="text-xs text-[#aaa]">No plans found</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Customer ID / Meter / Card / Account */}
              {(selectedBiller || selectedCat.id === 'cable') && (
                <div>
                  <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-1.5 block">
                    {selectedCat.id === 'electricity' ? 'Meter Number' :
                     selectedCat.id === 'cable'       ? 'Smart Card / IUC Number' :
                     selectedCat.id === 'betting'     ? 'User ID / Account' :
                     selectedCat.id === 'education'   ? 'Phone Number for Delivery' :
                     'Account Number / Phone'}
                  </label>
                  <input
                    value={customer}
                    onChange={e => setCustomer(e.target.value)}
                    placeholder={
                      selectedCat.id === 'electricity' ? 'Enter meter number' :
                      selectedCat.id === 'cable'       ? 'Enter smart card number' :
                      selectedCat.id === 'betting'     ? 'Enter account/user ID' :
                      selectedCat.id === 'education'   ? 'Enter phone number' :
                      'Enter account number'
                    }
                    className="input w-full text-sm font-mono"
                    inputMode={selectedCat.id === 'electricity' || selectedCat.id === 'cable' ? 'numeric' : 'text'}
                  />
                </div>
              )}

              {/* Electricity: meter type + phone */}
              {selectedCat.id === 'electricity' && selectedBiller && (
                <>
                  <div>
                    <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2 block">Meter Type</label>
                    <div className="flex gap-2">
                      {METER_TYPES.map(t => (
                        <button key={t} onClick={() => setMeterType(t)}
                          className="px-4 py-2 rounded-xl text-xs font-bold border-2 capitalize transition-all"
                          style={{
                            borderColor:     meterType === t ? selectedCat.color : '#e0e0e0',
                            backgroundColor: meterType === t ? selectedCat.color + '15' : 'transparent',
                            color:           meterType === t ? selectedCat.color : '#555',
                          }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-1.5 block">Phone Number</label>
                    <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,11))}
                      placeholder="08012345678" className="input w-full text-sm font-mono" inputMode="numeric" maxLength={11}/>
                  </div>
                </>
              )}

              {/* Education: quantity */}
              {selectedCat.id === 'education' && selectedBiller && (
                <div>
                  <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2 block">Number of Pins</label>
                  <div className="flex gap-2">
                    {[1,2,3,5].map(q => (
                      <button key={q} onClick={() => setQuantity(q)}
                        className="w-12 h-10 rounded-xl text-sm font-black border-2 transition-all"
                        style={{
                          borderColor:     quantity === q ? selectedCat.color : '#e0e0e0',
                          backgroundColor: quantity === q ? selectedCat.color : '#fafafa',
                          color:           quantity === q ? '#fff' : '#333',
                        }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount field (for electricity, betting, ISP) */}
              {(selectedCat.id === 'electricity' || selectedCat.id === 'betting' || selectedCat.id === 'isp') && selectedBiller && (
                <div>
                  <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-1.5 block">Amount (₦)</label>
                  <input
                    value={amount}
                    onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter amount"
                    className="input w-full text-sm"
                    type="number"
                    min="100"
                  />
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          {selectedCat && selectedBiller && (
            <button
              onClick={submit}
              disabled={loading || !customer || (
                selectedCat.id === 'cable' ? !selectedCablePlan :
                selectedCat.id === 'education' ? false :
                !amount || parseFloat(amount) < 1
              )}
              className="w-full py-4 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]"
              style={{ backgroundColor: selectedCat.color }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <selectedCat.icon className="w-5 h-5"/>}
              {loading ? 'Processing...' :
                selectedCat.id === 'cable' && selectedCablePlan
                  ? `Pay ₦${getCablePlanPrice(selectedCablePlan).toLocaleString()} — ${selectedCablePlan.name}`
                  : selectedCat.id === 'education'
                  ? `Buy ${quantity} ${selectedBiller.name} Pin${quantity > 1 ? 's' : ''}`
                  : `Pay ₦${parseFloat(amount||'0').toLocaleString()} — ${selectedBiller.name}`
              }
            </button>
          )}

          <p className="text-center text-[10px] text-[#aaa]">Powered by Bigisub · All services available 24/7</p>
        </main>
      </AppShell>
    </WalletGuard>
  )
}
