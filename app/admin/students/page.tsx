'use client'
import { useEffect, useState, useMemo } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Loader2, Search, Users, Smartphone, User, GraduationCap } from 'lucide-react'

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
  pwa_installed: boolean   // tagged server-side
}

type Tab = 'all' | 'pwa'

const LEVEL_COLORS: Record<string, string> = {
  '100': '#1e3a8a',
  '200': '#1a6b3a',
  '300': '#d97706',
  '400': '#b91c1c',
  '500': '#7c3aed',
}

function Avatar({ name, hasPwa }: { name: string; hasPwa: boolean }) {
  const initials = (name || 'ST').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="relative flex-shrink-0">
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1a6b3a]/10 border border-[#1a6b3a]/20">
        <span className="text-[#1a6b3a] font-black text-xs">{initials}</span>
      </div>
      {hasPwa && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#1a6b3a] rounded-full flex items-center justify-center shadow-sm border-2 border-white"
          title="PWA Installed">
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
    <div className={`bg-white border rounded-2xl p-3.5 flex items-start gap-3 transition-colors
      ${student.pwa_installed ? 'border-[#1a6b3a]/25 hover:border-[#1a6b3a]/50' : 'border-[#e8e8e8] hover:border-[#d0d0d0]'}`}>
      <Avatar name={student.name} hasPwa={student.pwa_installed} />

      <div className="flex-1 min-w-0">
        {/* Name + badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-bold text-[#0a0a0a] text-sm truncate">{student.name || 'No name'}</p>
          {student.level && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
              style={{ background: levelColor }}>
              {student.level}L
            </span>
          )}
          {student.pwa_installed && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#1a6b3a] text-white flex items-center gap-0.5 flex-shrink-0">
              <Smartphone className="w-2 h-2" /> PWA
            </span>
          )}
        </div>

        {/* ID mono */}
        <p className="text-[#aaa] text-[10px] font-mono mt-0.5">{student.id_number}</p>

        {/* Details */}
        <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5">
          {student.email && (
            <p className="text-[#6b6b6b] text-[10px] truncate col-span-2">{student.email}</p>
          )}
          {student.department && (
            <p className="text-[#aaa] text-[9px] truncate">{student.department}</p>
          )}
          <p className="text-[#aaa] text-[9px] text-right">Joined {joined}</p>
        </div>
      </div>
    </div>
  )
}

export default function StudentsPage() {
  const { token } = useAdmin()
  const [students, setStudents] = useState<Student[]>([])
  const [loading,  setLoading]  = useState(true)
  const [query,    setQuery]    = useState('')
  const [tab,      setTab]      = useState<Tab>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')

  useEffect(() => {
    if (!token) return
    fetch('/api/admin/students', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setStudents(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  // Derived counts — directly from the pwa_installed flag
  const pwaCount   = useMemo(() => students.filter(s => s.pwa_installed).length, [students])
  const pwaPercent = students.length ? Math.round((pwaCount / students.length) * 100) : 0

  // Base list for current tab
  const baseList = useMemo(
    () => tab === 'pwa' ? students.filter(s => s.pwa_installed) : students,
    [tab, students]
  )

  // Filtered list
  const filtered = useMemo(() => {
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
  }, [baseList, query, levelFilter])

  const levels = useMemo(() => {
    const seen = new Set<string>()
    students.forEach(s => { if (s.level) seen.add(s.level) })
    return Array.from(seen).sort()
  }, [students])

  return (
    <AdminShell>
      <div className="p-4 w-full pb-24 space-y-4 max-w-2xl">

        {/* Header */}
        <div>
          <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
          <h1 className="font-black text-[#0a0a0a] text-2xl">Students</h1>
          <p className="text-xs text-[#6b6b6b] mt-0.5">Registered accounts &amp; PWA installs</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="card p-3 text-center">
            <Users className="w-4 h-4 text-[#1e3a8a] mx-auto mb-1" />
            <p className="font-black text-[#0a0a0a] text-lg leading-none">{students.length}</p>
            <p className="text-[9px] text-[#aaa] mt-0.5 font-semibold uppercase tracking-wide">Total</p>
          </div>
          <div className="card p-3 text-center">
            <Smartphone className="w-4 h-4 text-[#1a6b3a] mx-auto mb-1" />
            <p className="font-black text-[#1a6b3a] text-lg leading-none">{pwaCount}</p>
            <p className="text-[9px] text-[#aaa] mt-0.5 font-semibold uppercase tracking-wide">PWA</p>
          </div>
          <div className="card p-3 text-center">
            <GraduationCap className="w-4 h-4 text-[#d97706] mx-auto mb-1" />
            <p className="font-black text-[#d97706] text-lg leading-none">{pwaPercent}%</p>
            <p className="text-[9px] text-[#aaa] mt-0.5 font-semibold uppercase tracking-wide">Installed</p>
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
        <div className="flex gap-1.5 bg-[#f5f5f3] p-1 rounded-xl">
          {([
            { id: 'all' as Tab, label: 'All Students',      count: students.length },
            { id: 'pwa' as Tab, label: '📲 PWA Installed',  count: pwaCount        },
          ]).map(t => (
            <button key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all
                ${tab === t.id ? 'bg-white text-[#0a0a0a] shadow-sm' : 'text-[#aaa] hover:text-[#6b6b6b]'}`}>
              {t.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black
                ${tab === t.id ? 'bg-[#1a6b3a] text-white' : 'bg-[#e8e8e8] text-[#aaa]'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search + level filter */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center border border-[#e8e8e8] rounded-xl px-3 py-2 bg-white">
            <Search className="w-3.5 h-3.5 text-[#aaa] mr-2 flex-shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Name, ID, email or dept…"
              className="flex-1 text-xs outline-none bg-transparent"
            />
          </div>
          {levels.length > 0 && (
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              className="border border-[#e8e8e8] rounded-xl px-2 py-2 text-xs bg-white outline-none text-[#0a0a0a] font-semibold">
              <option value="all">All levels</option>
              {levels.map(l => <option key={l} value={l}>{l}L</option>)}
            </select>
          )}
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-[10px] text-[#aaa] font-medium">
            {filtered.length} of {baseList.length} {tab === 'pwa' ? 'PWA' : ''} students
            {levelFilter !== 'all' ? ` · ${levelFilter}L` : ''}
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
              {tab === 'pwa' && !query && !levelFilter
                ? 'No students have installed the PWA yet'
                : 'No students match your search'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(s => <StudentCard key={s.id} student={s} />)}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
