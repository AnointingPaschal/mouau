'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { AlertTriangle, RefreshCw, Trash2, ChevronDown, ChevronUp, Copy, CheckCircle2 } from 'lucide-react'

type ApiError = {
  id: string
  route: string
  method: string
  error_message: string
  error_stack: string | null
  student_id: string | null
  payload: any
  created_at: string
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function AdminErrors() {
  const [errors,   setErrors]   = useState<ApiError[]>([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied,   setCopied]   = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/errors')
    const d = await r.json()
    setErrors(d.errors || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id); setTimeout(() => setCopied(null), 2000)
  }

  const clearAll = async () => {
    if (!confirm('Delete all logged errors?')) return
    setDeleting(true)
    await fetch('/api/admin/errors', { method: 'DELETE' })
    setErrors([])
    setDeleting(false)
  }

  const routeColor = (route: string) => {
    if (route.includes('webhook')) return '#7c3aed'
    if (route.includes('transfer')) return '#b91c1c'
    if (route.includes('create-virtual')) return '#c2410c'
    if (route.includes('airtime') || route.includes('data')) return '#1e3a8a'
    return '#374151'
  }

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#0a0a0a]">API Error Log</h1>
            <p className="text-[#888] text-xs mt-0.5">{errors.length} errors recorded</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#f5f5f5] rounded-xl text-xs font-semibold text-[#555] hover:bg-[#eee] transition-colors">
              <RefreshCw className="w-3.5 h-3.5"/>
              Refresh
            </button>
            {errors.length > 0 && (
              <button onClick={clearAll} disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
                <Trash2 className="w-3.5 h-3.5"/>
                Clear All
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#aaa] text-sm">Loading…</div>
        ) : errors.length === 0 ? (
          <div className="card p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#1a6b3a] mx-auto mb-3"/>
            <p className="font-semibold text-[#333]">No errors logged</p>
            <p className="text-xs text-[#aaa] mt-1">API errors will appear here automatically</p>
          </div>
        ) : (
          <div className="space-y-2">
            {errors.map(err => (
              <div key={err.id} className="card overflow-hidden">
                {/* Header row */}
                <button
                  className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-[#fafafa] transition-colors"
                  onClick={() => setExpanded(expanded === err.id ? null : err.id)}>
                  <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                        style={{ background: routeColor(err.route) }}>
                        {err.method || 'POST'}
                      </span>
                      <span className="text-xs font-mono font-semibold text-[#0a0a0a] truncate">{err.route}</span>
                    </div>
                    <p className="text-[11px] text-red-600 truncate mt-0.5">{err.error_message}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[10px] text-[#aaa]">{timeAgo(err.created_at)}</p>
                    {err.student_id && (
                      <p className="text-[10px] text-[#888] font-mono mt-0.5">{err.student_id}</p>
                    )}
                  </div>
                  {expanded === err.id
                    ? <ChevronUp className="w-4 h-4 text-[#aaa] flex-shrink-0"/>
                    : <ChevronDown className="w-4 h-4 text-[#aaa] flex-shrink-0"/>}
                </button>

                {/* Expanded detail */}
                {expanded === err.id && (
                  <div className="border-t border-[#f0f0f0] p-3.5 space-y-3 bg-[#fafafa]">
                    <div>
                      <p className="text-[10px] font-bold text-[#888] uppercase tracking-wide mb-1">Error Message</p>
                      <div className="relative bg-white border border-[#eee] rounded-xl p-3">
                        <p className="text-xs text-red-600 font-mono leading-relaxed pr-8">{err.error_message}</p>
                        <button onClick={() => copyText(err.error_message, err.id + '_msg')}
                          className="absolute top-2 right-2 p-1 rounded-lg hover:bg-[#f5f5f5]">
                          {copied === err.id + '_msg'
                            ? <CheckCircle2 className="w-3 h-3 text-[#1a6b3a]"/>
                            : <Copy className="w-3 h-3 text-[#aaa]"/>}
                        </button>
                      </div>
                    </div>

                    {err.error_stack && (
                      <div>
                        <p className="text-[10px] font-bold text-[#888] uppercase tracking-wide mb-1">Stack Trace</p>
                        <div className="relative bg-[#0a0a0a] rounded-xl p-3 overflow-x-auto">
                          <pre className="text-[10px] text-[#aaa] leading-relaxed whitespace-pre-wrap break-words pr-8">
                            {err.error_stack}
                          </pre>
                          <button onClick={() => copyText(err.error_stack!, err.id + '_stack')}
                            className="absolute top-2 right-2 p-1 rounded-lg hover:bg-white/10">
                            {copied === err.id + '_stack'
                              ? <CheckCircle2 className="w-3 h-3 text-[#4ade80]"/>
                              : <Copy className="w-3 h-3 text-[#555]"/>}
                          </button>
                        </div>
                      </div>
                    )}

                    {err.payload && (
                      <div>
                        <p className="text-[10px] font-bold text-[#888] uppercase tracking-wide mb-1">Request Payload</p>
                        <div className="bg-white border border-[#eee] rounded-xl p-3 overflow-x-auto">
                          <pre className="text-[10px] text-[#555] leading-relaxed">
                            {JSON.stringify(err.payload, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-[#aaa]">
                      {new Date(err.created_at).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
