'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { Bell, Mail, Smartphone, Monitor, Loader2, CheckCircle2 } from 'lucide-react'

type Rule = {
  id:string; event_type:string; label:string; description:string
  channel_push:boolean; channel_email:boolean; channel_inapp:boolean; enabled:boolean
}

const ICONS:Record<string,string> = {
  comment:'💬', reply:'↩️', reaction:'👍', announcement:'📢',
  new_post:'📝', library:'📚', event:'🗓️', welcome:'👋'
}

const CHANNELS = [
  { field:'channel_push',  label:'Push',   color:'#1a6b3a', Icon:Smartphone, desc:'Android' },
  { field:'channel_email', label:'Email',  color:'#3b82f6', Icon:Mail,       desc:'Gmail'   },
  { field:'channel_inapp', label:'In-App', color:'#7c3aed', Icon:Monitor,    desc:'Bell'    },
]

function Toggle({ on, onChange, color='#1a6b3a' }:{ on:boolean; onChange:(v:boolean)=>void; color?:string }) {
  return (
    <button onClick={()=>onChange(!on)}
      className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
      style={on?{background:color}:{background:'#e8e8e8'}}>
      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${on?'left-5':'left-0.5'}`}/>
    </button>
  )
}

export default function NotificationRulesPage() {
  const [rules,   setRules]   = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState<string|null>(null)
  const [toast,   setToast]   = useState('')

  const showToast=(m:string)=>{ setToast(m); setTimeout(()=>setToast(''),2000) }

  useEffect(()=>{
    fetch('/api/admin/notification-rules')
      .then(r=>r.json())
      .then(d=>{ setRules(d.data||[]); setLoading(false) })
      .catch(()=>setLoading(false))
  },[])

  const update = async (rule:Rule, field:string, value:boolean) => {
    setRules(prev=>prev.map(r=>r.id===rule.id?{...r,[field]:value}:r))
    setSaving(rule.id+field)
    await fetch('/api/admin/notification-rules',{
      method:'PUT', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({id:rule.id,[field]:value})
    })
    setSaving(null)
    showToast('Saved')
  }

  return (
    <AdminShell>
      {toast&&(
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/> {toast}
        </div>
      )}
      <div className="p-4 w-full pb-24 space-y-4">
        <div>
          <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
          <h1 className="font-black text-[#0a0a0a] text-2xl">Notification Rules</h1>
          <p className="text-xs text-[#6b6b6b] mt-0.5">Configure when and how each notification is sent</p>
        </div>

        {/* Channel key */}
        <div className="grid grid-cols-3 gap-2">
          {CHANNELS.map(ch=>(
            <div key={ch.field} className="card p-3 text-center">
              <ch.Icon className="w-5 h-5 mx-auto mb-1" style={{color:ch.color}}/>
              <p className="font-bold text-xs text-[#0a0a0a]">{ch.label}</p>
              <p className="text-[9px] text-[#aaa]">{ch.desc}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : rules.length===0 ? (
          <div className="card p-8 text-center">
            <Bell className="w-8 h-8 text-[#ddd] mx-auto mb-2"/>
            <p className="text-sm text-[#aaa]">No rules found. Check Supabase — run the notification_rules SQL.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule=>(
              <div key={rule.id} className={`card overflow-hidden transition-all ${!rule.enabled?'opacity-60':''}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl flex-shrink-0">{ICONS[rule.event_type]||'🔔'}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-[#0a0a0a] text-sm">{rule.label}</p>
                      <p className="text-[10px] text-[#aaa] truncate">{rule.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                    <span className="text-[9px] text-[#aaa]">{rule.enabled?'Active':'Off'}</span>
                    <Toggle on={rule.enabled} onChange={v=>update(rule,'enabled',v)}/>
                  </div>
                </div>

                {/* Channel toggles */}
                <div className="grid grid-cols-3 gap-0 border-t border-[#f0f0f0]">
                  {CHANNELS.map(ch=>(
                    <div key={ch.field}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 ${ch.field!=='channel_inapp'?'border-r border-[#f0f0f0]':''}`}
                      style={(rule as any)[ch.field]?{background:ch.color+'08'}:{}}>
                      <div className="flex items-center gap-1" style={{color:(rule as any)[ch.field]?ch.color:'#ccc'}}>
                        <ch.Icon className="w-3.5 h-3.5"/>
                        <span className="text-[10px] font-bold">{ch.label}</span>
                      </div>
                      {saving===rule.id+ch.field
                        ? <Loader2 className="w-4 h-4 animate-spin text-[#aaa]"/>
                        : <Toggle on={(rule as any)[ch.field]} onChange={v=>update(rule,ch.field,v)} color={ch.color}/>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card p-4 bg-amber-50 border border-amber-100">
          <p className="text-xs font-bold text-amber-800 mb-1">⚠️ Email requires Gmail SMTP configuration</p>
          <p className="text-[11px] text-amber-700">Go to <strong>Notification Settings</strong> → Gmail SMTP section to configure sending. Email is best reserved for announcements to avoid spam.</p>
        </div>
      </div>
    </AdminShell>
  )
}
