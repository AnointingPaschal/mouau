'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { Save, Loader2, CheckCircle2, Eye, EyeOff, ExternalLink, Zap, AlertCircle, RefreshCw } from 'lucide-react'

const BIGI_KEYS = [
  {
    key:       'bigisub_api_token',
    label:     'API Token',
    desc:      'Your Bigisub API token. Get it from bigisub.ng → Account → API Settings.',
    is_secret: true,
    placeholder: 'Enter your Bigisub API token',
  },
  {
    key:       'bigisub_pin',
    label:     'Transaction PIN',
    desc:      'Your 4-digit Bigisub transaction PIN. Set in bigisub.ng → Profile → Security.',
    is_secret: true,
    placeholder: '4-digit PIN e.g. 1234',
  },
]

export default function BigisubSettingsPage() {
  const [settings,  setSettings]  = useState<Record<string, any>>({})
  const [edits,     setEdits]     = useState<Record<string,string>>({})
  const [revealed,  setRevealed]  = useState<Record<string,string>>({})
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [testing,   setTesting]   = useState(false)
  const [toast,     setToast]     = useState('')
  const [toastType, setToastType] = useState<'ok'|'err'>('ok')
  const [revealing, setRevealing] = useState<string|null>(null)
  const [showKeys,  setShowKeys]  = useState<Record<string,boolean>>({})
  const [balance,   setBalance]   = useState<string|null>(null)

  const showToast = (m:string, type:'ok'|'err'='ok') => {
    setToast(m); setToastType(type); setTimeout(()=>setToast(''), 4500)
  }

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/settings')
    const d = await r.json()
    const map: Record<string,any> = {}
    for (const s of (d.data || [])) map[s.key] = s
    setSettings(map)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const reveal = async (key: string) => {
    if (revealed[key]) { setRevealed(p => { const n={...p}; delete n[key]; return n }); return }
    setRevealing(key)
    const r = await fetch(`/api/admin/settings/reveal?key=${key}`)
    const d = await r.json()
    setRevealing(null)
    if (d.value !== undefined) setRevealed(p => ({...p,[key]: d.value}))
  }

  const getValue = (key: string) => {
    if (edits[key] !== undefined) return edits[key]
    if (revealed[key] !== undefined) return revealed[key]
    const s = settings[key]
    return s?.is_secret && s?.has_value ? '••••••••' : (s?.value || '')
  }

  const saveAll = async () => {
    if (!Object.keys(edits).length) { showToast('No changes to save'); return }
    setSaving(true)
    const r = await fetch('/api/admin/settings', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ settings: edits }),
    })
    setSaving(false)
    if (r.ok) { setEdits({}); setRevealed({}); load(); showToast('✅ Bigisub API token saved!') }
    else showToast('Save failed', 'err')
  }

  const testConnection = async () => {
    setTesting(true); setBalance(null)
    try {
      const r = await fetch('/api/admin/bigisub/balance')
      const d = await r.json()
      if (d.error) {
        showToast(`❌ ${d.error}`, 'err')
      } else {
        // Handle various response shapes from Bigisub wallet endpoint
        const raw = d.balance
        const bal = typeof raw === 'object'
          ? (raw?.balance ?? raw?.Balance ?? raw?.wallet_balance ?? raw?.data?.balance ?? JSON.stringify(raw))
          : String(raw ?? '—')
        setBalance(bal)
        showToast(`✅ Connected! Balance: ₦${bal}`)
      }
    } catch (e: any) {
      showToast(`❌ ${e.message}`, 'err')
    }
    setTesting(false)
  }

  const tokenSet = settings['bigisub_api_token']?.has_value
  const pinSet   = settings['bigisub_pin']?.has_value

  return (
    <AdminShell>
      <div className="max-w-xl mx-auto p-4 pb-24 space-y-5">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl text-white text-sm font-semibold shadow-xl ${toastType==='ok'?'bg-[#1a6b3a]':'bg-[#b91c1c]'}`}>
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
            <h1 className="font-black text-[#0a0a0a] text-2xl">Bigisub Settings</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">API token for airtime, data & bills</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 rounded-xl border border-[#e8e8e8] hover:bg-[#f9f9f7]">
              <RefreshCw className="w-4 h-4 text-[#6b6b6b]"/>
            </button>
            <button onClick={saveAll} disabled={saving || !Object.keys(edits).length}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white ${saving||!Object.keys(edits).length?'bg-[#1a6b3a]/40':'bg-[#1a6b3a] hover:bg-[#145530]'}`}>
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> Saving...</> : <><Save className="w-3.5 h-3.5"/> Save</>}
            </button>
          </div>
        </div>

        {/* Status banner */}
        {!loading && (
          <div className={`rounded-2xl p-4 border ${tokenSet && pinSet ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tokenSet && pinSet ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`}/>
              <div className="flex-1">
                <p className={`text-xs font-bold ${tokenSet && pinSet ? 'text-green-800' : 'text-amber-800'}`}>
                  {tokenSet && pinSet ? 'API Token & PIN configured' : !tokenSet ? 'API Token not set' : 'Transaction PIN not set'}
                </p>
              </div>
              {tokenSet && pinSet && (
                <button onClick={testConnection} disabled={testing}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-[#1a6b3a] bg-[#1a6b3a]/10 px-3 py-1.5 rounded-full hover:bg-[#1a6b3a]/20 transition-colors disabled:opacity-50">
                  <Zap className="w-3 h-3"/>
                  {testing ? <><Loader2 className="w-3 h-3 animate-spin"/> Testing...</> : 'Test API'}
                </button>
              )}
            </div>
            {/* Balance display */}
            {balance && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-[10px] text-green-700 uppercase tracking-widest font-bold mb-0.5">Bigisub Wallet Balance</p>
                <p className="text-2xl font-black text-[#1a6b3a]">₦{parseFloat(balance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-green-600 mt-0.5">Live from bigisub.ng</p>
              </div>
            )}
          </div>
        )}

        {/* Token input */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-[#888] uppercase tracking-widest">API Token</p>
            <a href="https://bigisub.ng" target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-[#1e3a8a] font-semibold">
              bigisub.ng <ExternalLink className="w-3 h-3"/>
            </a>
          </div>

          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
          ) : BIGI_KEYS.map(({ key, label, desc, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-bold text-[#333] mb-1 block">{label}</label>
              <p className="text-[10px] text-[#aaa] mb-2">{desc}</p>
              <div className="relative">
                <input
                  type={showKeys[key] ? 'text' : 'password'}
                  value={getValue(key)}
                  onChange={e => setEdits(p => ({...p,[key]: e.target.value}))}
                  onFocus={() => { if (settings[key]?.has_value && !revealed[key] && !edits[key]) reveal(key) }}
                  placeholder={placeholder}
                  className="input pr-10 text-sm font-mono w-full"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (settings[key]?.has_value && !revealed[key] && !edits[key]) reveal(key)
                    else setShowKeys(p => ({...p, [key]: !p[key]}))
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#aaa] hover:text-[#555]">
                  {revealing === key
                    ? <Loader2 className="w-4 h-4 animate-spin"/>
                    : showKeys[key] ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
              {edits[key] !== undefined && (
                <p className="text-[10px] text-amber-600 mt-1 font-semibold">⚠️ Unsaved changes — click Save</p>
              )}
              {!settings[key]?.has_value && !edits[key] && (
                <p className="text-[10px] text-amber-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3"/> Not configured yet
                </p>
              )}
            </div>
          ))}
        </div>

        {/* How to get token */}
        <div className="card p-4 bg-[#f9f9f7]">
          <p className="text-xs font-bold text-[#0a0a0a] mb-3">How to get your Bigisub API token</p>
          <ol className="space-y-2">
            {[
              'Create an account at bigisub.ng',
              'Verify your account and log in',
              'Go to Account Settings → API Token',
              'Copy the token and paste it above',
              'Click Save, then Test API to confirm it works',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[11px] text-[#555]">
                <span className="w-4 h-4 rounded-full bg-[#1a6b3a] text-white flex items-center justify-center flex-shrink-0 font-bold text-[9px] mt-0.5">
                  {i+1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* What Bigisub powers */}
        <div className="card p-4">
          <p className="text-xs font-bold text-[#0a0a0a] mb-2">What this API key powers</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Airtime Top-up',   color: '#d97706' },
              { label: 'Data Bundles',     color: '#1e3a8a' },
              { label: 'Cable TV',         color: '#7c3aed' },
              { label: 'Electricity',      color: '#d97706' },
              { label: 'Betting Wallets',  color: '#059669' },
              { label: 'Education (WAEC)', color: '#1e3a8a' },
              { label: 'Internet (ISP)',   color: '#0891b2' },
              { label: 'Bulk SMS',         color: '#b91c1c' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2 rounded-xl p-2" style={{backgroundColor: color + '10'}}>
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: color}}/>
                <span className="text-[11px] font-semibold text-[#333]">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#aaa] mt-3">
            Flutterwave remains active for wallet funding & bank transfers. Bigisub handles all VTU & bills.
          </p>
        </div>
      </div>
    </AdminShell>
  )
}
