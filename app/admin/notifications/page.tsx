'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { Bell, Mail, Smartphone, Monitor, Loader2, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react'

type Rule = {
  id:string; event_type:string; label:string; description:string
  channel_push:boolean; channel_email:boolean; channel_inapp:boolean
  enabled:boolean; updated_at:string
}

const EVENT_ICONS:Record<string,string> = {
  comment:      '💬', reply:'↩️', reaction:'👍',
  announcement: '📢', new_post:'📝', library:'📚', event:'🗓️'
}

export default function AdminNotificationsPage() {
  const [rules,   setRules]   = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [toast,   setToast]   = useState('')
  const [saving,  setSaving]  = useState<string|null>(null)

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),2500) }

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/notification-rules')
    const d = await r.json()
    setRules(d.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const update = async (rule:Rule, field:string, value:boolean) => {
    const updated = { ...rule, [field]: value }
    setRules(prev => prev.map(r => r.id === rule.id ? updated : r))
    setSaving(rule.id + field)
    await fetch('/api/admin/notification-rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rule.id, [field]: value })
    })
    setSaving(null)
    showToast('Saved')
  }

  const Toggle = ({ on, onChange, color='#1a6b3a' }:{ on:boolean; onChange:(v:boolean)=>void; color?:string }) => (
    <button onClick={()=>onChange(!on)}
      className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${on?'':'bg-[#e8e8e8]'}`}
      style={on?{background:color}:{}}>
      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${on?'left-5':'left-0.5'}`}/>
    </button>
  )

  const isSaving = (rule:Rule, field:string) => saving === rule.id + field

  return (
    <AdminShell>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/> {toast}
        </div>
      )}

      <div className="p-4 space-y-5 w-full pb-24">
        <div>
          <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
          <h1 className="font-black text-[#0a0a0a] text-2xl">Notification Rules</h1>
          <p className="text-xs text-[#6b6b6b] mt-0.5">Control which notifications are sent and through which channels</p>
        </div>

        {/* Channel legend */}
        <div className="card p-4">
          <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-3">Channels</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon:<Smartphone className="w-4 h-4 text-[#1a6b3a]"/>, label:'Push', desc:'Android notification', color:'#1a6b3a' },
              { icon:<Mail className="w-4 h-4 text-blue-500"/>,        label:'Email', desc:'Gmail to student email', color:'#3b82f6' },
              { icon:<Monitor className="w-4 h-4 text-[#7c3aed]"/>,   label:'In-App', desc:'Bell icon in app', color:'#7c3aed' },
            ].map(c => (
              <div key={c.label} className="flex flex-col items-center gap-1.5 p-3 bg-[#f9f9f7] rounded-xl text-center">
                {c.icon}
                <p className="text-xs font-bold text-[#0a0a0a]">{c.label}</p>
                <p className="text-[9px] text-[#aaa]">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className={`card p-4 transition-all ${!rule.enabled ? 'opacity-50' : ''}`}>
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{EVENT_ICONS[rule.event_type] || '🔔'}</span>
                    <div>
                      <p className="font-bold text-[#0a0a0a] text-sm">{rule.label}</p>
                      <p className="text-[10px] text-[#aaa]">{rule.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSaving(rule, 'enabled') && <Loader2 className="w-3.5 h-3.5 text-[#1a6b3a] animate-spin"/>}
                    <div className="flex flex-col items-end">
                      <p className="text-[9px] text-[#aaa] mb-1">{rule.enabled ? 'Active' : 'Disabled'}</p>
                      <Toggle on={rule.enabled} onChange={v=>update(rule,'enabled',v)} color='#1a6b3a'/>
                    </div>
                  </div>
                </div>

                {/* Channel toggles */}
                <div className="border-t border-[#f0f0f0] pt-3 grid grid-cols-3 gap-2">
                  {[
                    { field:'channel_push',  label:'Push',   icon:<Smartphone className="w-3.5 h-3.5"/>, color:'#1a6b3a' },
                    { field:'channel_email', label:'Email',  icon:<Mail className="w-3.5 h-3.5"/>,        color:'#3b82f6' },
                    { field:'channel_inapp', label:'In-App', icon:<Monitor className="w-3.5 h-3.5"/>,    color:'#7c3aed' },
                  ].map(ch => (
                    <div key={ch.field} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all ${(rule as any)[ch.field] ? 'bg-[#f9f9f7]' : 'bg-transparent'}`}>
                      <div className="flex items-center gap-1" style={{color: (rule as any)[ch.field] ? ch.color : '#ccc'}}>
                        {ch.icon}
                        <span className="text-[10px] font-bold">{ch.label}</span>
                      </div>
                      {isSaving(rule, ch.field)
                        ? <Loader2 className="w-4 h-4 animate-spin text-[#aaa]"/>
                        : <Toggle on={(rule as any)[ch.field]} onChange={v=>update(rule,ch.field,v)} color={ch.color}/>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Global info */}
        <div className="card p-4 bg-amber-50 border border-amber-100">
          <p className="text-xs font-bold text-amber-800 mb-1.5">⚠️ Email notifications require Gmail to be configured</p>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Go to <strong>App Settings</strong> → Gmail SMTP section and add your Gmail address and App Password.
            Email is disabled for most events by default to avoid spam — only enable for important ones like Announcements.
          </p>
        </div>
      </div>
    </AdminShell>
  )
}
