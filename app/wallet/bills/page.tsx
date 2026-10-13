'use client'
import WalletGuard from '@/components/WalletGuard'
import { useEffect, useState, useRef } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import {
  Zap, Tv, Gamepad2, GraduationCap, Wifi as WifiIcon,
  Loader2, CheckCircle2, AlertCircle, ChevronDown, Search, X
} from 'lucide-react'

const BILL_CATS = [
  { id:'electricity', label:'Electricity',  icon:Zap,           color:'#d97706', desc:'Prepaid & postpaid' },
  { id:'cable',       label:'Cable TV',     icon:Tv,            color:'#7c3aed', desc:'DSTV, GOtv, Startimes' },
  { id:'betting',     label:'Betting',      icon:Gamepad2,      color:'#059669', desc:'Fund betting wallet' },
  { id:'education',   label:'Education',    icon:GraduationCap, color:'#1e3a8a', desc:'WAEC, NECO, NABTEB' },
  { id:'isp',         label:'Internet',     icon:WifiIcon,      color:'#0891b2', desc:'Smile, Spectranet' },
]

const CABLE_PROVIDERS = [
  { name:'DSTV',      code:'dstv' },
  { name:'GOtv',      code:'gotv' },
  { name:'Startimes', code:'startimes' },
  { name:'Showmax',   code:'showmax' },
]
const METER_TYPES = ['prepaid','postpaid']

