'use client'
import WalletGuard from '@/components/WalletGuard'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import {
  Zap, Tv, Gamepad2, GraduationCap, Wifi as WifiIcon,
  Loader2, CheckCircle2, AlertCircle, ChevronRight, ShieldCheck
} from 'lucide-react'

const BILL_CATS = [
  { id: 'electricity', label: 'Electricity',  icon: Zap,           color: '#d97706', desc: 'Prepaid & postpaid meters'  },
  { id: 'cable',       label: 'Cable TV',     icon: Tv,            color: '#7c3aed', desc: 'DSTV, GOtv, Startimes'      },
  { id: 'betting',     label: 'Betting',      icon: Gamepad2,      color: '#059669', desc: 'Fund your betting wallet'    },
  { id: 'education',   label: 'Education',    icon: GraduationCap, color: '#1e3a8a', desc: 'WAEC, NECO result checkers'  },
  { id: 'isp',         label: 'Internet',     icon: WifiIcon,      color: '#0891b2', desc: 'Spectranet, Smile, etc.'     },
]

// Cable providers with their API cable_name values (lowercase, as Bigisub expects)
const CABLE_PROVIDERS = [
  { id: 'dstv',       name: 'DSTV'      },
  { id: 'gotv',       name: 'GOtv'      },
  { id: 'startimes',  name: 'Startimes' },
]

const METER_TYPES = ['prepaid', 'postpaid']

type Biller = { id: string; name: string; code?: string; min_amount?: number; max_amount?: number }
type CablePlan = { id: number; cable_name: string; product_name: string; variation_code: string; amount: number }
type EduPlan   = { exam_type: string; name: string; amount: number; validity: string; description: string; code: string }

