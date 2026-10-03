'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { Save, Loader2, CheckCircle2, Eye, EyeOff, RefreshCw, Zap, AlertCircle, ExternalLink } from 'lucide-react'

type Setting = { key:string; value:string; label:string; is_secret:boolean; has_value:boolean }

const FLW_KEYS = [
  { key:'flw_public_key',     label:'Public Key',          desc:'Starts with FLWPUBK_TEST_ or FLWPUBK_LIVE_', is_secret:false },
  { key:'flw_secret_key',     label:'Secret Key',          desc:'Starts with FLWSECK_TEST_ or FLWSECK_LIVE_', is_secret:true  },
  { key:'flw_encryption_key', label:'Encryption Key',      desc:'10-character string from your FLW dashboard', is_secret:true  },
  { key:'flw_webhook_hash',   label:'Webhook Hash Secret', desc:'Set this in FLW dashboard under Webhooks',    is_secret:true  },
]

export default function FlutterwaveSettingsPage() {
  const [settings,  setSettings]  = useState<Record<string,Setting>>({})
  const [edits,     setEdits]     = useState<Record<string,string>>({})
  const [revealed,  setRevealed]  = useState<Record<string,string>>({})
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [testing,   setTesting]   = useState(false)
  const [toast,     setToast]     = useState('')
  const [toastType, setToastType] = useState<'ok'|'err'>('ok')
  const [revealing, setRevealing] = useState<string|null>(null)
  const [showKeys,  setShowKeys]  = useState<Record<string,boolean>>({})

  const showToast = (m:string, type:'ok'|'err'='ok') => {
    setToast(m); setToastType(type); setTimeout(()=>setToast(''), 4000)
  }

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/settings')
    const d = await r.json()
    const map: Record<string,Setting> = {}
    for (const s of (d.data||[]).filter((s:any) => s.category === 'flutterwave')) map[s.key] = s
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

  const getValue = (key: string, is_secret: boolean) => {
    if (edits[key] !== undefined) return edits[key]
    if (revealed[key] !== undefined) return revealed[key]
    const s = settings[key]
    return is_secret && s?.has_value ? '••••••••' : (s?.value || '')
  }

  const saveAll = async () => {
    if (!Object.keys(edits).length) { showToast('No changes to save'); return }
    setSaving(true)
    const r = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ settings: edits }),
    })
    setSaving(false)
    if (r.ok) { setEdits({}); setRevealed({}); load(); showToast('Saved!') }
    else showToast('Save failed', 'err')
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      const r = await fetch('/api/admin/flutterwave/bill-categories')
      const d = await r.json()
      if (d.categories) showToast(`✅ Connected! ${d.categories.length} bill categories found.`)
      else showToast(`❌ ${d.error || 'Connection failed'}`, 'err')
    } catch {
      showToast('❌ Connection failed', 'err')
    }
    setTesting(false)
  }

  const isLive = Object.values(settings).some(s => s.value?.includes('LIVE'))

  return (
    <AdminShell>
      <div className="max-w-xl mx-auto p-4 space-y-4">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-lg ${toastType==='ok'?'bg-[#1a6b3a]':'bg-[#b91c1c]'}`}>
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0a0a0a]">Flutterwave Settings</h1>
            <p className="text-sm text-[#888] mt-0.5">API credentials for wallet & payments</p>
          </div>
          <a href="https://dashboard.flutterwave.com" target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#1e3a8a] font-semibold">
            Dashboard <ExternalLink className="w-3.5 h-3.5"/>
          </a>
        </div>

        {/* Live/Test indicator */}
        {!loading && Object.keys(settings).length > 0 && (
          <div className={`rounded-xl p-3 flex items-center gap-2 ${isLive ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-amber-400'}`}/>
            <span className={`text-xs font-semibold ${isLive ? 'text-green-800' : 'text-amber-800'}`}>
              {isLive ? 'Live Mode — Real money will be processed' : 'Test Mode — No real money processed'}
            </span>
          </div>
        )}

        {/* Webhook URL */}
        <div className="card p-4">
          <p className="text-xs font-bold text-[#888] uppercase tracking-wide mb-2">Webhook URL</p>
          <p className="text-xs text-[#555] mb-2">Add this URL in your Flutterwave dashboard → Settings → Webhooks:</p>
          <div className="bg-[#f5f5f5] rounded-lg px-3 py-2 font-mono text-xs text-[#333] break-all select-all">
            https://mouau-rose.vercel.app/api/webhook/flutterwave
          </div>
        </div>

        {/* API Keys */}
        <div className="card p-4 space-y-4">
          <p className="text-xs font-bold text-[#888] uppercase tracking-wide">API Keys</p>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#aaa]"/></div>
          ) : (
            FLW_KEYS.map(({ key, label, desc, is_secret }) => {
              const val = getValue(key, is_secret)
              const isRevealing = revealing === key
              return (
                <div key={key}>
                  <label className="text-xs font-semibold text-[#333]">{label}</label>
                  <p className="text-[10px] text-[#aaa] mb-1">{desc}</p>
                  <div className="relative">
                    <input
                      type={is_secret && !showKeys[key] ? 'password' : 'text'}
                      value={val}
                      onChange={e => setEdits(p => ({...p,[key]: e.target.value}))}
                      placeholder={`Enter ${label}`}
                      className="input pr-10 text-sm font-mono w-full"
                    />
                    {is_secret && (
                      <button
                        onClick={() => {
                          if (settings[key]?.has_value && !revealed[key] && !edits[key]) reveal(key)
                          else setShowKeys(p => ({...p,[key]: !p[key]}))
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#aaa]"
                      >
                        {isRevealing
                          ? <Loader2 className="w-4 h-4 animate-spin"/>
                          : showKeys[key] ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>
                        }
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={testConnection}
            disabled={testing || loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1e3a8a] text-[#1e3a8a] font-semibold text-sm"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4"/>}
            Test Connection
          </button>
          <button
            onClick={saveAll}
            disabled={saving || loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1e3a8a] text-white font-semibold text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
            Save Keys
          </button>
        </div>

        {/* Instructions */}
        <div className="rounded-xl p-4 bg-blue-50 border border-blue-200 space-y-2">
          <p className="text-xs font-bold text-blue-800">Setup Steps</p>
          {[
            'Log in to dashboard.flutterwave.com',
            'Go to Settings → API Keys → Copy all 3 keys above',
            'Go to Settings → Webhooks → Add the webhook URL above',
            'Set a Webhook Hash and paste it above',
            'Click Save, then Test Connection',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
              <p className="text-xs text-blue-800">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  )
}
