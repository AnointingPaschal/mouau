'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { Save, Loader2, CheckCircle2, Eye, EyeOff, RefreshCw, Wifi } from 'lucide-react'

type Setting = { key:string; value:string; category:string; label:string; description:string; is_secret:boolean; has_value:boolean }

const CATEGORY_LABELS:Record<string,string> = {
  firebase_web:   '🔥 Firebase Web App',
  firebase_admin: '🔑 Firebase Admin SDK',
  gmail:          '📧 Gmail SMTP',
  general:        '⚙️ General',
}

export default function AdminSettingsPage() {
  const [settings,  setSettings]  = useState<Setting[]>([])
  const [edits,     setEdits]     = useState<Record<string,string>>({})
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState('')
  const [shown,     setShown]     = useState<Record<string,boolean>>({})
  const [testing,   setTesting]   = useState<'idle'|'push'|'email'>('idle')

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3500) }

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/settings')
    const d = await r.json()
    setSettings(d.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const grouped = settings.reduce((acc,s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {} as Record<string,Setting[]>)

  const saveAll = async () => {
    if (!Object.keys(edits).length) { showToast('No changes to save'); return }
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: edits })
    })
    setSaving(false)
    setEdits({})
    showToast('Settings saved successfully!')
    load()
  }

  const testPush = async () => {
    setTesting('push')
    const r = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId:'admin-test', title:'Test Push Notification', body:'Firebase push is working correctly!', url:'/admin/settings' })
    })
    const d = await r.json()
    setTesting('idle')
    showToast(d.error ? `Push failed: ${d.error}` : `Push sent (${d.sent} devices)`)
  }

  const testEmail = async () => {
    const emailSetting = settings.find(s=>s.key==='gmail_user')
    if (!emailSetting?.has_value) { showToast('Set Gmail address first'); return }
    setTesting('email')
    const r = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: edits['gmail_user'] || emailSetting.value,
        subject: 'Test Email — MOUAU FreshStart',
        html: '<div style="font-family:sans-serif;padding:24px"><h2 style="color:#1a6b3a">✅ Email is working!</h2><p>Your Gmail SMTP is configured correctly in MOUAU FreshStart.</p></div>'
      })
    })
    const d = await r.json()
    setTesting('idle')
    showToast(d.ok ? 'Test email sent! Check your inbox.' : `Email failed: ${d.error}`)
  }

  const getValue = (s:Setting) => edits[s.key] !== undefined ? edits[s.key] : (s.is_secret && s.has_value && !shown[s.key] ? '••••••••' : s.value)

  return (
    <AdminShell>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/> {toast}
        </div>
      )}

      <div className="p-4 space-y-6 w-full pb-24">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
            <h1 className="font-black text-[#0a0a0a] text-2xl">App Settings</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">Firebase, Gmail SMTP & general configuration</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 rounded-xl border border-[#e8e8e8] hover:bg-[#f9f9f7] transition-colors">
              <RefreshCw className="w-4 h-4 text-[#6b6b6b]"/>
            </button>
            <button onClick={saveAll} disabled={saving||!Object.keys(edits).length}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all ${saving||!Object.keys(edits).length?'bg-[#1a6b3a]/40 cursor-not-allowed':'bg-[#1a6b3a] hover:bg-[#145530]'}`}>
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> Saving...</> : <><Save className="w-3.5 h-3.5"/> Save All</>}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : (
          <div className="space-y-6">
            {Object.entries(CATEGORY_LABELS).map(([cat, catLabel]) => {
              const items = grouped[cat] || []
              if (!items.length) return null
              return (
                <div key={cat} className="card overflow-hidden">
                  <div className="px-4 py-3 bg-[#f9f9f7] border-b border-[#e8e8e8] flex items-center justify-between">
                    <h2 className="font-black text-[#0a0a0a] text-sm">{catLabel}</h2>
                    {cat === 'firebase_admin' && (
                      <button onClick={testPush} disabled={testing!=='idle'}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a6b3a] bg-[#1a6b3a]/10 px-2.5 py-1 rounded-full hover:bg-[#1a6b3a]/20 transition-colors">
                        <Wifi className="w-3 h-3"/>
                        {testing==='push'?'Testing...':'Test Push'}
                      </button>
                    )}
                    {cat === 'gmail' && (
                      <button onClick={testEmail} disabled={testing!=='idle'}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors">
                        <Wifi className="w-3 h-3"/>
                        {testing==='email'?'Sending...':'Test Email'}
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
                            {s.is_secret && s.has_value && (
                              <button onClick={()=>setShown(p=>({...p,[s.key]:!p[s.key]}))} className="text-[#aaa] hover:text-[#6b6b6b]">
                                {shown[s.key] ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                              </button>
                            )}
                          </div>
                        </div>
                        {s.key === 'firebase_admin_private_key' ? (
                          <textarea rows={3}
                            value={getValue(s)}
                            onChange={e=>setEdits(p=>({...p,[s.key]:e.target.value}))}
                            placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                            className="input w-full resize-none text-xs font-mono leading-relaxed"
                            onFocus={()=>{ if(!edits[s.key]&&s.is_secret) setEdits(p=>({...p,[s.key]:''})) }}
                          />
                        ) : (
                          <input
                            type={s.is_secret && !shown[s.key] && !edits[s.key] ? 'password' : 'text'}
                            value={getValue(s)}
                            onChange={e=>setEdits(p=>({...p,[s.key]:e.target.value}))}
                            onFocus={()=>{ if(!edits[s.key]&&s.is_secret) setEdits(p=>({...p,[s.key]:''})) }}
                            className="input w-full text-sm"
                            placeholder={s.description}
                          />
                        )}
                        {s.description && <p className="text-[10px] text-[#aaa] mt-1">{s.description}</p>}
                        {s.is_secret && !s.has_value && <p className="text-[10px] text-amber-600 mt-1 font-semibold">⚠️ Not set — required for {cat === 'gmail' ? 'email' : 'notifications'} to work</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Instructions */}
        <div className="card p-4 bg-[#f9f9f7]">
          <p className="text-xs font-bold text-[#0a0a0a] mb-2">📌 Setup Guide</p>
          <div className="space-y-1.5 text-[11px] text-[#6b6b6b] leading-relaxed">
            <p><strong className="text-[#0a0a0a]">Gmail App Password:</strong> Google Account → Security → 2-Step Verification → App Passwords → Select "Mail" → Generate</p>
            <p><strong className="text-[#0a0a0a]">Firebase VAPID Key:</strong> Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Generate key pair</p>
            <p><strong className="text-[#0a0a0a]">Firebase Private Key:</strong> Firebase Console → Project Settings → Service Accounts → Generate new private key → copy private_key value</p>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
