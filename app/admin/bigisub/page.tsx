'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import {
  RefreshCw, Loader2, Wifi, Phone, Zap, Tv, Gamepad2,
  GraduationCap, Globe, ChevronDown, ChevronUp
} from 'lucide-react'

const NETWORKS = ['MTN', 'GLO', 'AIRTEL', '9MOBILE']
const NETWORK_COLORS: Record<string,string> = {
  MTN: '#ffcc00', GLO: '#007a3d', AIRTEL: '#ed1c24', '9MOBILE': '#006633',
}
const NETWORK_TEXT: Record<string,string> = {
  MTN: '#000', GLO: '#fff', AIRTEL: '#fff', '9MOBILE': '#fff',
}

const CABLE_PROVIDERS = [
  { id: 1, name: 'DSTV'      },
  { id: 2, name: 'GOtv'      },
  { id: 3, name: 'Startimes' },
]

type TabId = 'airtime'|'data'|'cable'|'electricity'|'betting'|'education'|'isp'

const TABS: { id: TabId; label: string; icon: any; color: string }[] = [
  { id:'data',        label:'Data',        icon:Wifi,          color:'#1e3a8a' },
  { id:'airtime',     label:'Airtime',     icon:Phone,         color:'#d97706' },
  { id:'cable',       label:'Cable TV',    icon:Tv,            color:'#7c3aed' },
  { id:'electricity', label:'Electricity', icon:Zap,           color:'#d97706' },
  { id:'betting',     label:'Betting',     icon:Gamepad2,      color:'#059669' },
  { id:'education',   label:'Education',   icon:GraduationCap, color:'#1e3a8a' },
  { id:'isp',         label:'ISP',         icon:Globe,         color:'#0891b2' },
]

