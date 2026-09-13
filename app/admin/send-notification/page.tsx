'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminShell from '@/components/AdminShell'
import {
  Send, Loader2, CheckCircle2, AlertCircle,
  Smartphone, Mail, Monitor, Users, BookOpen,
  ChevronDown, ChevronUp, Info
} from 'lucide-react'

/* ─── Audience definitions ──────────────────────────────────────────────── */
const AUDIENCES = [
  {
    group: '👥 All Students',
    items: [
      { value: 'all',           label: 'All Students',        icon: '👥', desc: 'Every registered student' },
      { value: 'pwa_installed', label: 'PWA Installed Only',  icon: '📲', desc: 'Students with the app installed & notifications on' },
    ],
  },
  {
    group: '📚 Library — By Request Status',
    items: [
      { value: 'material_pending',   label: 'Pending Requests',   icon: '⏳', desc: 'Applied but not yet approved' },
      { value: 'material_approved',  label: 'Approved Requests',  icon: '✅', desc: 'Approved — awaiting Sunday pickup' },
      { value: 'material_collected', label: 'Collected Materials', icon: '📦', desc: 'Already collected their materials' },
      { value: 'material_cancelled', label: 'Cancelled Requests', icon: '❌', desc: 'Request was cancelled' },
    ],
  },
  {
    group: '🎓 By Level',
    items: [
      { value: 'level_100', label: '100 Level', icon: '1️⃣', desc: 'First year students' },
      { value: 'level_200', label: '200 Level', icon: '2️⃣', desc: 'Second year students' },
      { value: 'level_300', label: '300 Level', icon: '3️⃣', desc: 'Third year students' },
      { value: 'level_400', label: '400 Level', icon: '4️⃣', desc: 'Fourth year students' },
      { value: 'level_500', label: '500 Level', icon: '5️⃣', desc: 'Fifth year students' },
    ],
  },
]

const ALL_ITEMS = AUDIENCES.flatMap(g => g.items)

/* ─── Channel config ────────────────────────────────────────────────────── */
const CHANNELS = [
  { key: 'push',  label: 'Push',   icon: Smartphone, color: '#1a6b3a', desc: 'FCM — PWA / Android' },
  { key: 'inapp', label: 'In-App', icon: Monitor,    color: '#7c3aed', desc: 'Bell notification inside app' },
  { key: 'email', label: 'Email',  icon: Mail,       color: '#3b82f6', desc: 'Gmail to registered email' },
]

/* ─── URL shortcuts ─────────────────────────────────────────────────────── */
const URL_OPTIONS = [
  { label: 'Dashboard',   value: '/dashboard' },
  { label: 'Library',     value: '/library'   },
  { label: 'PDM Page',    value: '/pdm'       },
  { label: 'Campus Map',  value: '/navigate'  },
  { label: 'Events',      value: '/events'    },
  { label: 'Profile',     value: '/profile'   },
]

type Channels = { push: boolean; inapp: boolean; email: boolean }
type AudienceInfo = { total: number; pushEnabled: number } | null

