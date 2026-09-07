'use client'
import { useEffect, useState, useCallback } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import {
  Bell, Mail, Smartphone, Monitor, Loader2, CheckCircle2,
  Flag, MessageSquare, UserPlus, Info, AlertTriangle,
  CheckCheck, RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Rule = {
  id: string; event_type: string; label: string; description: string
  channel_push: boolean; channel_email: boolean; channel_inapp: boolean; enabled: boolean
}
type AdminNotif = {
  id: string; type: string; title: string; body: string;
  data: Record<string, any>; read: boolean; created_at: string
}

const ICONS: Record<string, string> = {
  comment: '💬', reply: '↩️', reaction: '👍', announcement: '📢',
  new_post: '📝', library: '📚', event: '🗓️', welcome: '👋',
  report: '🚩', new_user: '👤', ban: '🔨', info: 'ℹ️'
}
const CHANNELS = [
  { field: 'channel_push',  label: 'Push',   color: '#1a6b3a', Icon: Smartphone, desc: 'Android' },
  { field: 'channel_email', label: 'Email',  color: '#3b82f6', Icon: Mail,       desc: 'Gmail'   },
  { field: 'channel_inapp', label: 'In-App', color: '#7c3aed', Icon: Monitor,    desc: 'Bell'    },
]

const NOTIF_COLORS: Record<string, string> = {
  report: '#e11d48', new_post: '#1a6b3a', new_user: '#2563eb',
  ban: '#d97706', info: '#6b6b6b', warning: '#d97706'
}

function Toggle({ on, onChange, color = '#1a6b3a' }: { on: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button onClick={() => onChange(!on)}
      className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
      style={on ? { background: color } : { background: '#e8e8e8' }}>
      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${on ? 'left-5' : 'left-0.5'}`} />
    </button>
  )
}

type Tab = 'inbox' | 'rules'

export default function AdminNotificationsPage() {
  const { token } = useAdmin()
  const [tab, setTab] = useState<Tab>('inbox')
  const [rules, setRules] = useState<Rule[]>([])
  const [adminNotifs, setAdminNotifs] = useState<AdminNotif[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const loadNotifs = useCallback(async () => {
    if (!token) return
    setLoading(true)
    const [rulesRes, notifsRes] = await Promise.all([
      fetch('/api/admin/notification-rules').then(r => r.json()),
      fetch('/api/admin/admin-notifications', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ])
    setRules(rulesRes.data || [])
    setAdminNotifs(notifsRes.data || [])
    setLoading(false)
  }, [token])

  useEffect(() => { loadNotifs() }, [loadNotifs])

  const update = async (rule: Rule, field: string, value: boolean) => {
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, [field]: value } : r))
    setSaving(rule.id + field)
    await fetch('/api/admin/notification-rules', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rule.id, [field]: value })
    })
    setSaving(null); showToast('Saved')
  }

  const markAllRead = async () => {
    if (!token) return
    await fetch('/api/admin/admin-notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ all: true })
    })
    setAdminNotifs(prev => prev.map(n => ({ ...n, read: true })))
    showToast('All marked as read')
  }

  const markRead = async (id: string) => {
    if (!token) return
    await fetch('/api/admin/admin-notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id })
    })
    setAdminNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const unread = adminNotifs.filter(n => !n.read).length

  return (
    <AdminShell>
      <div className="p-5 lg:p-8 max-w-3xl">
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0a0a0a] text-white text-xs px-4 py-2 rounded-full flex items-center gap-2 z-50">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]" /> {toast}
          </div>
        )}

        <div className="mb-6">
          <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1">ADMIN</p>
          <h1 className="text-xl font-black text-[#0a0a0a]">Notifications</h1>
          <p className="text-[#6b6b6b] text-sm mt-1">Admin inbox and notification rules.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#f0f0f0] p-1 rounded-xl mb-6">
          {[
            { key: 'inbox' as Tab, label: `Inbox${unread > 0 ? ` (${unread})` : ''}` },
            { key: 'rules' as Tab, label: 'Notification Rules' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === key ? 'bg-white text-[#0a0a0a] shadow-sm' : 'text-[#6b6b6b]'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Admin Inbox */}
        {tab === 'inbox' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">
                {unread > 0 ? `${unread} unread` : 'All caught up'}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={loadNotifs} className="p-1.5 rounded-lg hover:bg-[#f0f0f0]">
                  <RefreshCw className="w-3.5 h-3.5 text-[#aaa]" />
                </button>
                {unread > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e8e8e8] rounded-xl text-xs font-bold text-[#6b6b6b] hover:bg-[#f9f9f7]">
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin" /></div>
            ) : adminNotifs.length === 0 ? (
              <div className="bg-white border border-[#e8e8e8] rounded-2xl p-10 text-center">
                <Bell className="w-8 h-8 text-[#e8e8e8] mx-auto mb-3" />
                <p className="font-bold text-[#0a0a0a] text-sm">No notifications yet</p>
                <p className="text-[#aaa] text-xs mt-1">Reports and activity will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {adminNotifs.map(n => {
                  const color = NOTIF_COLORS[n.type] || '#6b6b6b'
                  const emoji = ICONS[n.type] || 'ℹ️'
                  return (
                    <button key={n.id} onClick={() => { if (!n.read) markRead(n.id) }}
                      className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all ${n.read ? 'bg-white border-[#e8e8e8] opacity-70' : 'bg-white border-[#1a6b3a]/20 shadow-sm'}`}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ background: color + '15' }}>
                        {emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-snug ${n.read ? 'text-[#6b6b6b]' : 'font-bold text-[#0a0a0a]'}`}>{n.title}</p>
                          {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: color }} />}
                        </div>
                        <p className="text-xs text-[#aaa] mt-0.5 line-clamp-1">{n.body}</p>
                        <p className="text-[9px] text-[#ccc] mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Notification Rules */}
        {tab === 'rules' && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin" /></div>
            ) : rules.length === 0 ? (
              <div className="bg-white border border-[#e8e8e8] rounded-2xl p-10 text-center">
                <Bell className="w-8 h-8 text-[#e8e8e8] mx-auto mb-3" />
                <p className="text-sm text-[#aaa]">No notification rules configured.</p>
              </div>
            ) : rules.map(rule => (
              <div key={rule.id} className="bg-white border border-[#e8e8e8] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{ICONS[rule.event_type] || '🔔'}</span>
                    <div>
                      <p className="font-bold text-[#0a0a0a] text-sm">{rule.label}</p>
                      <p className="text-[10px] text-[#aaa]">{rule.description}</p>
                    </div>
                  </div>
                  <Toggle on={rule.enabled} onChange={v => update(rule, 'enabled', v)} />
                </div>
                <div className={`space-y-2 ${!rule.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  {CHANNELS.map(({ field, label, color, Icon, desc }) => (
                    <div key={field} className="flex items-center justify-between py-1.5 pl-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                        <span className="text-xs font-medium text-[#374151]">{label}</span>
                        <span className="text-[9px] text-[#aaa]">{desc}</span>
                      </div>
                      <Toggle on={rule[field as keyof Rule] as boolean} onChange={v => update(rule, field, v)} color={color} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
