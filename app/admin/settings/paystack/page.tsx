'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { Save, Loader2, Eye, EyeOff, CheckCircle2, ToggleLeft, ToggleRight, Zap, AlertCircle } from 'lucide-react'

type Setting = { key: string; value: string; label: string; is_secret: boolean; has_value: boolean }

const PSK_KEYS = [
  { key: 'paystack_secret_key',  label: 'Secret Key',          desc: 'Starts with sk_test_ or sk_live_', is_secret: true  },
  { key: 'paystack_public_key',  label: 'Public Key',          desc: 'Starts with pk_test_ or pk_live_', is_secret: false },
  { key: 'paystack_webhook_secret', label: 'Webhook Secret',   desc: 'Set in Paystack dashboard → API → Webhooks → Secret', is_secret: true },
]

const PROVIDERS = [
  { id: 'flutterwave', label: 'Flutterwave', desc: 'Current default — virtual accounts, transfers' },
  { id: 'paystack',    label: 'Paystack',    desc: 'DVA via Paystack Split / Dedicated Nuban' },
]

const SERVICES = [
  { key: 'service_airtime',     label: 'Airtime',      desc: 'Buy airtime via Bigisub' },
  { key: 'service_data',        label: 'Data',         desc: 'Buy data bundles via Bigisub' },
  { key: 'service_cable',       label: 'Cable TV',     desc: 'DSTV, GOtv, Startimes' },
  { key: 'service_electricity', label: 'Electricity',  desc: 'Prepaid meter top-up' },
  { key: 'service_betting',     label: 'Betting',      desc: 'Bet9ja, Sportybet, etc.' },
  { key: 'service_education',   label: 'Education Pins', desc: 'WAEC, NECO, JAMB result checkers' },
  { key: 'service_isp',         label: 'ISP / Internet', desc: 'Smile, Spectranet' },
  { key: 'service_recharge_pin',label: 'Recharge Pins', desc: 'Bulk recharge cards' },
  { key: 'service_sms',         label: 'Bulk SMS',     desc: 'Send bulk SMS' },
  { key: 'service_transfer',    label: 'Bank Transfer', desc: 'Send money to bank accounts' },
  { key: 'service_fund',        label: 'Wallet Funding', desc: 'Fund via virtual account' },
]