export default function SendNotificationPage() {
  const [audience,   setAudience]   = useState('all')
  const [title,      setTitle]      = useState('')
  const [body,       setBody]       = useState('')
  const [url,        setUrl]        = useState('/dashboard')
  const [channels,   setChannels]   = useState<Channels>({ push: true, inapp: true, email: false })
  const [loading,    setLoading]    = useState(false)
  const [preview,    setPreview]    = useState<AudienceInfo>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [result,     setResult]     = useState<any>(null)
  const [error,      setError]      = useState('')
  const [showGroups, setShowGroups] = useState(false)

  const selected = ALL_ITEMS.find(i => i.value === audience)

  /* Load audience count whenever audience changes */
  const loadPreview = useCallback(async (aud: string) => {
    setPreviewLoading(true)
    setPreview(null)
    try {
      const r = await fetch(`/api/admin/send-notification?audience=${aud}`)
      const d = await r.json()
      setPreview(d)
    } catch {}
    setPreviewLoading(false)
  }, [])

  useEffect(() => { loadPreview(audience) }, [audience, loadPreview])

  const toggleChannel = (key: keyof Channels) =>
    setChannels(prev => ({ ...prev, [key]: !prev[key] }))

  const send = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    if (!Object.values(channels).some(Boolean)) { setError('Select at least one channel'); return }
    setError(''); setLoading(true); setResult(null)
    try {
      const r = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience, title, body, url, channels }),
      })
      const d = await r.json()
      if (!d.ok) { setError(d.error || 'Send failed'); }
      else { setResult(d.results); setTitle(''); setBody('') }
    } catch (e: any) {
      setError(e.message || 'Network error')
    }
    setLoading(false)
  }

  return (
    <AdminShell>
      <div className="p-4 w-full pb-24 space-y-5">
        {/* Header */}
        <div>
          <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
          <h1 className="font-black text-[#0a0a0a] text-2xl">Send Notification</h1>
          <p className="text-xs text-[#6b6b6b] mt-0.5">Push, in-app &amp; email to any audience</p>
        </div>

        {/* Success result */}
        {result && (
          <div className="card p-4 bg-[#f0f9f4] border border-[#1a6b3a]/20">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-[#1a6b3a]"/>
              <p className="font-bold text-[#1a6b3a] text-sm">Notification sent!</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] text-[#0a0a0a]">
                <span className="font-semibold">Recipients:</span> {result.recipients}
              </p>
              {result.push && (
                <p className="text-[11px] text-[#0a0a0a]">
                  <span className="font-semibold">Push:</span> {result.push.sent} sent
                  {result.push.failed > 0 && `, ${result.push.failed} failed`}
                  {result.push.error && <span className="text-red-500"> — {result.push.error}</span>}
                </p>
              )}
              {result.inapp && (
                <p className="text-[11px] text-[#0a0a0a]">
                  <span className="font-semibold">In-App:</span> {result.inapp.sent} notifications created
                </p>
              )}
              {result.email && (
                <p className="text-[11px] text-[#0a0a0a]">
                  <span className="font-semibold">Email:</span> {result.email.sent} sent
                  {result.email.error && <span className="text-red-500"> — {result.email.error}</span>}
                </p>
              )}
            </div>
            <button onClick={() => setResult(null)}
              className="mt-3 text-[10px] text-[#1a6b3a] font-semibold underline">
              Send another
            </button>
          </div>
        )}

        {/* ── 1. Audience ── */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-[#f9f9f7] border-b border-[#e8e8e8]">
            <h2 className="font-black text-[#0a0a0a] text-sm">1. Select Audience</h2>
          </div>

          {/* Selected display */}
          <button
            onClick={() => setShowGroups(p => !p)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#f9f9f7] transition-colors">
            <span className="text-xl flex-shrink-0">{selected?.icon}</span>
            <div className="flex-1 text-left min-w-0">
              <p className="font-bold text-[#0a0a0a] text-sm">{selected?.label}</p>
              <p className="text-[10px] text-[#aaa]">{selected?.desc}</p>
            </div>
            {previewLoading ? (
              <Loader2 className="w-4 h-4 text-[#aaa] animate-spin flex-shrink-0"/>
            ) : preview ? (
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-black text-[#0a0a0a]">{preview.total}</p>
                <p className="text-[9px] text-[#aaa]">students</p>
              </div>
            ) : null}
            {showGroups
              ? <ChevronUp className="w-4 h-4 text-[#aaa] flex-shrink-0"/>
              : <ChevronDown className="w-4 h-4 text-[#aaa] flex-shrink-0"/>}
          </button>

          {showGroups && (
            <div className="border-t border-[#e8e8e8]">
              {AUDIENCES.map(group => (
                <div key={group.group}>
                  <p className="px-4 pt-3 pb-1 text-[9px] font-black text-[#aaa] uppercase tracking-widest">
                    {group.group}
                  </p>
                  {group.items.map(item => (
                    <button key={item.value}
                      onClick={() => { setAudience(item.value); setShowGroups(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                        ${audience === item.value ? 'bg-[#1a6b3a]/8' : 'hover:bg-[#f9f9f7]'}`}>
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${audience === item.value ? 'text-[#1a6b3a]' : 'text-[#0a0a0a]'}`}>
                          {item.label}
                        </p>
                        <p className="text-[10px] text-[#aaa]">{item.desc}</p>
                      </div>
                      {audience === item.value && (
                        <CheckCircle2 className="w-4 h-4 text-[#1a6b3a] flex-shrink-0"/>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Audience stats bar */}
          {preview && !showGroups && (
            <div className="px-4 pb-3 pt-1 flex items-center gap-3 text-[10px] text-[#6b6b6b]">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3"/>
                <span><strong className="text-[#0a0a0a]">{preview.total}</strong> students</span>
              </div>
              <div className="w-px h-3 bg-[#e8e8e8]"/>
              <div className="flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-[#1a6b3a]"/>
                <span><strong className="text-[#1a6b3a]">{preview.pushEnabled}</strong> with push enabled</span>
              </div>
            </div>
          )}
        </div>

        {/* ── 2. Channels ── */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-[#f9f9f7] border-b border-[#e8e8e8]">
            <h2 className="font-black text-[#0a0a0a] text-sm">2. Delivery Channels</h2>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#f0f0f0]">
            {CHANNELS.map(ch => {
              const on = channels[ch.key as keyof Channels]
              return (
                <button key={ch.key}
                  onClick={() => toggleChannel(ch.key as keyof Channels)}
                  className={`flex flex-col items-center gap-1.5 py-4 px-2 transition-colors
                    ${on ? 'bg-white' : 'bg-[#fafafa]'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all
                    ${on ? 'shadow-md' : 'bg-[#f0f0f0]'}`}
                    style={on ? { background: ch.color } : {}}>
                    <ch.icon className="w-4 h-4" style={{ color: on ? 'white' : '#aaa' }}/>
                  </div>
                  <p className={`text-[10px] font-bold ${on ? 'text-[#0a0a0a]' : 'text-[#aaa]'}`}>{ch.label}</p>
                  <p className="text-[9px] text-[#aaa] text-center leading-tight">{ch.desc}</p>
                  <div className={`w-5 h-2.5 rounded-full transition-all mt-0.5 ${on ? '' : 'bg-[#e8e8e8]'}`}
                    style={on ? { background: ch.color } : {}}>
                    <div className={`w-2 h-2 bg-white rounded-full mt-0.5 transition-all ${on ? 'ml-2.5' : 'ml-0.5'}`}/>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── 3. Message ── */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-[#f9f9f7] border-b border-[#e8e8e8]">
            <h2 className="font-black text-[#0a0a0a] text-sm">3. Message</h2>
          </div>
          <div className="p-4 space-y-3.5">
            <div>
              <label className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-wide block mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Library materials ready for pickup!"
                maxLength={100}
                className="input w-full text-sm"
              />
              <p className="text-[9px] text-[#aaa] mt-1 text-right">{title.length}/100</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-wide block mb-1.5">
                Message Body
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Optional details..."
                rows={3}
                maxLength={500}
                className="input w-full text-sm resize-none"
              />
              <p className="text-[9px] text-[#aaa] mt-1 text-right">{body.length}/500</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-wide block mb-1.5">
                Tap Destination
              </label>
              <div className="flex flex-wrap gap-1.5">
                {URL_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => setUrl(opt.value)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border
                      ${url === opt.value
                        ? 'bg-[#1a6b3a] text-white border-[#1a6b3a]'
                        : 'bg-white text-[#6b6b6b] border-[#e8e8e8] hover:border-[#1a6b3a]/40'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Preview card ── */}
        {title && (
          <div className="card p-4 border border-dashed border-[#e8e8e8]">
            <p className="text-[9px] font-bold text-[#aaa] uppercase tracking-widest mb-2">Preview</p>
            <div className="bg-[#0a0a0a] rounded-xl p-3 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                <img src="/icon-192.png" alt="" className="w-full h-full object-contain"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold leading-tight">{title}</p>
                {body && <p className="text-white/50 text-[10px] mt-0.5 line-clamp-2">{body}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* ── Send button ── */}
        <button
          onClick={send}
          disabled={loading || !title.trim()}
          className={`w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all shadow-lg
            ${loading || !title.trim()
              ? 'bg-[#1a6b3a]/40 cursor-not-allowed'
              : 'bg-[#1a6b3a] hover:bg-[#145530] active:scale-[0.98]'}`}>
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin"/> Sending...</>
            : <><Send className="w-4 h-4"/>
                Send to {previewLoading ? '...' : preview?.total ?? '?'} students
              </>
          }
        </button>

        {/* Info note */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5"/>
          <div className="text-[10px] text-blue-700 space-y-0.5">
            <p><strong>Push</strong> only reaches students who installed the PWA and allowed notifications.</p>
            <p><strong>In-App</strong> shows in the bell icon for all selected students on next login.</p>
            <p><strong>Email</strong> requires Gmail configured in Notification Settings.</p>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
