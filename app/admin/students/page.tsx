'use client'
import { useEffect, useState, useMemo } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Loader2, Search, Users, Smartphone, User, GraduationCap, RefreshCw, Clock, CheckCircle2, XCircle } from 'lucide-react'

type Student = {
  id: string
  id_number: string
  name: string
  email: string
  whatsapp: string
  department: string
  college: string
  level: string
  created_at: string
  pwa_installed: boolean
}

type Pending = {
  id: string
  email: string
  id_number: string
  name: string
  created_at: string
  expires_at: string
  used: boolean
  registered: boolean
  expired: boolean
}

type Tab = 'all' | 'pwa' | 'pending'

const LEVEL_COLORS: Record<string, string> = {
  '100': '#1e3a8a', '200': '#1a6b3a', '300': '#d97706', '400': '#b91c1c', '500': '#7c3aed',
}

function Avatar({ name, hasPwa }: { name: string; hasPwa: boolean }) {
  const initials = (name || 'ST').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="relative flex-shrink-0">
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1a6b3a]/10 border border-[#1a6b3a]/20">
        <span className="text-[#1a6b3a] font-black text-xs">{initials}</span>
      </div>
      {hasPwa && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#1a6b3a] rounded-full flex items-center justify-center shadow-sm border-2 border-white">
          <Smartphone className="w-2 h-2 text-white" />
        </div>
      )}
    </div>
  )
}

function StudentCard({ student }: { student: Student }) {
  const levelColor = LEVEL_COLORS[student.level] || '#aaa'
  const joined = student.created_at
    ? new Date(student.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'
  return (
    <div className={`bg-white border rounded-2xl p-3.5 flex items-start gap-3
      ${student.pwa_installed ? 'border-[#1a6b3a]/25' : 'border-[#e8e8e8]'}`}>
      <Avatar name={student.name} hasPwa={student.pwa_installed} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-bold text-[#0a0a0a] text-sm truncate">{student.name || 'No name'}</p>
          {student.level && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
              style={{ background: levelColor }}>{student.level}L</span>
          )}
          {student.pwa_installed && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#1a6b3a] text-white flex items-center gap-0.5 flex-shrink-0">
              <Smartphone className="w-2 h-2" /> PWA
            </span>
          )}
        </div>
        <p className="text-[#aaa] text-[10px] font-mono mt-0.5">{student.id_number}</p>
        <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5">
          {student.email && <p className="text-[#6b6b6b] text-[10px] truncate col-span-2">{student.email}</p>}
          {student.department && <p className="text-[#aaa] text-[9px] truncate">{student.department}</p>}
          <p className="text-[#aaa] text-[9px] text-right">Joined {joined}</p>
        </div>
      </div>
    </div>
  )
}

function PendingCard({ p }: { p: Pending }) {
  const when = p.created_at
    ? new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'
  const initials = (p.name || p.email || 'PD').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const statusColor = p.registered ? '#1a6b3a' : p.expired ? '#b91c1c' : '#d97706'
  const statusLabel = p.registered ? 'Registered' : p.expired ? 'Code expired' : 'Code sent'
  const StatusIcon  = p.registered ? CheckCircle2 : p.expired ? XCircle : Clock

  return (
    <div className="bg-white border border-[#e8e8e8] rounded-2xl p-3.5 flex items-start gap-3">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#f5f5f3] border border-[#e8e8e8]">
          <span className="text-[#aaa] font-black text-xs">{initials}</span>
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center shadow-sm border-2 border-white"
          style={{ background: statusColor }}>
          <StatusIcon className="w-2 h-2 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-bold text-[#0a0a0a] text-sm truncate">{p.name || '—'}</p>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
            style={{ background: statusColor }}>{statusLabel}</span>
        </div>
        <p className="text-[#aaa] text-[10px] font-mono mt-0.5">{p.id_number || '—'}</p>
        <div className="mt-1.5">
          <p className="text-[#6b6b6b] text-[10px] truncate">{p.email}</p>
          <p className="text-[#aaa] text-[9px] mt-0.5">Requested {when}</p>
        </div>
      </div>
    </div>
  )
}

