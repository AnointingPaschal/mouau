'use client'
import { useEffect, useState, useCallback } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import {
  Loader2, Search, GraduationCap, BookOpen, ChevronDown,
  RefreshCw, X, CheckCircle2, Edit2, Ban, ShieldCheck, AlertCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type Student = {
  id: string; id_number: string; name: string; email: string; whatsapp: string
  department: string; college: string; level: string; downloads: number
  student_type: string; jamb_number: string; matric_number: string
  semester: string; cgpa: number; created_at: string
}

const TYPE_COLORS = {
  fresher:   { bg: 'bg-[#f0faf4]', text: 'text-[#1a6b3a]', border: 'border-[#1a6b3a]/20', label: 'Fresher', icon: GraduationCap },
  returning: { bg: 'bg-[#eff6ff]', text: 'text-[#2563eb]', border: 'border-[#2563eb]/20', label: 'Returning', icon: BookOpen },
}

function Toast({ msg, type = 'success', onClose }: { msg: string; type?: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 text-white text-xs px-4 py-2.5 rounded-full flex items-center gap-2 z-50 shadow-xl ${type === 'error' ? 'bg-red-600' : 'bg-[#0a0a0a]'}`}>
      {type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]" /> : <AlertCircle className="w-3.5 h-3.5" />}
      {msg}
    </div>
  )
}

function EditModal({ student, token, onClose, onSaved }: {
  student: Student; token: string; onClose: () => void; onSaved: () => void
}) {
  const [type,  setType]  = useState<'fresher' | 'returning'>(student.student_type as any || 'fresher')
  const [level, setLevel] = useState(student.level || '100')
  const [matric, setMatric] = useState(student.matric_number || '')
  const [jamb,   setJamb]   = useState(student.jamb_number || '')
  const [dept,   setDept]   = useState(student.department || '')
  const [saving, setSaving] = useState(false)

  const LEVELS = type === 'fresher'
    ? ['100', '200', '300', '400', '500', '600', '700']
    : ['200', '300', '400', '500', '600', '700']

  const save = async () => {
    setSaving(true)
    await fetch('/api/admin/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        id: student.id_number,
        student_type: type, level,
        matric_number: matric.trim().toUpperCase(),
        jamb_number: jamb.trim().toUpperCase(),
        department: dept
      })
    })
    setSaving(false); onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-bold text-[#0a0a0a] flex-1">Edit Student</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-[#aaa]" /></button>
        </div>
        <div className="mb-3">
          <p className="font-semibold text-[#0a0a0a] text-sm">{student.name}</p>
          <p className="text-[10px] text-[#aaa] font-mono">{student.id_number}</p>
        </div>
        <div className="space-y-3">
          {/* Type toggle */}
          <div>
            <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1.5">Student Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['fresher', 'returning'] as const).map(t => {
                const tc = TYPE_COLORS[t]
                const Icon = tc.icon
                return (
                  <button key={t} onClick={() => { setType(t); setLevel(t === 'fresher' ? '100' : '200') }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${type === t ? `${tc.bg} ${tc.border}` : 'border-[#e8e8e8]'}`}>
                    <Icon className={`w-3.5 h-3.5 ${type === t ? tc.text : 'text-[#aaa]'}`} />
                    <span className={`text-xs font-bold ${type === t ? tc.text : 'text-[#6b6b6b]'}`}>{tc.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1.5">Level</label>
            <select value={level} onChange={e => setLevel(e.target.value)}
              className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1a6b3a]">
              {LEVELS.map(l => <option key={l} value={l}>{l}L</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1.5">JAMB Number</label>
            <input value={jamb} onChange={e => setJamb(e.target.value.toUpperCase())}
              placeholder="10-11 digit number" className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-[#1a6b3a]" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1.5">Matric Number</label>
            <input value={matric} onChange={e => setMatric(e.target.value.toUpperCase())}
              placeholder="MOUAU/DEPT/YY/NUMBER" className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-[#1a6b3a]" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1.5">Department</label>
            <input value={dept} onChange={e => setDept(e.target.value)}
              placeholder="e.g. Computer Science" className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1a6b3a]" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-xs font-bold text-[#6b6b6b]">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 bg-[#1a6b3a] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StudentsPage() {
  const { token } = useAdmin()
  const [students,  setStudents]  = useState<Student[]>([])
  const [loading,   setLoading]   = useState(true)
  const [query,     setQuery]     = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'fresher' | 'returning'>('all')
  const [editing,   setEditing]   = useState<Student | null>(null)
  const [toast,     setToast]     = useState('')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    const { data } = await fetch('/api/admin/students', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    setStudents(data || [])
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  const showToast = (m: string) => setToast(m)

  const filtered = students.filter(s => {
    if (typeFilter !== 'all' && (s.student_type || 'fresher') !== typeFilter) return false
    if (!query) return true
    const q = query.toLowerCase()
    return s.name?.toLowerCase().includes(q) || s.id_number?.toLowerCase().includes(q)
      || s.email?.toLowerCase().includes(q) || s.matric_number?.toLowerCase().includes(q)
      || s.jamb_number?.toLowerCase().includes(q)
  })

  const fresherCount   = students.filter(s => !s.student_type || s.student_type === 'fresher').length
  const returningCount = students.filter(s => s.student_type === 'returning').length

  return (
    <AdminShell>
      <div className="p-5 lg:p-8 max-w-4xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1">ADMIN</p>
            <h1 className="text-xl font-black text-[#0a0a0a]">Students</h1>
            <p className="text-[#6b6b6b] text-sm mt-1">{students.length} total</p>
          </div>
          <button onClick={load} className="p-2 rounded-xl hover:bg-[#f0f0f0]"><RefreshCw className="w-4 h-4 text-[#aaa]" /></button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Total', value: students.length, color: '#0a0a0a' },
            { label: 'Freshers', value: fresherCount, color: '#1a6b3a' },
            { label: 'Returning', value: returningCount, color: '#2563eb' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-[#e8e8e8] rounded-xl p-3.5 text-center">
              <div className="text-2xl font-black" style={{ color }}>{value}</div>
              <div className="text-[9px] font-bold text-[#aaa] uppercase tracking-wide mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 flex-1 border border-[#e8e8e8] rounded-xl px-3 py-2 bg-white">
            <Search className="w-3.5 h-3.5 text-[#aaa]" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search name, JAMB, matric, email..." className="flex-1 text-xs outline-none bg-transparent" />
            {query && <button onClick={() => setQuery('')}><X className="w-3.5 h-3.5 text-[#aaa]" /></button>}
          </div>
          <div className="flex rounded-xl overflow-hidden border border-[#e8e8e8]">
            {(['all', 'fresher', 'returning'] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-2 text-[10px] font-bold capitalize transition-colors ${typeFilter === t ? 'bg-[#0a0a0a] text-white' : 'bg-white text-[#6b6b6b]'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#e8e8e8] rounded-2xl p-10 text-center">
            <p className="text-[#aaa] text-sm">No students found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(s => {
              const type = (s.student_type || 'fresher') as 'fresher' | 'returning'
              const tc = TYPE_COLORS[type]
              const Icon = tc.icon
              return (
                <div key={s.id} className="bg-white border border-[#e8e8e8] rounded-xl p-3.5 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.bg}`}>
                    <Icon className={`w-4 h-4 ${tc.text}`} />
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-0.5">
                    <div className="col-span-2 lg:col-span-1">
                      <p className="font-bold text-[#0a0a0a] text-sm truncate">{s.name || 'No name'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tc.bg} ${tc.text}`}>{tc.label}</span>
                        <span className="text-[9px] text-[#aaa]">{s.level}L</span>
                        {s.cgpa > 0 && <span className="text-[9px] text-[#aaa]">CGPA: {s.cgpa}</span>}
                      </div>
                    </div>
                    <div>
                      {s.jamb_number && <p className="text-[10px] text-[#6b6b6b] font-mono truncate">JAMB: {s.jamb_number}</p>}
                      {s.matric_number && <p className="text-[10px] text-[#6b6b6b] font-mono truncate">Matric: {s.matric_number}</p>}
                      {!s.jamb_number && !s.matric_number && <p className="text-[10px] text-[#aaa] font-mono">{s.id_number}</p>}
                    </div>
                    <div className="hidden lg:block">
                      {s.department && <p className="text-[10px] text-[#6b6b6b] truncate">{s.department}</p>}
                      {s.email && <p className="text-[10px] text-[#aaa] truncate">{s.email}</p>}
                    </div>
                  </div>
                  <button onClick={() => setEditing(s)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0f0f0] flex-shrink-0">
                    <Edit2 className="w-3.5 h-3.5 text-[#6b6b6b]" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editing && (
        <EditModal student={editing} token={token || ''}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); showToast('Student updated!'); load() }} />
      )}
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
    </AdminShell>
  )
}
