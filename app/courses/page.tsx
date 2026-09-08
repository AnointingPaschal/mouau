'use client'
import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Loader2, Book, Clock, MapPin, User, ChevronDown, ChevronUp, Save, X, CheckSquare, Square } from 'lucide-react'

type Course = {
  id?: string; student_id: string; session: string; semester: string; level: string
  code: string; title: string; units: number; lecturer: string; day: string; time: string; venue: string
  attendance: { date: string; present: boolean }[]
}

const DAYS   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SESSIONS = ['2024/2025', '2023/2024', '2022/2023', '2021/2022']
const LEVELS = ['100', '200', '300', '400', '500', '600', '700']

const emptyForm = (studentId: string, level: string): Partial<Course> => ({
  student_id: studentId, session: '2024/2025', semester: '1st', level,
  code: '', title: '', units: 2, lecturer: '', day: 'Monday', time: '', venue: '', attendance: []
})

function AttendanceTracker({ course, onUpdate }: { course: Course; onUpdate: (attendance: Course['attendance']) => void }) {
  const weeks = Array.from({ length: 16 }, (_, i) => `Week ${i + 1}`)
  const toggle = (idx: number) => {
    const a = [...(course.attendance || [])]
    a[idx] = { date: a[idx]?.date || weeks[idx], present: !a[idx]?.present }
    onUpdate(a)
  }
  const present = (course.attendance || []).filter(a => a?.present).length
  const total = weeks.length
  const pct = Math.round((present / total) * 100)
  const below75 = pct < 75
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide">Attendance</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${below75 ? 'bg-red-100 text-red-600' : 'bg-[#f0faf4] text-[#1a6b3a]'}`}>
          {present}/{total} · {pct}%
        </span>
      </div>
      {below75 && pct > 0 && (
        <p className="text-[10px] text-red-500 font-semibold mb-2">⚠️ Below 75% — you may be barred</p>
      )}
      <div className="grid grid-cols-8 gap-1">
        {weeks.map((w, i) => {
          const rec = (course.attendance || [])[i]
          const isPresent = rec?.present
          return (
            <button key={i} onClick={() => toggle(i)} title={w}
              className={`w-8 h-8 rounded-lg text-[9px] font-bold transition-all ${isPresent ? 'bg-[#1a6b3a] text-white' : 'bg-[#f0f0f0] text-[#aaa] hover:bg-[#e8e8e8]'}`}>
              {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function CoursesPage() {
  const { student } = useAuth()
  const [courses,  setCourses]  = useState<Course[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState<Partial<Course>>({})
  const [saving,   setSaving]   = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [session,  setSession]  = useState('2024/2025')
  const [sem,      setSem]      = useState<'1st' | '2nd'>('1st')
  const [toast,    setToast]    = useState('')

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const load = useCallback(async () => {
    if (!student?.idNumber) return
    setLoading(true)
    const { data } = await supabase.from('student_courses').select('*')
      .eq('student_id', student.idNumber).eq('session', session).eq('semester', sem)
      .order('day').order('time')
    setCourses((data || []).map((d: any) => ({
      ...d, attendance: Array.isArray(d.attendance) ? d.attendance : JSON.parse(d.attendance || '[]')
    })) as Course[])
    setLoading(false)
  }, [student?.idNumber, session, sem])

  useEffect(() => { load() }, [load])

  const set = (k: keyof Course, v: any) => setForm(f => ({ ...f, [k]: v }))

  const openNew = () => {
    setForm(emptyForm(student?.idNumber || '', student?.level || '200'))
    setShowForm(true)
  }

  const saveForm = async () => {
    if (!form.code?.trim() || !form.title?.trim()) { showToast('Course code and title are required'); return }
    setSaving(true)
    const payload = { ...form, updated_at: new Date().toISOString() }
    if (form.id) {
      await supabase.from('student_courses').update(payload).eq('id', form.id)
    } else {
      await supabase.from('student_courses').insert({ ...payload, student_id: student?.idNumber })
    }
    setSaving(false); setShowForm(false); showToast('Course saved!'); load()
  }

  const saveAttendance = async (course: Course) => {
    if (!course.id) return
    await supabase.from('student_courses').update({ attendance: course.attendance }).eq('id', course.id)
    showToast('Attendance saved')
  }

  const deleteCourse = async (id: string) => {
    if (!confirm('Remove this course?')) return
    await supabase.from('student_courses').delete().eq('id', id)
    showToast('Course removed'); load()
  }

  const totalUnits = courses.reduce((s, c) => s + c.units, 0)
  const groupedByDay = DAYS.reduce((acc, day) => {
    const dayCourses = courses.filter(c => c.day === day)
    if (dayCourses.length) acc[day] = dayCourses
    return acc
  }, {} as Record<string, Course[]>)

  const inputCls = "w-full border border-[#e8e8e8] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#1a6b3a] bg-white"

  return (
    <AppShell>
      <TopBar title="My Courses" subtitle="Current semester course tracker" />
      <div className="p-4 lg:p-6 pb-24 max-w-2xl space-y-4">
        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select value={session} onChange={e => setSession(e.target.value)} className="border border-[#e8e8e8] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#1a6b3a] bg-white">
            {SESSIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <div className="flex rounded-xl overflow-hidden border border-[#e8e8e8]">
            {(['1st', '2nd'] as const).map(s => (
              <button key={s} onClick={() => setSem(s)}
                className={`px-4 py-2 text-xs font-bold transition-colors ${sem === s ? 'bg-[#1a6b3a] text-white' : 'bg-white text-[#6b6b6b]'}`}>
                {s} Semester
              </button>
            ))}
          </div>
          <button onClick={openNew} className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#1a6b3a] text-white rounded-xl text-xs font-bold">
            <Plus className="w-3.5 h-3.5" /> Add Course
          </button>
        </div>

        {/* Summary */}
        {courses.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Courses', value: courses.length },
              { label: 'Credit Units', value: totalUnits },
              { label: 'Days/Week', value: Object.keys(groupedByDay).length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-[#e8e8e8] rounded-xl p-3 text-center">
                <div className="text-xl font-black text-[#0a0a0a]">{value}</div>
                <div className="text-[9px] font-bold text-[#aaa] uppercase tracking-wide mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#1a6b3a]" /></div>
        ) : courses.length === 0 ? (
          <div className="bg-white border border-[#e8e8e8] rounded-2xl p-10 text-center">
            <Book className="w-10 h-10 text-[#e8e8e8] mx-auto mb-3" />
            <p className="font-bold text-[#0a0a0a] text-sm">No courses yet</p>
            <p className="text-[#aaa] text-xs mt-1">Add courses for {session} {sem} semester</p>
          </div>
        ) : (
          /* By-day grouping */
          Object.entries(groupedByDay).map(([day, dayCourses]) => (
            <div key={day}>
              <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-2">{day}</p>
              <div className="space-y-2">
                {dayCourses.map(course => {
                  const isExp = expanded === course.id
                  const pct = course.attendance?.length ? Math.round((course.attendance.filter(a => a?.present).length / 16) * 100) : 0
                  return (
                    <div key={course.id} className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden">
                      <button onClick={() => setExpanded(isExp ? null : (course.id || null))} className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-[#f9f9f7]">
                        <div className="w-9 h-9 bg-[#1a6b3a]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Book className="w-4 h-4 text-[#1a6b3a]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-[#0a0a0a] text-xs font-mono">{course.code}</span>
                            <span className="text-[9px] font-semibold text-[#6b6b6b] bg-[#f0f0f0] px-1.5 py-0.5 rounded-full">{course.units}u</span>
                          </div>
                          <p className="text-xs text-[#374151] leading-snug truncate">{course.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {course.time && <span className="flex items-center gap-0.5 text-[9px] text-[#aaa]"><Clock className="w-2.5 h-2.5" />{course.time}</span>}
                            {course.venue && <span className="flex items-center gap-0.5 text-[9px] text-[#aaa]"><MapPin className="w-2.5 h-2.5" />{course.venue}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {pct > 0 && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${pct < 75 ? 'bg-red-100 text-red-600' : 'bg-[#f0faf4] text-[#1a6b3a]'}`}>{pct}%</span>}
                          {isExp ? <ChevronUp className="w-4 h-4 text-[#aaa]" /> : <ChevronDown className="w-4 h-4 text-[#aaa]" />}
                        </div>
                      </button>
                      {isExp && (
                        <div className="border-t border-[#f0f0f0] p-4 space-y-4">
                          {course.lecturer && (
                            <div className="flex items-center gap-2 text-xs text-[#6b6b6b]">
                              <User className="w-3.5 h-3.5" /> {course.lecturer}
                            </div>
                          )}
                          <AttendanceTracker course={course}
                            onUpdate={att => {
                              const updated = { ...course, attendance: att }
                              setCourses(prev => prev.map(c => c.id === course.id ? updated : c))
                              saveAttendance(updated)
                            }} />
                          <div className="flex gap-2">
                            <button onClick={() => { setForm(course); setShowForm(true) }}
                              className="flex-1 py-2 border border-[#e8e8e8] rounded-xl text-xs font-bold text-[#6b6b6b] hover:bg-[#f9f9f7]">
                              Edit
                            </button>
                            <button onClick={() => deleteCourse(course.id!)}
                              className="px-3 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 p-4 border-b border-[#e8e8e8]">
              <h3 className="font-bold text-[#0a0a0a] flex-1">{form.id ? 'Edit Course' : 'Add Course'}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-[#aaa]" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1">Course Code *</label>
                  <input value={form.code || ''} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. CSC 301" className={inputCls + ' font-mono'} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1">Units *</label>
                  <select value={form.units || 2} onChange={e => set('units', Number(e.target.value))} className={inputCls}>
                    {[1,2,3,4,5,6].map(u => <option key={u} value={u}>{u} units</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1">Course Title *</label>
                <input value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="e.g. Data Structures and Algorithms" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1">Lecturer</label>
                <input value={form.lecturer || ''} onChange={e => set('lecturer', e.target.value)} placeholder="e.g. Dr. Okafor" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1">Day</label>
                  <select value={form.day || 'Monday'} onChange={e => set('day', e.target.value)} className={inputCls}>
                    {DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1">Time</label>
                  <input value={form.time || ''} onChange={e => set('time', e.target.value)} placeholder="e.g. 8:00 AM" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1">Venue</label>
                <input value={form.venue || ''} onChange={e => set('venue', e.target.value)} placeholder="e.g. SLT 1, COE Building" className={inputCls} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-xs font-bold text-[#6b6b6b]">Cancel</button>
                <button onClick={saveForm} disabled={saving} className="flex-1 py-2.5 bg-[#1a6b3a] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#0a0a0a] text-white text-xs px-4 py-2.5 rounded-full z-50">{toast}</div>}
    </AppShell>
  )
}