export default function BillsPage() {
  const { student } = useAuth()
  const [selectedCat,  setSelectedCat]  = useState<typeof BILL_CATS[0] | null>(null)
  const [balance,      setBalance]      = useState(0)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')
  const [pins,         setPins]         = useState<string[]>([])
  const [elecToken,    setElecToken]    = useState('')

  const [billers,       setBillers]       = useState<Biller[]>([])
  const [billerLoading, setBillerLoading] = useState(false)
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null)

  const [cablePlans,       setCablePlans]       = useState<CablePlan[]>([])
  const [cablePlanLoading, setCablePlanLoading] = useState(false)
  const [selectedCablePlan, setSelectedCablePlan] = useState<CablePlan | null>(null)

  const [eduPlans,       setEduPlans]       = useState<EduPlan[]>([])
  const [selectedEduPlan, setSelectedEduPlan] = useState<EduPlan | null>(null)

  // Verify step
  const [verifying,     setVerifying]     = useState(false)
  const [verified,      setVerified]      = useState(false)
  const [customerName,  setCustomerName]  = useState('')

  // Form fields
  const [customer,  setCustomer]  = useState('')
  const [amount,    setAmount]    = useState('')
  const [phone,     setPhone]     = useState('')
  const [meterType, setMeterType] = useState('prepaid')
  const [quantity,  setQuantity]  = useState(1)

  useEffect(() => {
    if (!student?.idNumber) return
    fetch(`/api/wallet?studentId=${student.idNumber}`)
      .then(r => r.json()).then(d => setBalance(parseFloat(d.wallet?.balance || 0)))
  }, [student?.idNumber])

  // Load billers when category changes
  useEffect(() => {
    if (!selectedCat) return
    resetForm()
    if (selectedCat.id === 'cable') { setBillers(CABLE_PROVIDERS); return }
    const ep: Record<string, string> = {
      electricity: '/api/admin/bigisub/electricity-billers',
      betting:     '/api/admin/bigisub/betting-billers',
      education:   '/api/admin/bigisub/education-billers',
      isp:         '/api/admin/bigisub/isp-billers',
    }
    const url = ep[selectedCat.id]
    if (!url) return
    setBillerLoading(true)
    fetch(url).then(r => r.json()).then(d => {
      // electricity: { code, name, ... }, betting: { code, name, ... }, education: { code/exam_type, name, amount, ... }
      const raw = Array.isArray(d.billers) ? d.billers : []
      if (selectedCat.id === 'education') {
        setEduPlans(raw as EduPlan[])
        setBillers(raw.map((e: EduPlan) => ({ id: e.code, name: e.name })))
      } else {
        setBillers(raw.map((b: any) => ({ id: b.code ?? b.id, name: b.name, min_amount: b.min_amount, max_amount: b.max_amount })))
      }
      setBillerLoading(false)
    }).catch(() => setBillerLoading(false))
  }, [selectedCat])

  // Load cable plans when provider selected
  useEffect(() => {
    if (selectedCat?.id !== 'cable' || !selectedBiller) return
    setCablePlanLoading(true); setCablePlans([]); setSelectedCablePlan(null)
    fetch(`/api/admin/bigisub/cable-plans?cablename=${selectedBiller.id}`)
      .then(r => r.json())
      .then(d => { setCablePlans(Array.isArray(d.plans) ? d.plans : []); setCablePlanLoading(false) })
      .catch(() => setCablePlanLoading(false))
  }, [selectedCat, selectedBiller])

  // Reset verify when customer ID changes
  useEffect(() => { setVerified(false); setCustomerName('') }, [customer, selectedBiller, meterType])

  const resetForm = () => {
    setSelectedBiller(null); setCustomer(''); setAmount(''); setPhone('')
    setMeterType('prepaid'); setQuantity(1); setSelectedCablePlan(null)
    setCablePlans([]); setBillers([]); setEduPlans([])
    setVerified(false); setCustomerName(''); setSelectedEduPlan(null)
  }

  const selectCat = (cat: typeof BILL_CATS[0]) => {
    setError(''); setSuccess(''); setPins([]); setElecToken('')
    if (selectedCat?.id === cat.id) { setSelectedCat(null); resetForm(); return }
    setSelectedCat(cat)
  }

  const needsVerify = (cat: string) => ['cable', 'electricity', 'betting'].includes(cat)

  const verify = async () => {
    if (!selectedCat || !selectedBiller || !customer) return
    setVerifying(true); setError('')
    try {
      const r = await fetch('/api/wallet/verify-biller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category:   selectedCat.id,
          billerCode: selectedBiller.id,
          customer,
          meterType,
        }),
      })
      const d = await r.json()
      if (d.error) { setError(d.error); setVerified(false) }
      else { setCustomerName(d.customerName || 'Verified'); setVerified(true) }
    } catch { setError('Verification failed. Please try again.') }
    setVerifying(false)
  }

  const getPayAmount = () => {
    if (selectedCat?.id === 'cable' && selectedCablePlan) return selectedCablePlan.amount
    if (selectedCat?.id === 'education' && selectedEduPlan) return selectedEduPlan.amount * quantity
    return parseFloat(amount || '0')
  }

  const submit = async () => {
    if (!student || !selectedCat || !selectedBiller) return
    if (selectedCat.id === 'cable' && !selectedCablePlan) { setError('Select a bouquet'); return }
    if (selectedCat.id === 'education' && !selectedEduPlan) { setError('Select an exam'); return }
    if (!customer) { setError('Enter the account/meter number'); return }
    const payAmt = getPayAmount()
    if (selectedCat.id !== 'education' && (!payAmt || payAmt < 1)) { setError('Enter an amount'); return }
    if (needsVerify(selectedCat.id) && !verified) { setError('Please verify the account first'); return }

    setLoading(true); setError(''); setSuccess(''); setPins([]); setElecToken('')

    const payload: any = {
      studentId:  student.idNumber,
      category:   selectedCat.id,
      customer,
      billerCode: selectedBiller.id,   // cable: "dstv" | elec: "eko-electric" | betting: "biller-bet9ja"
      narration:  `${selectedBiller.name} – ${customer}`,
      phone,
    }

    if (selectedCat.id === 'cable') {
      payload.planCode = selectedCablePlan?.variation_code
      payload.amount   = selectedCablePlan?.amount
    } else if (selectedCat.id === 'electricity') {
      payload.amount    = payAmt
      payload.meterType = meterType
    } else if (selectedCat.id === 'education') {
      payload.quantity  = quantity
      payload.amount    = selectedEduPlan!.amount * quantity
      payload.billerCode = selectedEduPlan!.code    // e.g. "waec"
    } else if (selectedCat.id === 'betting') {
      payload.amount = payAmt
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
        if (d.pins)  setPins(Array.isArray(d.pins) ? d.pins : [d.pins])
        if (d.token) setElecToken(d.token)
        resetForm(); setSelectedCat(null)
        fetch(`/api/wallet?studentId=${student.idNumber}`).then(r=>r.json()).then(d=>setBalance(parseFloat(d.wallet?.balance||0)))
      }
    } catch { setError('Network error. Please try again.') }
    setLoading(false)
  }

  const canSubmit = () => {
    if (!selectedCat || !selectedBiller || !customer) return false
    if (needsVerify(selectedCat.id) && !verified) return false
    if (selectedCat.id === 'cable') return !!selectedCablePlan
    if (selectedCat.id === 'education') return !!selectedEduPlan
    return parseFloat(amount || '0') >= 1
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
              {elecToken && (
                <div className="pl-8">
                  <p className="text-[10px] text-[#555] font-bold mb-1 uppercase tracking-wide">Meter Token</p>
                  <p className="font-mono text-base font-black text-[#1a6b3a] bg-green-100 rounded-lg px-3 py-2 tracking-widest">{elecToken}</p>
                </div>
              )}
              {pins.length > 0 && (
                <div className="pl-8">
                  <p className="text-[10px] text-[#555] font-bold mb-1 uppercase tracking-wide">Your PIN{pins.length>1?'s':''}</p>
                  {pins.map((pin, i) => (
                    <p key={i} className="font-mono text-sm font-black text-[#1a6b3a] bg-green-100 rounded-lg px-3 py-1.5 inline-block mr-2 mb-1">{pin}</p>
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

              {/* Biller / Provider picker */}
              <div>
                <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2 block">
                  {selectedCat.id === 'cable'       ? 'Cable Provider' :
                   selectedCat.id === 'electricity' ? 'DisCo / Provider' :
                   selectedCat.id === 'betting'     ? 'Betting Platform' :
                   selectedCat.id === 'education'   ? 'Exam Type' : 'ISP Provider'}
                </label>
                {billerLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#aaa]"/>
                    <span className="text-xs text-[#aaa]">Loading providers...</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {billers.map(b => (
                      <button key={b.id} onClick={() => { setSelectedBiller(b); setSelectedEduPlan(eduPlans.find(e=>e.code===b.id)||null) }}
                        className="px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all active:scale-95"
                        style={{
                          borderColor:     selectedBiller?.id === b.id ? selectedCat.color : '#e0e0e0',
                          backgroundColor: selectedBiller?.id === b.id ? selectedCat.color : '#f9f9f9',
                          color:           selectedBiller?.id === b.id ? '#fff' : '#333',
                        }}>
                        {b.name}
                        {selectedCat.id === 'education' && (
                          <span className="block text-[8px] font-normal opacity-80">
                            ₦{eduPlans.find(e=>e.code===b.id)?.amount.toLocaleString()}
                          </span>
                        )}
                      </button>
                    ))}
                    {billers.length === 0 && !billerLoading && (
                      <p className="text-xs text-[#aaa]">No providers found</p>
                    )}
                  </div>
                )}
              </div>

              {/* Cable TV: bouquet picker */}
              {selectedCat.id === 'cable' && selectedBiller && (
                <div>
                  <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2 block">Select Bouquet</label>
                  {cablePlanLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" style={{color:selectedCat.color}}/>
                      <span className="text-xs text-[#aaa]">Loading plans...</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                      {cablePlans.map(p => {
                        const sel = selectedCablePlan?.id === p.id
                        return (
                          <button key={p.id} onClick={() => setSelectedCablePlan(p)}
                            className="w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left"
                            style={{
                              borderColor:     sel ? selectedCat.color : '#f0f0f0',
                              backgroundColor: sel ? selectedCat.color + '10' : '#fafafa',
                            }}>
                            <p className="text-xs font-bold text-[#0a0a0a] flex-1 pr-2 leading-tight">{p.product_name}</p>
                            <p className="text-sm font-black flex-shrink-0" style={{color: sel ? selectedCat.color : '#1e3a8a'}}>
                              ₦{p.amount.toLocaleString()}
                            </p>
                          </button>
                        )
                      })}
                      {cablePlans.length === 0 && <p className="text-xs text-[#aaa]">No plans found</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Customer / Meter / Card / Account input */}
              {selectedBiller && (
                <div>
                  <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-1.5 block">
                    {selectedCat.id === 'electricity' ? 'Meter Number' :
                     selectedCat.id === 'cable'       ? 'Smart Card / IUC Number' :
                     selectedCat.id === 'betting'     ? 'User ID / Account' :
                     selectedCat.id === 'education'   ? 'Phone Number (for delivery)' : 'Account Number / Phone'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={customer}
                      onChange={e => setCustomer(e.target.value)}
                      placeholder={
                        selectedCat.id === 'electricity' ? 'Enter meter number' :
                        selectedCat.id === 'cable'       ? 'Enter smart card number' :
                        selectedCat.id === 'betting'     ? 'Enter account/user ID' :
                        selectedCat.id === 'education'   ? 'Enter phone number' : 'Enter account number'
                      }
                      className="input flex-1 text-sm font-mono"
                      inputMode={selectedCat.id === 'electricity' || selectedCat.id === 'cable' ? 'numeric' : 'text'}
                    />
                    {/* Verify button for cable / electricity / betting */}
                    {needsVerify(selectedCat.id) && customer.length >= 4 && !verified && (
                      <button onClick={verify} disabled={verifying}
                        className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 flex-shrink-0 transition-all"
                        style={{ backgroundColor: selectedCat.color + '15', color: selectedCat.color }}>
                        {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <ShieldCheck className="w-3.5 h-3.5"/>}
                        {verifying ? 'Verifying' : 'Verify'}
                      </button>
                    )}
                  </div>
                  {/* Verified customer name banner */}
                  {verified && customerName && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ backgroundColor: selectedCat.color + '12' }}>
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{color: selectedCat.color}}/>
                      <p className="text-xs font-bold" style={{color: selectedCat.color}}>{customerName}</p>
                    </div>
                  )}
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

              {/* Education: quantity picker */}
              {selectedCat.id === 'education' && selectedBiller && (
                <div>
                  <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2 block">
                    Number of Pins {selectedEduPlan ? `— ₦${(selectedEduPlan.amount * quantity).toLocaleString()} total` : ''}
                  </label>
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

              {/* Amount field */}
              {(selectedCat.id === 'electricity' || selectedCat.id === 'betting' || selectedCat.id === 'isp') && selectedBiller && (
                <div>
                  <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-1.5 block">
                    Amount (₦){selectedBiller.min_amount ? ` · Min ₦${selectedBiller.min_amount.toLocaleString()}` : ''}
                  </label>
                  <input
                    value={amount}
                    onChange={e => setAmount(e.target.value.replace(/\D/g,''))}
                    placeholder={`Min ₦${selectedBiller.min_amount || 500}`}
                    className="input w-full text-sm"
                    type="number"
                    min={selectedBiller.min_amount || 100}
                  />
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          {selectedCat && selectedBiller && (
            <button
              onClick={submit}
              disabled={loading || !canSubmit()}
              className="w-full py-4 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]"
              style={{ backgroundColor: selectedCat.color }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <selectedCat.icon className="w-5 h-5"/>}
              {loading ? 'Processing...' :
                selectedCat.id === 'cable' && selectedCablePlan
                  ? `Pay ₦${selectedCablePlan.amount.toLocaleString()} — ${selectedCablePlan.product_name.slice(0,30)}`
                  : selectedCat.id === 'education' && selectedEduPlan
                  ? `Buy ${quantity} ${selectedEduPlan.name.replace('Result Checker','')} Pin${quantity>1?'s':''} — ₦${(selectedEduPlan.amount*quantity).toLocaleString()}`
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