export default function PaystackSettingsPage() {
  const [settings,  setSettings]  = useState<Record<string, Setting>>({})
  const [edits,     setEdits]     = useState<Record<string, string>>({})
  const [revealed,  setRevealed]  = useState<Record<string, string>>({})
  const [showKey,   setShowKey]   = useState<Record<string, boolean>>({})
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [testing,   setTesting]   = useState(false)
  const [toast,     setToast]     = useState('')
  const [toastType, setToastType] = useState<'ok'|'err'>('ok')
  const [provider,  setProvider]  = useState('flutterwave')
  const [services,  setServices]  = useState<Record<string, boolean>>({})
  const [savingServices, setSavingServices] = useState(false)
  const [revealing, setRevealing] = useState<string|null>(null)

  const showToast = (m: string, type: 'ok'|'err' = 'ok') => {
    setToast(m); setToastType(type); setTimeout(() => setToast(''), 4000)
  }

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/settings')
    const d = await r.json()
    const map: Record<string, Setting> = {}
    for (const s of (d.data || [])) map[s.key] = s
    setSettings(map)

    // Provider
    setProvider(map['payment_provider']?.value || 'flutterwave')

    // Services
    const svc: Record<string, boolean> = {}
    for (const s of SERVICES) {
      const val = map[s.key]?.value
      svc[s.key] = val === undefined ? true : val !== 'false'
    }
    setServices(svc)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const reveal = async (key: string) => {
    if (revealed[key]) { setRevealed(p => { const n = {...p}; delete n[key]; return n }); return }
    setRevealing(key)
    const r = await fetch(`/api/admin/settings/reveal?key=${key}`)
    const d = await r.json()
    setRevealing(null)
    if (d.value !== undefined) setRevealed(p => ({...p, [key]: d.value}))
  }

  const getValue = (key: string, isSecret: boolean) => {
    if (edits[key] !== undefined) return edits[key]
    if (revealed[key] !== undefined) return revealed[key]
    const s = settings[key]
    return isSecret && s?.has_value ? '••••••••' : (s?.value || '')
  }

  const saveKeys = async () => {
    if (!Object.keys(edits).length) { showToast('No changes to save'); return }
    setSaving(true)
    const r = await fetch('/api/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: edits }),
    })
    setSaving(false)
    if (r.ok) { setEdits({}); setRevealed({}); showToast('Paystack keys saved!'); load() }
    else showToast('Save failed', 'err')
  }

  const saveProvider = async (p: string) => {
    setProvider(p)
    await fetch('/api/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { payment_provider: p } }),
    })
    showToast(`Active provider set to ${p === 'paystack' ? 'Paystack' : 'Flutterwave'}`)
  }

  const toggleService = async (key: string) => {
    const next = !services[key]
    setServices(p => ({...p, [key]: next}))
    await fetch('/api/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { [key]: String(next) } }),
    })
  }

  const saveAllServices = async () => {
    setSavingServices(true)
    const body: Record<string, string> = {}
    for (const s of SERVICES) body[s.key] = String(services[s.key])
    await fetch('/api/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: body }),
    })
    setSavingServices(false)
    showToast('Service settings saved!')
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      const r = await fetch('/api/admin/paystack/test')
      const d = await r.json()
      showToast(d.ok ? `✅ Connected — ${d.business}` : `❌ ${d.error}`, d.ok ? 'ok' : 'err')
    } catch (e: any) { showToast('❌ ' + e.message, 'err') }
    setTesting(false)
  }

  return (
    <AdminShell>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Header */}
        <div>
          <h1 className="text-xl font-black text-[#0a0a0a]">Payment Settings</h1>
          <p className="text-sm text-[#888] mt-0.5">Paystack keys, active provider & service toggles</p>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-lg
            ${toastType === 'ok' ? 'bg-[#1a6b3a]' : 'bg-red-600'}`}>
            {toast}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#aaa]"/></div>
        ) : (<>

          {/* ── Active Provider ─────────────────────────────── */}
          <div className="card p-5 space-y-3">
            <p className="text-xs font-black text-[#888] uppercase tracking-wider">Active Payment Provider</p>
            <p className="text-xs text-[#666]">This controls which API is used for wallet funding and bank transfers.</p>
            <div className="space-y-2">
              {PROVIDERS.map(p => (
                <button key={p.id} onClick={() => saveProvider(p.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all
                    ${provider === p.id ? 'border-[#1a6b3a] bg-[#f0fdf4]' : 'border-[#e8e8e8] bg-white hover:border-[#bbb]'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${provider === p.id ? 'border-[#1a6b3a]' : 'border-[#bbb]'}`}>
                    {provider === p.id && <div className="w-2 h-2 rounded-full bg-[#1a6b3a]"/>}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${provider === p.id ? 'text-[#1a6b3a]' : 'text-[#0a0a0a]'}`}>{p.label}</p>
                    <p className="text-xs text-[#888]">{p.desc}</p>
                  </div>
                  {provider === p.id && <CheckCircle2 className="w-4 h-4 text-[#1a6b3a] ml-auto flex-shrink-0"/>}
                </button>
              ))}
            </div>
          </div>

          {/* ── Paystack API Keys ────────────────────────────── */}
          <div className="card p-5 space-y-4">
            <p className="text-xs font-black text-[#888] uppercase tracking-wider">Paystack API Keys</p>
            {PSK_KEYS.map(k => (
              <div key={k.key}>
                <label className="block text-xs font-semibold text-[#444] mb-1">{k.label}</label>
                <p className="text-[10px] text-[#aaa] mb-1.5">{k.desc}</p>
                <div className="relative">
                  <input
                    type={k.is_secret && !showKey[k.key] ? 'password' : 'text'}
                    value={getValue(k.key, k.is_secret)}
                    onChange={e => setEdits(p => ({...p, [k.key]: e.target.value}))}
                    onFocus={() => { if (k.is_secret && settings[k.key]?.has_value && !revealed[k.key]) reveal(k.key) }}
                    placeholder={`Enter ${k.label}`}
                    className="input-field pr-10 text-sm"
                  />
                  {k.is_secret && (
                    <button type="button" onClick={() => setShowKey(p => ({...p, [k.key]: !p[k.key]}))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888]">
                      {showKey[k.key] ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={saveKeys} disabled={saving}
                className="flex-1 py-2.5 bg-[#1a6b3a] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                Save Keys
              </button>
              <button onClick={testConnection} disabled={testing}
                className="flex-1 py-2.5 bg-[#f5f5f0] text-[#0a0a0a] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {testing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4"/>}
                Test API
              </button>
            </div>
            <div className="bg-[#fff8f0] rounded-xl p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"/>
              <div className="text-xs text-amber-700 space-y-0.5">
                <p className="font-semibold">Webhook URL for Paystack</p>
                <p className="font-mono text-[10px] break-all">https://mouau-aid.vercel.app/api/webhook/paystack</p>
                <p>Add this in your Paystack dashboard → Settings → API Keys & Webhooks</p>
              </div>
            </div>
          </div>

          {/* ── Service Toggles ──────────────────────────────── */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-[#888] uppercase tracking-wider">Service Toggles</p>
              <button onClick={saveAllServices} disabled={savingServices}
                className="text-xs font-semibold text-[#1a6b3a] flex items-center gap-1 disabled:opacity-60">
                {savingServices ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>}
                Save All
              </button>
            </div>
            <p className="text-xs text-[#666]">Disable a service to hide it from students and block API calls.</p>
            <div className="space-y-2">
              {SERVICES.map(s => (
                <div key={s.key} className="flex items-center justify-between py-2.5 border-b border-[#f0f0f0] last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-[#0a0a0a]">{s.label}</p>
                    <p className="text-[11px] text-[#999]">{s.desc}</p>
                  </div>
                  <button onClick={() => toggleService(s.key)} className="ml-3 flex-shrink-0">
                    {services[s.key]
                      ? <ToggleRight className="w-8 h-8 text-[#1a6b3a]"/>
                      : <ToggleLeft  className="w-8 h-8 text-[#bbb]"/>}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </>)}
      </div>
    </AdminShell>
  )
}
