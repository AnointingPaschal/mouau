'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { Save, Loader2, CheckCircle2, Eye, EyeOff, RefreshCw, Wifi, AlertCircle } from 'lucide-react'

type Setting = { key:string; value:string; category:string; label:string; description:string; is_secret:boolean; has_value:boolean }

const CAT_LABELS: Record<string,string> = {
  firebase_web:   '🔥 Firebase Web App',
  firebase_admin: '🔑 Firebase Admin SDK',
  gmail:          '📧 Gmail SMTP',
}

export default function NotificationSettingsPage() {
  const [settings,  setSettings]  = useState<Setting[]>([])
  const [edits,     setEdits]     = useState<Record<string,string>>({})
  const [revealed,  setRevealed]  = useState<Record<string,string>>({})
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [revealing, setRevealing] = useState<string|null>(null)
  const [toast,     setToast]     = useState('')
  const [toastType, setToastType] = useState<'ok'|'err'>('ok')
  const [testing,   setTesting]   = useState<string|null>(null)

  const showToast = (m:string, type:'ok'|'err'='ok') => { setToast(m); setToastType(type); setTimeout(()=>setToast(''),4000) }

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/settings')
    const d = await r.json()
    setSettings((d.data||[]).filter((s:Setting) => ['firebase_web','firebase_admin','gmail'].includes(s.category)))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const grouped = settings.reduce((acc,s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {} as Record<string,Setting[]>)

  const reveal = async (key: string) => {
    if (revealed[key]) { setRevealed(p => { const n={...p}; delete n[key]; return n }); return }
    setRevealing(key)
    const r = await fetch(`/api/admin/settings/reveal?key=${key}`)
    const d = await r.json()
    setRevealing(null)
    if (d.value !== undefined) setRevealed(p => ({...p, [key]: d.value}))
  }

  const getValue = (s: Setting) => {
    if (edits[s.key] !== undefined) return edits[s.key]
    if (revealed[s.key] !== undefined) return revealed[s.key]
    return s.is_secret && s.has_value ? '••••••••' : (s.value || '')
  }

  const saveAll = async () => {
    if (!Object.keys(edits).length) { showToast('No changes to save'); return }
    setSaving(true)
    const r = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: edits })
    })
    setSaving(false)
    if (r.ok) { setEdits({}); setRevealed({}); showToast('Settings saved!'); load() }
    else showToast('Save failed', 'err')
  }

  const testPush = async () => {
    setTesting('push')
    try {
      const r = await fetch('/api/push/send', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ testMode: true }) })
      const d = await r.json()
      showToast(d.ok ? '✅ Firebase Admin SDK is working!' : `❌ ${d.error}`, d.ok ? 'ok' : 'err')
    } catch(e:any) { showToast('❌ ' + e.message, 'err') }
    setTesting(null)
  }

  const testEmail = async () => {
    const gmailSetting = settings.find(s => s.key === 'gmail_user')
    const toAddr = edits['gmail_user'] || revealed['gmail_user'] || gmailSetting?.value || ''
    if (!toAddr || toAddr === '••••••••') { showToast('Set Gmail address first', 'err'); return }
    setTesting('email')
    const r = await fetch('/api/email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: toAddr, subject: 'Test Email — MOUAU FreshStart',
        body: 'Your Gmail SMTP is configured correctly and emails are sending successfully from <strong>MOUAU FreshStart</strong>.',
        type: 'success'
      })
    })
    const d = await r.json()
    showToast(d.ok ? '✅ Test email sent! Check your inbox.' : `❌ ${d.error}`, d.ok ? 'ok' : 'err')
    setTesting(null)
  }

  return (
    <AdminShell>
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-fade-in ${toastType==='ok'?'bg-[#0a0a0a] text-white':'bg-red-600 text-white'}`}>
          {toastType==='ok' ? <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/> : <AlertCircle className="w-3.5 h-3.5"/>}
          {toast}
        </div>
      )}

      <div className="p-4 w-full pb-24 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
            <h1 className="font-black text-[#0a0a0a] text-2xl">Notification Settings</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">Firebase FCM & Gmail SMTP credentials</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 rounded-xl border border-[#e8e8e8] hover:bg-[#f9f9f7]"><RefreshCw className="w-4 h-4 text-[#6b6b6b]"/></button>
            <button onClick={saveAll} disabled={saving||!Object.keys(edits).length}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white ${saving||!Object.keys(edits).length?'bg-[#1a6b3a]/40 cursor-not-allowed':'bg-[#1a6b3a] hover:bg-[#145530]'}`}>
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> Saving...</> : <><Save className="w-3.5 h-3.5"/> Save All</>}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : Object.entries(CAT_LABELS).map(([cat, catLabel]) => {
          const items = grouped[cat] || []
          if (!items.length) return null
          return (
            <div key={cat} className="card overflow-hidden">
              <div className="px-4 py-3 bg-[#f9f9f7] border-b border-[#e8e8e8] flex items-center justify-between">
                <h2 className="font-black text-[#0a0a0a] text-sm">{catLabel}</h2>
                {cat === 'firebase_admin' && (
                  <button onClick={testPush} disabled={!!testing}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a6b3a] bg-[#1a6b3a]/10 px-3 py-1.5 rounded-full hover:bg-[#1a6b3a]/20 transition-colors">
                    <Wifi className="w-3 h-3"/>{testing==='push'?'Testing...':'Test Push'}
                  </button>
                )}
                {cat === 'gmail' && (
                  <button onClick={testEmail} disabled={!!testing}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
                    <Wifi className="w-3 h-3"/>{testing==='email'?'Sending...':'Test Email'}
                  </button>
                )}
              </div>
              <div className="divide-y divide-[#f5f5f5]">
                {items.map(s => (
                  <div key={s.key} className="px-4 py-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-[#0a0a0a]">{s.label}</label>
                      <div className="flex items-center gap-2">
                        {edits[s.key] !== undefined && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">Modified</span>}
                        {s.is_secret && (
                          <button onClick={() => reveal(s.key)} disabled={revealing === s.key}
                            className="text-[#aaa] hover:text-[#6b6b6b] transition-colors">
                            {revealing === s.key ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : revealed[s.key] ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                          </button>
                        )}
                      </div>
                    </div>
                    {s.key === 'firebase_admin_private_key' ? (
                      <textarea rows={4} value={getValue(s)}
                        onChange={e => setEdits(p=>({...p,[s.key]:e.target.value}))}
                        placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                        className="input w-full resize-none text-xs font-mono leading-relaxed"
                        onFocus={() => { if (!edits[s.key] && !revealed[s.key]) reveal(s.key) }}/>
                    ) : (
                      <input
                        type={s.is_secret && !revealed[s.key] && !edits[s.key] ? 'password' : 'text'}
                        value={getValue(s)}
                        onChange={e => setEdits(p=>({...p,[s.key]:e.target.value}))}
                        onFocus={() => { if (s.is_secret && !revealed[s.key] && !edits[s.key]) reveal(s.key) }}
                        className="input w-full text-sm" placeholder={s.description}/>
                    )}
                    {s.description && <p className="text-[10px] text-[#aaa] mt-1">{s.description}</p>}
                    {s.is_secret && !s.has_value && <p className="text-[10px] text-amber-600 mt-1 font-semibold">⚠️ Not configured yet</p>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div className="card p-4 bg-[#f9f9f7]">
          <p className="text-xs font-bold text-[#0a0a0a] mb-2">📌 Quick Setup Guide</p>
          <div className="space-y-1.5 text-[11px] text-[#6b6b6b] leading-relaxed">
            <p><strong className="text-[#0a0a0a]">Gmail App Password:</strong> myaccount.google.com → Security → 2-Step Verification → App passwords → Mail → Generate</p>
            <p><strong className="text-[#0a0a0a]">Firebase VAPID Key:</strong> Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Generate key pair</p>
            <p><strong className="text-[#0a0a0a]">Firebase Private Key:</strong> Firebase Console → Project Settings → Service Accounts → Generate private key → paste private_key value</p>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
