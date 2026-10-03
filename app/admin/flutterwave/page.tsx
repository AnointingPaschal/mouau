'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { RefreshCw, Loader2, Wifi, Phone, Zap, Tv, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'

type BillCategory = {
  id: number; biller_code: string; name: string; default_commission: number;
  date_added: string; country: string; is_airtime: boolean; biller_name: string;
  item_code: string; short_name: string; fee: number; commission_on_fee: boolean;
  label_name: string; amount: number | null;
}

const NETWORKS = ['MTN', 'GLO', 'AIRTEL', '9MOBILE']
const NETWORK_COLORS: Record<string,string> = {
  MTN: '#ffcc00', GLO: '#007a3d', AIRTEL: '#ed1c24', '9MOBILE': '#006633',
}

const CAT_ICONS: Record<string,any> = {
  DATA:        Wifi,
  AIRTIME:     Phone,
  POWER:       Zap,
  DSTV:        Tv,
  GOTV:        Tv,
  STARTIME:    Tv,
}

export default function FlutterwavePlansPage() {
  const [categories,  setCategories]  = useState<BillCategory[]>([])
  const [loadingCats, setLoadingCats] = useState(false)
  const [catError,    setCatError]    = useState('')
  const [expanded,    setExpanded]    = useState<string[]>([])
  const [activeNet,   setActiveNet]   = useState('MTN')
  const [dataPlans,   setDataPlans]   = useState<BillCategory[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [dataError,   setDataError]   = useState('')
  const [activeTab,   setActiveTab]   = useState<'categories'|'data'>('categories')

  const fetchCategories = async () => {
    setLoadingCats(true); setCatError('')
    const r = await fetch('/api/admin/flutterwave/bill-categories')
    const d = await r.json()
    if (d.error) setCatError(d.error)
    else setCategories(d.categories || [])
    setLoadingCats(false)
  }

  const fetchDataPlans = async (network: string) => {
    setLoadingData(true); setDataError('')
    const r = await fetch(`/api/admin/flutterwave/data-plans?network=${network}`)
    const d = await r.json()
    if (d.error) setDataError(d.error)
    else setDataPlans(d.plans || [])
    setLoadingData(false)
  }

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => { fetchDataPlans(activeNet) }, [activeNet])

  // Group categories by short_name
  const grouped = categories.reduce((acc, c) => {
    const key = c.short_name || c.biller_name || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {} as Record<string,BillCategory[]>)

  const toggle = (key: string) =>
    setExpanded(p => p.includes(key) ? p.filter(k=>k!==key) : [...p, key])

  return (
    <AdminShell>
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0a0a0a]">Plans & Pricing</h1>
            <p className="text-sm text-[#888]">Live data from Flutterwave API</p>
          </div>
          <button
            onClick={() => activeTab === 'categories' ? fetchCategories() : fetchDataPlans(activeNet)}
            className="p-2 rounded-xl bg-[#f5f5f5] text-[#888]"
          >
            <RefreshCw className="w-4 h-4"/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#f5f5f5] rounded-xl p-1 gap-1">
          {(['categories','data'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab===tab?'bg-white text-[#0a0a0a] shadow-sm':'text-[#888]'}`}>
              {tab === 'categories' ? '📋 Bill Categories' : '📶 Data Plans'}
            </button>
          ))}
        </div>

        {/* Bill Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-3">
            {loadingCats && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#1e3a8a]"/>
              </div>
            )}
            {catError && (
              <div className="card p-4 text-center">
                <p className="text-[#b91c1c] text-sm">{catError}</p>
                <p className="text-xs text-[#aaa] mt-1">Check your Flutterwave API key in Settings → Flutterwave</p>
              </div>
            )}
            {!loadingCats && !catError && (
              <>
                <p className="text-xs text-[#888]">{categories.length} bill items across {Object.keys(grouped).length} categories</p>
                {Object.entries(grouped).map(([groupName, items]) => {
                  const Icon = CAT_ICONS[items[0]?.short_name] || DollarSign
                  const isOpen = expanded.includes(groupName)
                  return (
                    <div key={groupName} className="card overflow-hidden">
                      <button onClick={() => toggle(groupName)} className="w-full flex items-center gap-3 p-3 text-left">
                        <div className="w-8 h-8 rounded-lg bg-[#1e3a8a]/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-[#1e3a8a]"/>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-[#0a0a0a]">{groupName}</div>
                          <div className="text-[10px] text-[#aaa]">{items.length} option{items.length!==1?'s':''}</div>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-[#aaa]"/> : <ChevronDown className="w-4 h-4 text-[#aaa]"/>}
                      </button>
                      {isOpen && (
                        <div className="border-t border-[#f0f0f0]">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-[#fafafa] text-[#888]">
                                  <th className="text-left px-3 py-2 font-semibold">Name</th>
                                  <th className="text-right px-3 py-2 font-semibold">Amount</th>
                                  <th className="text-right px-3 py-2 font-semibold">Fee</th>
                                  <th className="text-right px-3 py-2 font-semibold">Commission</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item, i) => (
                                  <tr key={item.id} className={i%2===0?'':'bg-[#fafafa]'}>
                                    <td className="px-3 py-2">{item.name || item.label_name}</td>
                                    <td className="px-3 py-2 text-right font-mono">
                                      {item.amount ? `₦${item.amount.toLocaleString()}` : '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono">
                                      {item.fee ? `₦${item.fee}` : '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right text-[#1a6b3a] font-mono">
                                      {item.default_commission ? `${item.default_commission}%` : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* Data Plans Tab */}
        {activeTab === 'data' && (
          <div className="space-y-3">
            {/* Network selector */}
            <div className="flex gap-2 flex-wrap">
              {NETWORKS.map(net => (
                <button key={net} onClick={() => setActiveNet(net)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${activeNet===net?'text-white':'bg-white text-[#333]'}`}
                  style={{ borderColor: NETWORK_COLORS[net], ...(activeNet===net?{backgroundColor: NETWORK_COLORS[net]}:{}) }}>
                  {net}
                </button>
              ))}
            </div>

            {loadingData && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#1e3a8a]"/>
              </div>
            )}
            {dataError && (
              <div className="card p-4 text-center">
                <p className="text-[#b91c1c] text-sm">{dataError}</p>
              </div>
            )}
            {!loadingData && !dataError && dataPlans.length > 0 && (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#fafafa] text-[#888]">
                        <th className="text-left px-3 py-2 font-semibold">Plan</th>
                        <th className="text-right px-3 py-2 font-semibold">Amount</th>
                        <th className="text-right px-3 py-2 font-semibold">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataPlans.map((plan, i) => (
                        <tr key={plan.id} className={i%2===0?'':'bg-[#fafafa]'}>
                          <td className="px-3 py-2">{plan.name || plan.label_name}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-[#1e3a8a]">
                            ₦{plan.amount?.toLocaleString() || '—'}
                          </td>
                          <td className="px-3 py-2 text-right text-[#1a6b3a] font-mono">
                            {plan.default_commission ? `${plan.default_commission}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {!loadingData && !dataError && dataPlans.length === 0 && (
              <div className="card p-6 text-center text-[#aaa] text-sm">No plans found for {activeNet}</div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