export default function StudentsPage() {
  const { token } = useAdmin()
  const [students,    setStudents]    = useState<Student[]>([])
  const [pending,     setPending]     = useState<Pending[]>([])
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [query,       setQuery]       = useState('')
  const [tab,         setTab]         = useState<Tab>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null)

  const fetchAll = async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [sRes, pRes] = await Promise.all([
        fetch('/api/admin/students',         { headers }),
        fetch('/api/admin/students/pending',  { headers }),
      ])
      const [sData, pData] = await Promise.all([sRes.json(), pRes.json()])
      setStudents(sData.data || [])
      // Show unverified (not yet registered) in pending tab
      setPending((pData.unverified || []))
      setLastUpdated(new Date())
    } catch {}
    setLoading(false); setRefreshing(false)
  }

  useEffect(() => { fetchAll() }, [token])
  useEffect(() => {
    if (!token) return
    const iv = setInterval(() => fetchAll(true), 30_000)
    return () => clearInterval(iv)
  }, [token])

  const pwaCount   = useMemo(() => students.filter(s => s.pwa_installed).length, [students])
  const pwaPercent = students.length ? Math.round((pwaCount / students.length) * 100) : 0
  const levels     = useMemo(() => {
    const seen = new Set<string>()
    students.forEach(s => { if (s.level) seen.add(s.level) })
    return Array.from(seen).sort()
  }, [students])

  const baseList = useMemo(
    () => tab === 'pwa' ? students.filter(s => s.pwa_installed) : students,
    [tab, students]
  )

  const filtered = useMemo(() => {
    if (tab === 'pending') {
      if (!query) return pending
      const q = query.toLowerCase()
      return pending.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.id_number?.toLowerCase().includes(q)
      )
    }
    let list = baseList
    if (levelFilter !== 'all') list = list.filter(s => s.level === levelFilter)
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.id_number?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q)
      )
    }
    return list
  }, [tab, baseList, pending, query, levelFilter])

  return (
    <AdminShell>
      <div className="p-4 w-full pb-24 space-y-4 max-w-2xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
            <h1 className="font-black text-[#0a0a0a] text-2xl">Students</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">Registered accounts &amp; pending verifications</p>
            {lastUpdated && (
              <p className="text-[9px] text-[#bbb] mt-0.5">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <button onClick={() => fetchAll(true)} disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e8e8e8] bg-white text-xs font-semibold text-[#6b6b6b] hover:border-[#1a6b3a] hover:text-[#1a6b3a] transition-all disabled:opacity-50 mt-1">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}/>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="card p-3 text-center">
            <Users className="w-4 h-4 text-[#1e3a8a] mx-auto mb-1" />
            <p className="font-black text-[#0a0a0a] text-lg leading-none">{students.length}</p>
            <p className="text-[9px] text-[#aaa] mt-0.5 font-semibold uppercase tracking-wide">Registered</p>
          </div>
          <div className="card p-3 text-center">
            <Clock className="w-4 h-4 text-[#d97706] mx-auto mb-1" />
            <p className="font-black text-[#d97706] text-lg leading-none">{pending.length}</p>
            <p className="text-[9px] text-[#aaa] mt-0.5 font-semibold uppercase tracking-wide">Pending</p>
          </div>
          <div className="card p-3 text-center">
            <Smartphone className="w-4 h-4 text-[#1a6b3a] mx-auto mb-1" />
            <p className="font-black text-[#1a6b3a] text-lg leading-none">{pwaCount}</p>
            <p className="text-[9px] text-[#aaa] mt-0.5 font-semibold uppercase tracking-wide">PWA</p>
          </div>
          <div className="card p-3 text-center">
            <GraduationCap className="w-4 h-4 text-[#7c3aed] mx-auto mb-1" />
            <p className="font-black text-[#7c3aed] text-lg leading-none">{pwaPercent}%</p>
            <p className="text-[9px] text-[#aaa] mt-0.5 font-semibold uppercase tracking-wide">Install</p>
          </div>
        </div>

        {/* Adoption bar */}
        {!loading && students.length > 0 && (
          <div className="card p-3">
            <div className="flex items-center justify-between text-[10px] font-semibold mb-1.5">
              <span className="text-[#aaa]">PWA Adoption</span>
              <span className="text-[#1a6b3a]">{pwaCount} / {students.length}</span>
            </div>
            <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
              <div className="h-full bg-[#1a6b3a] rounded-full transition-all duration-700"
                style={{ width: `${pwaPercent}%` }} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-[#f5f5f3] p-1 rounded-xl overflow-x-auto">
          {([
            { id: 'all'     as Tab, label: 'Registered', count: students.length,  color: '#1e3a8a' },
            { id: 'pending' as Tab, label: 'Pending',    count: pending.length,    color: '#d97706' },
            { id: 'pwa'     as Tab, label: 'PWA',        count: pwaCount,          color: '#1a6b3a' },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap
                ${tab === t.id ? 'bg-white text-[#0a0a0a] shadow-sm' : 'text-[#aaa] hover:text-[#6b6b6b]'}`}>
              {t.label}
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black text-white"
                style={{ background: tab === t.id ? t.color : '#ccc' }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search + level filter */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center border border-[#e8e8e8] rounded-xl px-3 py-2 bg-white">
            <Search className="w-3.5 h-3.5 text-[#aaa] mr-2 flex-shrink-0" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder={tab === 'pending' ? 'Name, ID or email…' : 'Name, ID, email or dept…'}
              className="flex-1 text-xs outline-none bg-transparent" />
          </div>
          {tab !== 'pending' && levels.length > 0 && (
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
              className="border border-[#e8e8e8] rounded-xl px-2 py-2 text-xs bg-white outline-none text-[#0a0a0a] font-semibold">
              <option value="all">All levels</option>
              {levels.map(l => <option key={l} value={l}>{l}L</option>)}
            </select>
          )}
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-[10px] text-[#aaa] font-medium">
            {filtered.length} {tab === 'pending' ? 'pending' : tab === 'pwa' ? 'PWA' : 'registered'} students
          </p>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <User className="w-8 h-8 text-[#ddd] mx-auto mb-2" />
            <p className="text-sm text-[#aaa]">
              {tab === 'pending' ? 'No pending verifications' :
               tab === 'pwa'     ? 'No PWA installs yet' :
                                   'No students match your search'}
            </p>
          </div>
        ) : tab === 'pending' ? (
          <div className="space-y-2">
            {(filtered as Pending[]).map(p => <PendingCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {(filtered as Student[]).map(s => <StudentCard key={s.id} student={s} />)}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
