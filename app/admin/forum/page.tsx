'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import {
  MessageSquare, Flag, Ban, AlertTriangle, Trash2, CheckCircle2,
  Loader2, Search, X, ChevronUp, Eye, User, Bell, MoreHorizontal,
  ShieldOff, ShieldCheck, RefreshCw, ChevronDown
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Post = {
  id: string; title: string; body: string; author: string;
  author_id: string; category: string; like_count: number;
  replies: number; created_at: string
}
type Report = {
  id: string; post_id: string; reporter_id: string; reason: string;
  details: string; status: string; created_at: string;
  forum_posts?: { title: string; author: string; author_id: string; body: string }
}
type BannedUser = {
  id: string; student_id: string; student_name: string;
  reason: string; banned_by: string; banned_at: string; active: boolean
}

const CAT_COLORS: Record<string, string> = {
  general: '#6b6b6b', admissions: '#1a6b3a', navigation: '#2563eb',
  accommodation: '#7c3aed', 'study help': '#d97706',
  registration: '#e11d48', 'campus life': '#0891b2'
}

type Tab = 'posts' | 'reports' | 'banned'

function Toast({ msg, type = 'success', onClose }: { msg: string; type?: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 text-white text-xs px-4 py-2.5 rounded-full flex items-center gap-2 z-50 shadow-xl ${type === 'error' ? 'bg-red-600' : 'bg-[#0a0a0a]'}`}>
      {type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-300" />}
      {msg}
    </div>
  )
}

function WarnModal({ target, token, onClose, onDone }: {
  target: { id: string; name: string }; token: string; onClose: () => void; onDone: () => void
}) {
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const PRESETS = [
    'Please keep posts relevant to MOUAU topics.',
    'Your recent post violated our community guidelines.',
    'Please avoid posting misinformation.',
    'Repeated violations may result in a ban.'
  ]
  const send = async () => {
    setSending(true)
    await fetch('/api/admin/forum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'warn', student_id: target.id, student_name: target.name, message: msg })
    })
    setSending(false); onDone()
  }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-[#0a0a0a]">Warn User</h3>
          <button onClick={onClose} className="ml-auto"><X className="w-4 h-4 text-[#aaa]" /></button>
        </div>
        <p className="text-xs text-[#6b6b6b] mb-3">Sending warning to <strong>{target.name}</strong></p>
        <div className="space-y-1.5 mb-3">
          {PRESETS.map(p => (
            <button key={p} onClick={() => setMsg(p)} className={`w-full text-left text-xs px-3 py-2 rounded-xl border transition-colors ${msg === p ? 'border-amber-400 bg-amber-50' : 'border-[#e8e8e8] hover:bg-[#f9f9f7]'}`}>{p}</button>
          ))}
        </div>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Or write custom warning..." rows={2}
          className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2 text-xs resize-none outline-none focus:border-amber-400 mb-3" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-xs font-bold text-[#6b6b6b]">Cancel</button>
          <button onClick={send} disabled={!msg.trim() || sending}
            className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />} Send Warning
          </button>
        </div>
      </div>
    </div>
  )
}

function BanModal({ target, token, onClose, onDone }: {
  target: { id: string; name: string }; token: string; onClose: () => void; onDone: () => void
}) {
  const [reason, setReason] = useState('')
  const [banning, setBanning] = useState(false)
  const REASONS = ['Repeated spam', 'Harassment / bullying', 'Posting misinformation', 'Inappropriate content', 'Impersonation']
  const ban = async () => {
    setBanning(true)
    await fetch('/api/admin/forum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'ban', student_id: target.id, student_name: target.name, reason })
    })
    setBanning(false); onDone()
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <Ban className="w-5 h-5 text-red-500" />
          <h3 className="font-bold text-[#0a0a0a]">Ban User</h3>
          <button onClick={onClose} className="ml-auto"><X className="w-4 h-4 text-[#aaa]" /></button>
        </div>
        <p className="text-xs text-[#aaa] mb-4">Banning <strong className="text-[#0a0a0a]">{target.name}</strong> will block their forum access and notify them.</p>
        <div className="space-y-1.5 mb-3">
          {REASONS.map(r => (
            <button key={r} onClick={() => setReason(r)} className={`w-full text-left text-xs px-3 py-2 rounded-xl border transition-colors ${reason === r ? 'border-red-400 bg-red-50' : 'border-[#e8e8e8] hover:bg-[#f9f9f7]'}`}>{r}</button>
          ))}
        </div>
        <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Or enter custom reason..."
          className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2 text-xs outline-none focus:border-red-400 mb-4" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-xs font-bold text-[#6b6b6b]">Cancel</button>
          <button onClick={ban} disabled={!reason.trim() || banning}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
            {banning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />} Confirm Ban
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Posts Tab ── */
function PostsTab({ token, onToast }: { token: string; onToast: (m: string) => void }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [warnTarget, setWarnTarget] = useState<{ id: string; name: string } | null>(null)
  const [banTarget, setBanTarget] = useState<{ id: string; name: string } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await fetch('/api/admin/forum?view=posts', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    setPosts(data || [])
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post and all its comments?')) return
    await fetch('/api/admin/forum', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, type: 'post' })
    })
    onToast('Post deleted'); load()
  }

  const filtered = query ? posts.filter(p => p.title.toLowerCase().includes(query.toLowerCase()) || p.author.toLowerCase().includes(query.toLowerCase())) : posts

  return (
    <div>
      <div className="flex items-center gap-2 bg-white border border-[#e8e8e8] rounded-xl px-3 py-2.5 mb-4">
        <Search className="w-3.5 h-3.5 text-[#aaa]" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search posts or authors..."
          className="flex-1 text-xs outline-none bg-transparent" />
        {query && <button onClick={() => setQuery('')}><X className="w-3.5 h-3.5 text-[#aaa]" /></button>}
      </div>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-10 text-center">
          <MessageSquare className="w-8 h-8 text-[#e8e8e8] mx-auto mb-2" />
          <p className="text-[#aaa] text-sm">No posts found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const color = CAT_COLORS[p.category?.toLowerCase()] || '#6b6b6b'
            const isExp = expanded === p.id
            return (
              <div key={p.id} className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden">
                <div className="p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
                      style={{ background: color }}>
                      {p.author?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#0a0a0a] text-sm leading-tight line-clamp-1">{p.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-semibold text-[#1a6b3a]">{p.author}</span>
                            <span className="text-[#ddd]">·</span>
                            <span className="text-[10px] text-[#aaa]">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: color + '20', color }}>
                              {p.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="flex items-center gap-0.5 text-[10px] text-[#aaa]"><ChevronUp className="w-3 h-3" />{p.like_count}</span>
                          <span className="flex items-center gap-0.5 text-[10px] text-[#aaa]"><MessageSquare className="w-3 h-3" />{p.replies}</span>
                        </div>
                      </div>
                      {isExp && p.body && (
                        <div className="mt-2 text-xs text-[#6b6b6b] leading-relaxed border-t border-[#f0f0f0] pt-2 line-clamp-4">{p.body}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex border-t border-[#f5f5f5] divide-x divide-[#f5f5f5]">
                  <button onClick={() => setExpanded(isExp ? null : p.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7]">
                    <Eye className="w-3 h-3" /> {isExp ? 'Hide' : 'View'}
                  </button>
                  <button onClick={() => setWarnTarget({ id: p.author_id, name: p.author })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold text-amber-600 hover:bg-amber-50">
                    <Bell className="w-3 h-3" /> Warn
                  </button>
                  <button onClick={() => setBanTarget({ id: p.author_id, name: p.author })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold text-red-500 hover:bg-red-50">
                    <Ban className="w-3 h-3" /> Ban
                  </button>
                  <button onClick={() => deletePost(p.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold text-red-500 hover:bg-red-50">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {warnTarget && <WarnModal target={warnTarget} token={token} onClose={() => setWarnTarget(null)} onDone={() => { setWarnTarget(null); onToast('Warning sent to ' + warnTarget.name) }} />}
      {banTarget && <BanModal target={banTarget} token={token} onClose={() => setBanTarget(null)} onDone={() => { setBanTarget(null); onToast(banTarget.name + ' has been banned') }} />}
    </div>
  )
}

/* ── Reports Tab ── */
function ReportsTab({ token, onToast }: { token: string; onToast: (m: string) => void }) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [banTarget, setBanTarget] = useState<{ id: string; name: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await fetch('/api/admin/forum?view=reports', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    setReports(data || [])
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  const dismiss = async (id: string) => {
    await fetch('/api/admin/forum', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'dismiss_report', report_id: id })
    })
    onToast('Report dismissed'); load()
  }

  const deletePost = async (postId: string, reportId: string) => {
    if (!confirm('Delete this post?')) return
    await fetch('/api/admin/forum', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: postId, type: 'post' })
    })
    onToast('Post deleted'); load()
  }

  const filtered = filter === 'pending' ? reports.filter(r => r.status === 'pending') : reports
  const REASON_COLORS: Record<string, string> = { spam: '#e11d48', harassment: '#dc2626', misinformation: '#d97706', inappropriate: '#7c3aed', 'off-topic': '#6b6b6b', other: '#374151' }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {(['pending', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${filter === f ? 'bg-[#0a0a0a] text-white' : 'bg-white border border-[#e8e8e8] text-[#6b6b6b]'}`}>
            {f === 'pending' ? `Pending (${reports.filter(r => r.status === 'pending').length})` : 'All Reports'}
          </button>
        ))}
        <button onClick={load} className="ml-auto p-1.5 rounded-lg hover:bg-[#f0f0f0]"><RefreshCw className="w-3.5 h-3.5 text-[#aaa]" /></button>
      </div>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-10 text-center">
          <Flag className="w-8 h-8 text-[#e8e8e8] mx-auto mb-2" />
          <p className="font-bold text-[#0a0a0a] text-sm">No {filter === 'pending' ? 'pending' : ''} reports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const color = REASON_COLORS[r.reason] || '#6b6b6b'
            return (
              <div key={r.id} className={`bg-white border rounded-xl overflow-hidden ${r.status === 'pending' ? 'border-[#e8e8e8]' : 'border-[#f0f0f0] opacity-70'}`}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-2 py-1 rounded-full uppercase" style={{ background: color + '20', color }}>{r.reason}</span>
                      {r.status !== 'pending' && <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-[#f0f0f0] text-[#aaa] uppercase">{r.status}</span>}
                    </div>
                    <span className="text-[10px] text-[#aaa] flex-shrink-0">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                  </div>
                  {r.forum_posts && (
                    <div className="bg-[#f9f9f7] rounded-xl p-3 mb-2">
                      <p className="font-bold text-[#0a0a0a] text-xs leading-snug mb-1">"{r.forum_posts.title}"</p>
                      {r.forum_posts.body && <p className="text-[10px] text-[#6b6b6b] line-clamp-2">{r.forum_posts.body}</p>}
                      <p className="text-[9px] text-[#aaa] mt-1">by {r.forum_posts.author}</p>
                    </div>
                  )}
                  {r.details && <p className="text-xs text-[#6b6b6b] italic mb-2">"{r.details}"</p>}
                </div>
                {r.status === 'pending' && (
                  <div className="flex border-t border-[#f5f5f5] divide-x divide-[#f5f5f5]">
                    <button onClick={() => dismiss(r.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold text-[#6b6b6b] hover:bg-[#f9f9f7]">
                      <CheckCircle2 className="w-3 h-3" /> Dismiss
                    </button>
                    {r.forum_posts && (
                      <button onClick={() => setBanTarget({ id: r.forum_posts!.author_id, name: r.forum_posts!.author })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold text-red-500 hover:bg-red-50">
                        <Ban className="w-3 h-3" /> Ban Author
                      </button>
                    )}
                    <button onClick={() => deletePost(r.post_id, r.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold text-red-500 hover:bg-red-50">
                      <Trash2 className="w-3 h-3" /> Delete Post
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {banTarget && <BanModal target={banTarget} token={token} onClose={() => setBanTarget(null)} onDone={() => { setBanTarget(null); onToast(banTarget.name + ' has been banned') }} />}
    </div>
  )
}

/* ── Banned Tab ── */
function BannedTab({ token, onToast }: { token: string; onToast: (m: string) => void }) {
  const [banned, setBanned] = useState<BannedUser[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await fetch('/api/admin/forum?view=banned', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    setBanned(data || [])
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  const unban = async (student_id: string, name: string) => {
    await fetch('/api/admin/forum', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'unban', student_id })
    })
    onToast(`${name} has been reinstated`); load()
  }

  const activeBanned = banned.filter(b => b.active)
  const historical = banned.filter(b => !b.active)

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin" /></div>
      ) : activeBanned.length === 0 && historical.length === 0 ? (
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-10 text-center">
          <ShieldCheck className="w-8 h-8 text-[#1a6b3a] mx-auto mb-2" />
          <p className="font-bold text-[#0a0a0a] text-sm">No banned users</p>
          <p className="text-[#aaa] text-xs mt-1">Community is clean!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeBanned.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-3">ACTIVE BANS ({activeBanned.length})</p>
              <div className="space-y-2">
                {activeBanned.map(b => (
                  <div key={b.id} className="bg-white border border-red-100 rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Ban className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0a0a0a] text-sm">{b.student_name}</p>
                      <p className="text-[10px] text-red-500 font-semibold">{b.reason}</p>
                      <p className="text-[9px] text-[#aaa]">Banned by {b.banned_by} · {formatDistanceToNow(new Date(b.banned_at), { addSuffix: true })}</p>
                    </div>
                    <button onClick={() => unban(b.student_id, b.student_name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a6b3a]/10 text-[#1a6b3a] rounded-xl text-[10px] font-bold hover:bg-[#1a6b3a]/20 transition-colors flex-shrink-0">
                      <ShieldCheck className="w-3 h-3" /> Unban
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {historical.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-3">BAN HISTORY</p>
              <div className="space-y-2 opacity-60">
                {historical.map(b => (
                  <div key={b.id} className="bg-white border border-[#e8e8e8] rounded-xl p-3 flex items-center gap-3">
                    <div className="w-7 h-7 bg-[#f0f0f0] rounded-full flex items-center justify-center flex-shrink-0">
                      <ShieldOff className="w-3.5 h-3.5 text-[#aaa]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0a0a0a] text-xs">{b.student_name}</p>
                      <p className="text-[9px] text-[#aaa]">{b.reason} · Reinstated</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main Page ── */
export default function AdminForumPage() {
  const { token } = useAdmin()
  const [tab, setTab] = useState<Tab>('posts')
  const [toast, setToast] = useState('')

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'posts', label: 'All Posts', icon: MessageSquare },
    { key: 'reports', label: 'Reports', icon: Flag },
    { key: 'banned', label: 'Banned', icon: Ban },
  ]

  return (
    <AdminShell>
      <div className="p-5 lg:p-8 max-w-3xl">
        <div className="mb-6">
          <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1">ADMIN</p>
          <h1 className="text-xl font-black text-[#0a0a0a]">Forum Management</h1>
          <p className="text-[#6b6b6b] text-sm mt-1">Moderate posts, handle reports, and manage user access.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#f0f0f0] p-1 rounded-xl mb-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${tab === key ? 'bg-white text-[#0a0a0a] shadow-sm' : 'text-[#6b6b6b] hover:text-[#0a0a0a]'}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {token && tab === 'posts' && <PostsTab token={token} onToast={setToast} />}
        {token && tab === 'reports' && <ReportsTab token={token} onToast={setToast} />}
        {token && tab === 'banned' && <BannedTab token={token} onToast={setToast} />}
      </div>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
    </AdminShell>
  )
}