export default function BigisubPlansPage() {
  const [activeTab,    setActiveTab]    = useState<TabId>('data')
  const [activeNet,    setActiveNet]    = useState('MTN')
  const [activeCable,  setActiveCable]  = useState(1)
  const [data,         setData]         = useState<any[]>([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [expanded,     setExpanded]     = useState<Set<string>>(new Set())
  const [bigiBalance,  setBigiBalance]  = useState<string|null>(null)

  const currentTab = TABS.find(t => t.id === activeTab)!

  const fetchData = async (tab: TabId, net = activeNet, cable = activeCable) => {
    setLoading(true); setError(''); setData([])
    try {
      let url = ''
      if (tab === 'data')        url = `/api/admin/bigisub/data-plans?network=${net}`
      else if (tab === 'cable')  url = `/api/admin/bigisub/cable-plans?cablename=${cable}`
      else if (tab === 'electricity') url = '/api/admin/bigisub/electricity-billers'
      else if (tab === 'betting')     url = '/api/admin/bigisub/betting-billers'
      else if (tab === 'education')   url = '/api/admin/bigisub/education-billers'
      else if (tab === 'isp')         url = '/api/admin/bigisub/isp-billers'
      else if (tab === 'airtime')  { setData([]); setLoading(false); return } // Airtime has no plan list

      const r = await fetch(url)
      const d = await r.json()
      if (d.error) setError(d.error)
      else {
        const items = d.plans || d.billers || []
        setData(Array.isArray(items) ? items : [])
      }
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const fetchBalance = async () => {
    try {
      const r = await fetch('/api/admin/bigisub/balance')
      const d = await r.json()
      if (!d.error) {
        const bal = d.balance?.balance ?? d.balance?.Balance ?? d.balance?.wallet_balance ?? '—'
        setBigiBalance(String(bal))
      }
    } catch {}
  }

  useEffect(() => { fetchData(activeTab); fetchBalance() }, [])
  useEffect(() => { fetchData(activeTab, activeNet, activeCable) }, [activeTab, activeNet, activeCable])

  const toggle = (key: string) => setExpanded(p => {
    const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n
  })

  // Group ISP/electricity/betting billers for display
  const grouped = (tab: TabId) => {
    if (!['electricity','betting','education','isp'].includes(tab)) return null
    return data.reduce((acc: Record<string,any[]>, item) => {
      const key = item.network_name || item.exam_name || item.name || 'Service'
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
  }

  const getPrice = (item: any) => item.price ?? item.amount ?? item.plan_amount ?? null

  return (
    <AdminShell>
      <div className="max-w-2xl mx-auto p-4 pb-24 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
            <h1 className="text-2xl font-black text-[#0a0a0a]">Plans & Pricing</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">Live data from Bigisub API</p>
          </div>
          <div className="flex items-center gap-2">
            {bigiBalance && (
              <div className="bg-[#1a6b3a]/10 rounded-xl px-3 py-1.5 text-center">
                <p className="text-[9px] text-[#1a6b3a] font-bold uppercase tracking-wide">Bigi Balance</p>
                <p className="text-xs font-black text-[#1a6b3a]">₦{bigiBalance}</p>
              </div>
            )}
            <button onClick={() => fetchData(activeTab, activeNet, activeCable)}
              className="p-2 rounded-xl bg-[#f5f5f5] text-[#888] hover:bg-[#eee]">
              <RefreshCw className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* Service tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {TABS.map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all"
              style={{
                borderColor:     activeTab === tab.id ? tab.color : '#f0f0f0',
                backgroundColor: activeTab === tab.id ? tab.color : 'white',
                color:           activeTab === tab.id ? '#fff' : '#555',
              }}>
              <tab.icon className="w-3.5 h-3.5"/>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Network selector for data */}
        {activeTab === 'data' && (
          <div className="flex gap-2">
            {NETWORKS.map(net => (
              <button key={net} onClick={() => setActiveNet(net)}
                className="px-3.5 py-2 rounded-full text-xs font-black border-2 transition-all"
                style={{
                  borderColor:     NETWORK_COLORS[net],
                  backgroundColor: activeNet === net ? NETWORK_COLORS[net] : 'transparent',
                  color:           activeNet === net ? NETWORK_TEXT[net] : NETWORK_COLORS[net],
                }}>
                {net}
              </button>
            ))}
          </div>
        )}

        {/* Cable provider selector */}
        {activeTab === 'cable' && (
          <div className="flex gap-2">
            {CABLE_PROVIDERS.map(p => (
              <button key={p.id} onClick={() => setActiveCable(p.id)}
                className="px-3.5 py-2 rounded-full text-xs font-black border-2 transition-all"
                style={{
                  borderColor:     '#7c3aed',
                  backgroundColor: activeCable === p.id ? '#7c3aed' : 'transparent',
                  color:           activeCable === p.id ? '#fff' : '#7c3aed',
                }}>
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Airtime note */}
        {activeTab === 'airtime' && (
          <div className="card p-5 text-center space-y-2">
            <Phone className="w-10 h-10 mx-auto text-[#d97706]"/>
            <p className="font-bold text-[#0a0a0a]">Airtime Top-up</p>
            <p className="text-xs text-[#888] max-w-xs mx-auto">
              Airtime has no fixed plans. Students enter a custom amount (min ₦50). Supported networks: MTN, GLO, Airtel, 9mobile.
            </p>
            <div className="flex justify-center gap-2 flex-wrap pt-2">
              {NETWORKS.map(net => (
                <span key={net} className="px-3 py-1 rounded-full text-[10px] font-black"
                  style={{ backgroundColor: NETWORK_COLORS[net] + '20', color: NETWORK_COLORS[net] }}>
                  {net}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && activeTab !== 'airtime' && (
          <div className="flex flex-col items-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: currentTab.color }}/>
            <p className="text-sm text-[#aaa]">Loading {currentTab.label} from Bigisub...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card p-4 text-center space-y-1">
            <p className="text-[#b91c1c] text-sm font-semibold">{error}</p>
            <p className="text-xs text-[#aaa]">Check your Bigisub API token in Admin → Bigisub Settings</p>
          </div>
        )}

        {/* Data plans table */}
        {activeTab === 'data' && !loading && !error && data.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 bg-[#fafafa] border-b border-[#f0f0f0]">
              <p className="text-xs font-bold text-[#555]">{data.length} {activeNet} data plans</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#f9f9f9] text-[#888]">
                    <th className="text-left px-4 py-2.5 font-bold">Plan</th>
                    <th className="text-left px-4 py-2.5 font-bold hidden sm:table-cell">Type</th>
                    <th className="text-left px-4 py-2.5 font-bold hidden sm:table-cell">Validity</th>
                    <th className="text-right px-4 py-2.5 font-bold">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((plan, i) => {
                    const price    = getPrice(plan)
                    const validity = plan.month_validate || plan.validity || '—'
                    return (
                      <tr key={plan.id || i} className={i % 2 === 0 ? '' : 'bg-[#fafafa]'}>
                        <td className="px-4 py-2.5 font-medium text-[#0a0a0a]">{plan.name}</td>
                        <td className="px-4 py-2.5 text-[#888] hidden sm:table-cell">{plan.data_type || plan.plan || '—'}</td>
                        <td className="px-4 py-2.5 text-[#888] hidden sm:table-cell">{validity}</td>
                        <td className="px-4 py-2.5 text-right font-black" style={{ color: NETWORK_COLORS[activeNet] }}>
                          {price !== null ? `₦${Number(price).toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cable plans table */}
        {activeTab === 'cable' && !loading && !error && data.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 bg-[#fafafa] border-b border-[#f0f0f0]">
              <p className="text-xs font-bold text-[#555]">{data.length} {CABLE_PROVIDERS.find(p=>p.id===activeCable)?.name} bouquets</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#f9f9f9] text-[#888]">
                    <th className="text-left px-4 py-2.5 font-bold">Bouquet</th>
                    <th className="text-right px-4 py-2.5 font-bold">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((plan, i) => {
                    const price = getPrice(plan)
                    return (
                      <tr key={plan.id || i} className={i % 2 === 0 ? '' : 'bg-[#fafafa]'}>
                        <td className="px-4 py-2.5 font-medium text-[#0a0a0a]">
                          <div>{plan.name}</div>
                          {plan.description && <div className="text-[10px] text-[#aaa]">{plan.description}</div>}
                        </td>
                        <td className="px-4 py-2.5 text-right font-black text-[#7c3aed]">
                          {price !== null ? `₦${Number(price).toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grouped billers (electricity / betting / education / ISP) */}
        {['electricity','betting','education','isp'].includes(activeTab) && !loading && !error && data.length > 0 && (() => {
          const groups = grouped(activeTab)!
          return (
            <div className="space-y-3">
              <p className="text-xs text-[#888]">{data.length} option{data.length !== 1 ? 's' : ''} available</p>
              {Object.entries(groups).map(([groupName, items]) => {
                const isOpen = expanded.has(groupName)
                return (
                  <div key={groupName} className="card overflow-hidden">
                    <button onClick={() => toggle(groupName)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: currentTab.color + '15' }}>
                        <currentTab.icon className="w-4 h-4" style={{ color: currentTab.color }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#0a0a0a] truncate">{groupName}</p>
                        <p className="text-[10px] text-[#aaa]">{items.length} option{items.length!==1?'s':''}</p>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-[#aaa]"/> : <ChevronDown className="w-4 h-4 text-[#aaa]"/>}
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#f0f0f0]">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-[#fafafa] text-[#888]">
                              <th className="text-left px-4 py-2 font-bold">Name</th>
                              <th className="text-right px-4 py-2 font-bold">Price / ID</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, i) => {
                              const price = getPrice(item)
                              return (
                                <tr key={item.id || i} className={i%2===0?'':'bg-[#fafafa]'}>
                                  <td className="px-4 py-2.5 text-[#0a0a0a] font-medium">{item.name || item.exam_name || item.service_name || item.id}</td>
                                  <td className="px-4 py-2.5 text-right font-mono font-black" style={{color:currentTab.color}}>
                                    {price !== null ? `₦${Number(price).toLocaleString()}` : `ID: ${item.id}`}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* Empty state */}
        {!loading && !error && activeTab !== 'airtime' && data.length === 0 && (
          <div className="card p-8 text-center">
            <currentTab.icon className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: currentTab.color }}/>
            <p className="text-sm text-[#aaa]">No data returned from Bigisub</p>
            <p className="text-[10px] text-[#ccc] mt-1">Make sure your API token is set correctly</p>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