// ── Searchable Dropdown ───────────────────────────────────────
function SearchDropdown({ options, value, onChange, placeholder, color }: {
  options: { id:string; label:string; sub?:string }[]
  value: string; onChange:(v:string)=>void
  placeholder: string; color: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o=>o.id===value)
  const filtered = q ? options.filter(o=>o.label.toLowerCase().includes(q.toLowerCase())||o.sub?.toLowerCase().includes(q.toLowerCase())) : options

  useEffect(() => {
    const handler = (e:MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return ()=>document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={()=>setOpen(o=>!o)}
        className="w-full flex items-center justify-between px-3 py-3 border-2 rounded-2xl text-sm transition-all bg-white"
        style={{ borderColor: open ? color : '#e0e0e0' }}>
        <span className={selected ? 'font-semibold text-[#0a0a0a]' : 'text-[#aaa]'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-[#aaa] flex-shrink-0" style={{transform: open?'rotate(180deg)':'', transition:'transform 0.2s'}}/>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#e0e0e0] rounded-2xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-[#f0f0f0]">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-[#f9f9f9] rounded-xl">
              <Search className="w-3.5 h-3.5 text-[#aaa]"/>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search..."
                className="flex-1 bg-transparent text-xs outline-none text-[#333]" autoFocus/>
              {q && <button onClick={()=>setQ('')}><X className="w-3 h-3 text-[#aaa]"/></button>}
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0
              ? <p className="text-xs text-[#aaa] text-center py-3">No results</p>
              : filtered.map(o=>(
                <button key={o.id} onClick={()=>{ onChange(o.id); setOpen(false); setQ('') }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-[#f9f9f9] transition-colors border-b border-[#f5f5f5] last:border-0"
                  style={{ color: value===o.id ? color : '#0a0a0a', fontWeight: value===o.id ? 700 : 400 }}>
                  {o.label}
                  {o.sub && <span className="text-[10px] text-[#aaa] ml-1">({o.sub})</span>}
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

export default function BillsPage() {
  const { student } = useAuth()
  const [selectedCat, setSelectedCat] = useState<typeof BILL_CATS[0]|null>(null)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pins, setPins] = useState<string[]>([])

  // Biller state
  const [billers, setBillers] = useState<any[]>([])
  const [billerLoading, setBillerLoading] = useState(false)
  const [selectedBiller, setSelectedBiller] = useState('')

  // Cable plan state (from pricing endpoint, grouped)
  const [cableProviders, setCableProviders] = useState<any[]>([])
  const [cableProvider, setCableProvider] = useState('')
  const [cablePlanLoading, setCablePlanLoading] = useState(false)
  const [cablePlans, setCablePlans] = useState<any[]>([])
  const [selectedCablePlan, setSelectedCablePlan] = useState<any>(null)

  // Verify state
  const [verifying, setVerifying] = useState(false)
  const [verifiedName, setVerifiedName] = useState('')

  // Form fields
  const [customer, setCustomer] = useState('')
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [meterType, setMeterType] = useState('prepaid')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (!student?.idNumber) return
    fetch(`/api/wallet?studentId=${student.idNumber}`)
      .then(r=>r.json()).then(d=>setBalance(parseFloat(d.wallet?.balance||0)))
  }, [student?.idNumber])

  // Load billers/plans on category change
  useEffect(() => {
    if (!selectedCat) return
    resetForm()
    if (selectedCat.id === 'cable') {
      setCablePlanLoading(true)
      fetch('/api/admin/bigisub/cable-plans')
        .then(r=>r.json())
        .then(d => {
          setCableProviders(Array.isArray(d.providers) ? d.providers : [])
          setCablePlanLoading(false)
        })
        .catch(()=>setCablePlanLoading(false))
      return
    }
    const endpoints: Record<string,string> = {
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

  // Update cable plans when provider changes
  useEffect(() => {
    if (!cableProvider || !cableProviders.length) return
    const found = cableProviders.find(p=>(p.provider_code||'').toLowerCase()===cableProvider)
    setCablePlans(found?.plans ?? [])
    setSelectedCablePlan(null)
  }, [cableProvider, cableProviders])

  const resetForm = () => {
    setSelectedBiller(''); setCustomer(''); setAmount(''); setPhone('')
    setMeterType('prepaid'); setQuantity(1); setSelectedCablePlan(null)
    setCablePlans([]); setBillers([]); setVerifiedName(''); setCableProvider('')
    setCableProviders([])
  }

  const selectCat = (cat: typeof BILL_CATS[0]) => {
    setError(''); setSuccess(''); setPins([])
    if (selectedCat?.id===cat.id) { setSelectedCat(null); resetForm(); return }
    setSelectedCat(cat)
  }

  // Verify customer
  const verify = async () => {
    if (!selectedCat || !customer) return
    setVerifying(true); setVerifiedName(''); setError('')
    try {
      const body: any = { category: selectedCat.id, customer }
      if (selectedCat.id==='cable') { body.billerCode = cableProvider; }
      else if (selectedCat.id==='electricity') body.billerCode = selectedBiller
      else if (selectedCat.id==='betting') body.billerCode = selectedBiller
      const r = await fetch('/api/wallet/verify-biller', {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body),
      })
      const d = await r.json()
      if (d.error) setError(d.error)
      else setVerifiedName(d.customerName || d.name || 'Verified')
    } catch { setError('Verification failed') }
    setVerifying(false)
  }

  const getBillerOptions = () => billers.map(b => ({
    id: b.code ?? b.id ?? b.name,
    label: b.name ?? b.exam_type ?? b.provider,
    sub: b.code,
  }))

  const getPayAmount = () => {
    if (selectedCat?.id==='cable' && selectedCablePlan) return selectedCablePlan.amount ?? 0
    if (selectedCat?.id==='education') {
      const edu = billers.find(b=>(b.code??b.exam_type)===selectedBiller)
      return edu?.amount ?? 0
    }
    return parseFloat(amount||'0')
  }

  const submit = async () => {
    if (!student || !selectedCat) return
    const cat = selectedCat.id
    const biller = cat==='cable' ? cableProvider : selectedBiller
    if (!biller) { setError('Select a provider'); return }
    if (!customer && cat!=='education') { setError('Enter the account/meter number'); return }
    const payAmt = getPayAmount()
    if (cat!=='education' && (!payAmt||payAmt<1)) { setError('Enter an amount'); return }

    setLoading(true); setError(''); setSuccess(''); setPins([])
    const payload: any = {
      studentId:  student.idNumber,
      category:   cat,
      customer,
      billerCode: cat==='cable' ? cableProvider : selectedBiller,
      amount:     payAmt,
      narration:  `${cat} – ${customer||biller}`,
    }
    if (cat==='cable')       { payload.planCode=selectedCablePlan?.code; payload.phone=phone||customer }
    if (cat==='electricity') { payload.phone=phone; payload.meterType=meterType }
    if (cat==='education')   { payload.quantity=quantity }

    try {
      const r = await fetch('/api/wallet/bills', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload),
      })
      const d = await r.json()
      if (d.error) setError(d.error)
      else {
        setSuccess(d.message||`${selectedCat.label} payment successful!`)
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
            style={{ background:'linear-gradient(135deg,#1e3a8a,#1a6b3a)' }}>
            <span className="text-white/70 text-xs">Wallet Balance</span>
            <span className="text-white font-black text-base">₦{balance.toLocaleString('en-NG',{minimumFractionDigits:2})}</span>
          </div>

          {success && (
            <div className="rounded-2xl p-4 bg-green-50 border border-green-200 space-y-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#1a6b3a] mt-0.5 flex-shrink-0"/>
                <p className="text-sm text-[#1a6b3a] font-semibold">{success}</p>
              </div>
              {pins.length>0 && (
                <div className="pl-8 space-y-1">
                  <p className="text-xs font-bold text-[#555]">Your PIN(s):</p>
                  {pins.map((p,i)=>(
                    <div key={i} className="font-mono text-sm font-black text-[#1a6b3a] bg-green-100 rounded-lg px-3 py-1.5 inline-block mr-2">{p}</div>
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

          {/* 3-per-row category grid */}
          <div className="card p-4">
            <p className="text-xs font-bold text-[#888] uppercase tracking-widest mb-3">Bill Type</p>
            <div className="grid grid-cols-3 gap-2">
              {BILL_CATS.map(cat=>{
                const active = selectedCat?.id===cat.id
                return (
                  <button key={cat.id} onClick={()=>selectCat(cat)}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-[0.97]"
                    style={{
                      borderColor:     active ? cat.color : '#f0f0f0',
                      backgroundColor: active ? cat.color+'12' : 'transparent',
                    }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: cat.color+'20' }}>
                      <cat.icon className="w-5 h-5" style={{color:cat.color}}/>
                    </div>
                    <p className="text-[11px] font-bold text-center leading-tight" style={{color: active ? cat.color : '#333'}}>{cat.label}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bill form */}
          {selectedCat && (
            <div className="card p-5 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest" style={{color:selectedCat.color}}>{selectedCat.label} Details</p>

              {/* Cable: provider tabs then plan dropdown */}
              {selectedCat.id==='cable' && (
                <>
                  {cablePlanLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" style={{color:selectedCat.color}}/>
                      <span className="text-xs text-[#aaa]">Loading providers...</span>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2 block">Cable Provider</label>
                        <div className="flex flex-wrap gap-2">
                          {CABLE_PROVIDERS.map(p=>(
                            <button key={p.code} onClick={()=>setCableProvider(p.code)}
                              className="px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all active:scale-95"
                              style={{
                                borderColor:     cableProvider===p.code ? selectedCat.color : '#e0e0e0',
                                backgroundColor: cableProvider===p.code ? selectedCat.color : '#f9f9f9',
                                color:           cableProvider===p.code ? '#fff' : '#333',
                              }}>
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      {cableProvider && cablePlans.length>0 && (
                        <div>
                          <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2 block">Select Bouquet</label>
                          <SearchDropdown
                            options={cablePlans.map(p=>({ id:p.code, label:p.name, sub:`₦${Number(p.amount).toLocaleString()}` }))}
                            value={selectedCablePlan?.code||''}
                            onChange={v=>setSelectedCablePlan(cablePlans.find(p=>p.code===v)||null)}
                            placeholder="Search bouquet..."
                            color={selectedCat.color}
                          />
                          {selectedCablePlan && (
                            <div className="mt-2 px-3 py-2 bg-purple-50 rounded-xl flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#7c3aed] truncate mr-2">{selectedCablePlan.name}</span>
                              <span className="text-sm font-black text-[#7c3aed] flex-shrink-0">₦{Number(selectedCablePlan.amount).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {cableProvider && cablePlans.length===0 && !cablePlanLoading && (
                        <p className="text-xs text-[#aaa]">No plans found for this provider</p>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Non-cable: searchable dropdown for biller */}
              {selectedCat.id!=='cable' && (
                <div>
                  <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2 block">
                    {selectedCat.id==='electricity' ? 'DISCO / Provider' :
                     selectedCat.id==='betting' ? 'Betting Platform' :
                     selectedCat.id==='education' ? 'Exam Body' : 'ISP Provider'}
                  </label>
                  {billerLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" style={{color:selectedCat.color}}/>
                      <span className="text-xs text-[#aaa]">Loading...</span>
                    </div>
                  ) : (
                    <SearchDropdown
                      options={getBillerOptions()}
                      value={selectedBiller}
                      onChange={setSelectedBiller}
                      placeholder={`Search ${selectedCat.id === 'electricity' ? 'DISCO' : selectedCat.id === 'betting' ? 'platform' : 'provider'}...`}
                      color={selectedCat.color}
                    />
                  )}
                </div>
              )}

              {/* Education: show exam price and quantity */}
              {selectedCat.id==='education' && selectedBiller && (()=>{
                const edu = billers.find(b=>(b.code??b.exam_type)===selectedBiller)
                return (
                  <div className="space-y-3">
                    {edu?.amount && (
                      <div className="px-3 py-2 bg-blue-50 rounded-xl">
                        <p className="text-xs text-[#1e3a8a]">Price: <span className="font-black">₦{Number(edu.amount).toLocaleString()}</span> per pin · {edu.validity}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2 block">Number of Pins</label>
                      <div className="flex gap-2">
                        {[1,2,3,5].map(q=>(
                          <button key={q} onClick={()=>setQuantity(q)}
                            className="w-12 h-10 rounded-xl text-sm font-black border-2 transition-all"
                            style={{
                              borderColor:     quantity===q ? selectedCat.color : '#e0e0e0',
                              backgroundColor: quantity===q ? selectedCat.color : '#fafafa',
                              color:           quantity===q ? '#fff' : '#333',
                            }}>{q}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Customer ID / Meter / Card */}
              {(selectedCat.id!=='education') && (selectedBiller || cableProvider) && (
                <div>
                  <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-1.5 block">
                    {selectedCat.id==='electricity' ? 'Meter Number' :
                     selectedCat.id==='cable'       ? 'Smart Card / IUC Number' :
                     selectedCat.id==='betting'     ? 'User ID / Account' : 'Account / Phone'}
                  </label>
                  <div className="flex gap-2">
                    <input value={customer} onChange={e=>{ setCustomer(e.target.value); setVerifiedName('') }}
                      placeholder={selectedCat.id==='cable'?'Enter IUC number':selectedCat.id==='electricity'?'Enter meter number':'Enter ID'}
                      className="input flex-1 text-sm font-mono" inputMode="numeric"/>
                    {(selectedCat.id==='cable'||selectedCat.id==='electricity'||selectedCat.id==='betting') && customer.length>5 && (
                      <button onClick={verify} disabled={verifying}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-white flex-shrink-0 disabled:opacity-50"
                        style={{backgroundColor:selectedCat.color}}>
                        {verifying ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Verify'}
                      </button>
                    )}
                  </div>
                  {verifiedName && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-200">
                      <CheckCircle2 className="w-4 h-4 text-[#1a6b3a] flex-shrink-0"/>
                      <span className="text-xs font-bold text-[#1a6b3a]">{verifiedName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Electricity extras */}
              {selectedCat.id==='electricity' && selectedBiller && (
                <>
                  <div>
                    <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-2 block">Meter Type</label>
                    <div className="flex gap-2">
                      {METER_TYPES.map(t=>(
                        <button key={t} onClick={()=>setMeterType(t)}
                          className="px-4 py-2 rounded-xl text-xs font-bold border-2 capitalize transition-all"
                          style={{
                            borderColor:     meterType===t ? selectedCat.color : '#e0e0e0',
                            backgroundColor: meterType===t ? selectedCat.color+'15' : 'transparent',
                            color:           meterType===t ? selectedCat.color : '#555',
                          }}>{t}</button>
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

              {/* Cable phone */}
              {selectedCat.id==='cable' && selectedCablePlan && (
                <div>
                  <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-1.5 block">Phone Number</label>
                  <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,11))}
                    placeholder="08012345678" className="input w-full text-sm font-mono" inputMode="numeric" maxLength={11}/>
                </div>
              )}

              {/* Amount for electricity, betting, ISP */}
              {(selectedCat.id==='electricity'||selectedCat.id==='betting'||selectedCat.id==='isp') && (selectedBiller||cableProvider) && (
                <div>
                  <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-1.5 block">
                    Amount (₦)
                    {selectedCat.id==='electricity' && (() => {
                      const disco = billers.find(b=>b.code===selectedBiller)
                      const min = meterType==='postpaid' ? disco?.min_amount_postpaid : disco?.min_amount_prepaid
                      return min ? <span className="text-[10px] text-[#aaa] ml-1 normal-case font-normal">min ₦{Number(min).toLocaleString()}</span> : null
                    })()}
                  </label>
                  <input value={amount} onChange={e=>setAmount(e.target.value.replace(/\D/g,''))}
                    placeholder="Enter amount" className="input w-full text-sm" type="number" min="100"/>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          {selectedCat && (
            <button onClick={submit} disabled={loading || (
              selectedCat.id==='cable' ? (!cableProvider||!selectedCablePlan||!customer) :
              selectedCat.id==='education' ? !selectedBiller :
              !selectedBiller || !customer || !amount
            )}
              className="w-full py-4 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]"
              style={{ backgroundColor: selectedCat.color }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <selectedCat.icon className="w-5 h-5"/>}
              {loading ? 'Processing...' :
               selectedCat.id==='cable' && selectedCablePlan
                 ? `Pay ₦${Number(selectedCablePlan.amount).toLocaleString()} — ${selectedCablePlan.name}`
                 : selectedCat.id==='education'
                 ? `Buy ${quantity} ${billers.find(b=>(b.code??b.exam_type)===selectedBiller)?.name||''} Pin${quantity>1?'s':''}`
                 : `Pay ₦${parseFloat(amount||'0').toLocaleString()}`}
            </button>
          )}

          <p className="text-center text-[10px] text-[#aaa]">Powered by Bigisub · All services 24/7</p>
        </main>
      </AppShell>
    </WalletGuard>
  )
}
