'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Bell, Mail, Smartphone, Monitor, Loader2, CheckCircle2, Plus, Trash2, X } from 'lucide-react'

type Rule = { id:string; event_type:string; label:string; description:string; channel_push:boolean; channel_email:boolean; channel_inapp:boolean; enabled:boolean }

const CHANNELS = [
  { field:'channel_push',  label:'Push',   color:'#1a6b3a', Icon:Smartphone },
  { field:'channel_email', label:'Email',  color:'#3b82f6', Icon:Mail       },
  { field:'channel_inapp', label:'In-App', color:'#7c3aed', Icon:Monitor    },
]

const EVENT_GROUPS = [
  { label:'Announcements & Content', events:['announcement','registration_update'] },
  { label:'Library',                 events:['library_approved','library_available','library_pickup'] },
  { label:'Events & Ministry',       events:['event_new','pdm_event'] },
  { label:'Skills',                  events:['skill_class','skill_approved'] },
  { label:'Community',               events:['forum_reply','forum_reaction'] },
  { label:'Account',                 events:['welcome'] },
]

function Toggle({ on, onChange, color='#1a6b3a' }:{ on:boolean; onChange:(v:boolean)=>void; color?:string }) {
  return (
    <button onClick={() => onChange(!on)}
      className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
      style={on ? {background:color} : {background:'#e8e8e8'}}>
      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${on?'left-5':'left-0.5'}`}/>
    </button>
  )
}

export default function NotificationRulesPage() {
  const { token } = useAdmin()
  const authH = { Authorization: `Bearer ${token}` }
  const [rules,    setRules]    = useState<Rule[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState<string|null>(null)
  const [toast,    setToast]    = useState('')
  const [showAdd,  setShowAdd]  = useState(false)
  const [newRule,  setNewRule]  = useState({ event_type:'', label:'', description:'', channel_push:true, channel_email:false, channel_inapp:true, enabled:true })

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2000) }

  useEffect(() => {
    fetch('/api/admin/notification-rules').then(r => r.json())
      .then(d => { setRules(d.data || []); setLoading(false) })
  }, [])

  const update = async (rule: Rule, field: string, value: boolean) => {
    setRules(prev => prev.map(r => r.id === rule.id ? {...r, [field]: value} : r))
    setSaving(rule.id + field)
    await fetch('/api/admin/notification-rules', {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ id: rule.id, [field]: value })
    })
    setSaving(null)
    showToast('Saved')
  }

  const addRule = async () => {
    if (!newRule.event_type.trim() || !newRule.label.trim()) return
    const r = await fetch('/api/admin/notification-rules', {
      method:'POST', headers:{'Content-Type':'application/json',...authH},
      body: JSON.stringify(newRule)
    }).then(r => r.json())
    if (r.data) {
      setRules(p => [...p, r.data])
      setNewRule({ event_type:'', label:'', description:'', channel_push:true, channel_email:false, channel_inapp:true, enabled:true })
      setShowAdd(false)
      showToast('Rule added!')
    }
  }

  const deleteRule = async (id: string) => {
    await fetch('/api/admin/notification-rules', {
      method:'DELETE', headers:{'Content-Type':'application/json',...authH},
      body: JSON.stringify({ id })
    })
    setRules(p => p.filter(r => r.id !== id))
    showToast('Rule deleted')
  }

  // Group rules
  const grouped = EVENT_GROUPS.map(g => ({
    ...g,
    rules: rules.filter(r => g.events.includes(r.event_type))
  }))
  const otherRules = rules.filter(r => !EVENT_GROUPS.flatMap(g => g.events).includes(r.event_type))

  return (
    <AdminShell>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/> {toast}
        </div>
      )}
      <div className="p-4 w-full pb-24 space-y-5 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
            <h1 className="font-black text-[#0a0a0a] text-2xl">Notification Rules</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">Control when and how each notification is sent</p>
          </div>
          <button onClick={() => setShowAdd(p => !p)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1a6b3a] text-white rounded-xl text-xs font-bold">
            <Plus className="w-3.5 h-3.5"/> Add Rule
          </button>
        </div>

        {/* Channel legend */}
        <div className="grid grid-cols-3 gap-2">
          {CHANNELS.map(ch => (
            <div key={ch.field} className="card p-3 text-center">
              <ch.Icon className="w-4 h-4 mx-auto mb-1" style={{color:ch.color}}/>
              <p className="font-bold text-xs text-[#0a0a0a]">{ch.label}</p>
            </div>
          ))}
        </div>

        {/* Add new rule form */}
        {showAdd && (
          <div className="card p-4 space-y-3 border-2 border-dashed border-[#1a6b3a]/30">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#0a0a0a]">New Notification Rule</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-[#aaa]"/></button>
            </div>
            <input value={newRule.event_type} onChange={e => setNewRule(p => ({...p, event_type: e.target.value.toLowerCase().replace(/\s+/g,'_')}))}
              placeholder="event_type (e.g. new_post)" className="input w-full text-sm font-mono"/>
            <input value={newRule.label} onChange={e => setNewRule(p => ({...p, label: e.target.value}))}
              placeholder="Label (e.g. New Post)" className="input w-full text-sm"/>
            <input value={newRule.description} onChange={e => setNewRule(p => ({...p, description: e.target.value}))}
              placeholder="Description" className="input w-full text-sm"/>
            <div className="flex gap-3">
              {CHANNELS.map(ch => (
                <label key={ch.field} className="flex items-center gap-1.5 cursor-pointer">
                  <Toggle on={(newRule as any)[ch.field]} onChange={v => setNewRule(p => ({...p, [ch.field]: v}))} color={ch.color}/>
                  <span className="text-xs text-[#6b6b6b]">{ch.label}</span>
                </label>
              ))}
            </div>
            <button onClick={addRule} className="w-full py-2 text-sm font-bold text-white bg-[#1a6b3a] rounded-xl">Add Rule</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : (
          <div className="space-y-5">
            {[...grouped, ...(otherRules.length ? [{ label:'Custom Rules', rules: otherRules }] : [])].map(group => (
              group.rules.length === 0 ? null :
              <div key={group.label}>
                <p className="text-[10px] font-black text-[#aaa] uppercase tracking-widest mb-2">{group.label}</p>
                <div className="space-y-2">
                  {group.rules.map(rule => (
                    <div key={rule.id} className={`card overflow-hidden ${!rule.enabled?'opacity-60':''}`}>
                      <div className="flex items-center justify-between p-3.5 pb-2.5">
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="font-bold text-[#0a0a0a] text-sm">{rule.label}</p>
                          <p className="text-[10px] text-[#aaa] mt-0.5">{rule.description}</p>
                          <p className="text-[9px] text-[#ccc] font-mono mt-0.5">{rule.event_type}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[9px] text-[#aaa]">{rule.enabled?'Active':'Off'}</span>
                            <Toggle on={rule.enabled} onChange={v => update(rule,'enabled',v)}/>
                          </div>
                          <button onClick={() => deleteRule(rule.id)} className="text-[#ddd] hover:text-red-400 transition-colors ml-1">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 border-t border-[#f0f0f0]">
                        {CHANNELS.map(ch => (
                          <div key={ch.field}
                            className={`flex flex-col items-center gap-1.5 py-2.5 px-2 ${ch.field!=='channel_inapp'?'border-r border-[#f0f0f0]':''}`}
                            style={(rule as any)[ch.field]?{background:`${ch.color}08`}:{}}>
                            <ch.Icon className="w-3 h-3" style={{color:(rule as any)[ch.field]?ch.color:'#ccc'}}/>
                            {saving === rule.id + ch.field
                              ? <Loader2 className="w-4 h-4 animate-spin text-[#aaa]"/>
                              : <Toggle on={(rule as any)[ch.field]} onChange={v => update(rule,ch.field,v)} color={ch.color}/>}
                            <span className="text-[9px]" style={{color:(rule as any)[ch.field]?ch.color:'#ccc'}}>{ch.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card p-3.5 bg-blue-50 border border-blue-100">
          <p className="text-xs font-bold text-blue-800 mb-1">Email requires Gmail SMTP</p>
          <p className="text-[11px] text-blue-700">Configure in Admin → Notification Settings. Reserve email for important announcements.</p>
        </div>
      </div>
    </AdminShell>
  )
}
