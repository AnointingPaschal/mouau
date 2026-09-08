'use client'
import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Save, Loader2, TrendingUp, ChevronDown, ChevronUp, X, Award } from 'lucide-react'

type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
type Course = { code: string; title: string; units: number; grade: Grade; score: number }
type Semester = { id?: string; session: string; semester: '1st' | '2nd'; level: string; courses: Course[]; gpa: number }

const GRADE_POINTS: Record<Grade, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 }
const GRADE_COLORS: Record<Grade, string> = { A: '#1a6b3a', B: '#2563eb', C: '#d97706', D: '#f97316', E: '#e11d48', F: '#6b6b6b' }
const GRADES: Grade[] = ['A', 'B', 'C', 'D', 'E', 'F']
const LEVELS = ['100', '200', '300', '400', '500', '600', '700']
const SESSIONS = ['2024/2025', '2023/2024', '2022/2023', '2021/2022', '2020/2021', '2019/2020']

function calcGPA(courses: Course[]): number {
  const total = courses.reduce((s, c) => s + c.units, 0)
  if (!total) return 0
  const points = courses.reduce((s, c) => s + (GRADE_POINTS[c.grade] || 0) * c.units, 0)
  return parseFloat((points / total).toFixed(2))
}

function calcCGPA(semesters: Semester[]): number {
  const allCourses = semesters.flatMap(s => s.courses)
  return calcGPA(allCourses)
}

function GPABar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = (value / max) * 100
  const color = value >= 4.5 ? '#1a6b3a' : value >= 3.5 ? '#2563eb' : value >= 2.4 ? '#d97706' : '#e11d48'
  return (
    <div className="w-full h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function cgpaClass(c: number): { label: string; color: string } {
  if (c >= 4.5) return { label: 'First Class Honours', color: '#1a6b3a' }
  if (c >= 3.5) return { label: 'Second Class Upper', color: '#2563eb' }
  if (c >= 2.4) return { label: 'Second Class Lower', color: '#d97706' }
  if (c >= 1.5) return { label: 'Third Class', color: '#f97316' }
  return { label: 'Pass', color: '#e11d48' }
}

export default function CGPAPage() {
  const { student } = useAuth()
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving,  setSaving]      = useState<string | null>(null)
  const [editing, setEditing]     = useState<string | null>(null) // open semester key
  const [toast,   setToast]       = useState('')

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const load = useCallback(async () => {
    if (!student?.idNumber) return
    const { data } = await supabase.from('student_cgpa').select('*')
      .eq('student_id', student.idNumber).order('session').order('semester')
    setSemesters((data || []).map((d: any) => ({
      ...d,
      courses: Array.isArray(d.courses) ? d.courses : JSON.parse(d.courses || '[]')
    })) as Semester[])
    setLoading(false)
  }, [student?.idNumber])

  useEffect(() => { load() }, [load])

  const semKey = (s: Semester) => `${s.session}-${s.semester}`

  const addSemester = () => {
    const newSem: Semester = {
      session: '2024/2025', semester: '1st', level: student?.level || '100',
      courses: [{ code: '', title: '', units: 2, grade: 'A', score: 70 }], gpa: 0
    }
    setSemesters(prev => [...prev, newSem])
    setEditing(semKey(newSem) + '-new')
  }

  const updateSemester = (idx: number, updates: Partial<Semester>) => {
    setSemesters(prev => prev.map((s, i) => i === idx ? { ...s, ...updates, gpa: calcGPA(updates.courses || s.courses) } : s))
  }

  const addCourse = (idx: number) => {
    const courses = [...semesters[idx].courses, { code: '', title: '', units: 2, grade: 'A' as Grade, score: 70 }]
    updateSemester(idx, { courses })
  }

  const updateCourse = (semIdx: number, courseIdx: number, updates: Partial<Course>) => {
    const courses = semesters[semIdx].courses.map((c, i) => i === courseIdx ? { ...c, ...updates } : c)
    updateSemester(semIdx, { courses })
  }

  const removeCourse = (semIdx: number, courseIdx: number) => {
    const courses = semesters[semIdx].courses.filter((_, i) => i !== courseIdx)
    updateSemester(semIdx, { courses })
  }

  const saveSemester = async (idx: number) => {
    if (!student?.idNumber) return
    const sem = semesters[idx]
    setSaving(semKey(sem))
    const payload = {
      student_id: student.idNumber, session: sem.session, semester: sem.semester,
      level: sem.level, courses: sem.courses, gpa: calcGPA(sem.courses), updated_at: new Date().toISOString()
    }
    if (sem.id) {
      await supabase.from('student_cgpa').update(payload).eq('id', sem.id)
    } else {
      const { data } = await supabase.from('student_cgpa').upsert(payload, { onConflict: 'student_id,session,semester' }).select().single()
      if (data) setSemesters(prev => prev.map((s, i) => i === idx ? { ...s, id: data.id } : s))
    }
    setSaving(null)
    setEditing(null)
    showToast('Semester saved!')
    load()
  }

  const deleteSemester = async (idx: number) => {
    if (!confirm('Delete this semester?')) return
    const sem = semesters[idx]
    if (sem.id) await supabase.from('student_cgpa').delete().eq('id', sem.id)
    setSemesters(prev => prev.filter((_, i) => i !== idx))
    showToast('Semester deleted')
  }

  const cgpa = calcCGPA(semesters)
  const cls = cgpaClass(cgpa)
  const totalUnits = semesters.flatMap(s => s.courses).reduce((sum, c) => sum + c.units, 0)

  return (
    <AppShell>
      <TopBar title="CGPA Calculator" subtitle="Track your academic performance" />
      <div className="p-4 lg:p-6 pb-24 max-w-2xl space-y-5">
        {/* CGPA Summary Card */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a] rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest">Cumulative GPA</p>
              <div className="text-5xl font-black mt-1">{semesters.length ? cgpa.toFixed(2) : '—'}</div>
              <div className="text-sm font-bold mt-1" style={{ color: cls.color }}>{semesters.length ? cls.label : 'No data yet'}</div>
            </div>
            <div className="text-right space-y-2">
              <div>
                <div className="text-xl font-black">{semesters.length}</div>
                <div className="text-white/30 text-[9px] uppercase">Semesters</div>
              </div>
              <div>
                <div className="text-xl font-black">{totalUnits}</div>
                <div className="text-white/30 text-[9px] uppercase">Units</div>
              </div>
            </div>
          </div>
          {semesters.length > 0 && <GPABar value={cgpa} />}
          {/* Per-semester GPAs */}
          {semesters.length > 1 && (
            <div className="mt-4 space-y-1.5">
              {semesters.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] text-white/40 w-28 flex-shrink-0">{s.session} {s.semester}</span>
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#60a5fa] transition-all" style={{ width: `${(s.gpa / 5) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-white w-8 text-right">{s.gpa.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Semester */}
        <button onClick={addSemester}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#e8e8e8] rounded-2xl text-sm font-bold text-[#6b6b6b] hover:border-[#1a6b3a] hover:text-[#1a6b3a] transition-all">
          <Plus className="w-4 h-4" /> Add Semester
        </button>

        {/* Semesters */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#1a6b3a]" /></div>
        ) : semesters.map((sem, idx) => {
          const key = semKey(sem) + (sem.id ? '' : '-new')
          const isOpen = editing === key
          const gpa = calcGPA(sem.courses)
          return (
            <div key={idx} className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
              {/* Semester header */}
              <div className="flex items-center gap-3 p-4">
                <button onClick={() => setEditing(isOpen ? null : key)} className="flex-1 flex items-center gap-3 text-left">
                  <div className="w-10 h-10 bg-[#7c3aed]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-[#7c3aed]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0a0a0a] text-sm">{sem.session} · {sem.semester} Semester</p>
                    <p className="text-[10px] text-[#aaa]">{sem.level}L · {sem.courses.length} courses · {sem.courses.reduce((s, c) => s + c.units, 0)} units</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-black text-[#0a0a0a]">{gpa.toFixed(2)}</div>
                    <div className="text-[9px] text-[#aaa]">GPA</div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#aaa]" /> : <ChevronDown className="w-4 h-4 text-[#aaa]" />}
                </button>
              </div>
              {/* Expanded editor */}
              {isOpen && (
                <div className="border-t border-[#f0f0f0] p-4 space-y-4">
                  {/* Semester meta */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1">Session</label>
                      <select value={sem.session} onChange={e => updateSemester(idx, { session: e.target.value })}
                        className="w-full border border-[#e8e8e8] rounded-xl px-2 py-1.5 text-xs outline-none focus:border-[#1a6b3a]">
                        {SESSIONS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1">Semester</label>
                      <select value={sem.semester} onChange={e => updateSemester(idx, { semester: e.target.value as any })}
                        className="w-full border border-[#e8e8e8] rounded-xl px-2 py-1.5 text-xs outline-none focus:border-[#1a6b3a]">
                        <option value="1st">1st</option><option value="2nd">2nd</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide block mb-1">Level</label>
                      <select value={sem.level} onChange={e => updateSemester(idx, { level: e.target.value })}
                        className="w-full border border-[#e8e8e8] rounded-xl px-2 py-1.5 text-xs outline-none focus:border-[#1a6b3a]">
                        {LEVELS.map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Courses */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide">Courses</p>
                      <button onClick={() => addCourse(idx)} className="text-[10px] font-bold text-[#1a6b3a] flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Course
                      </button>
                    </div>
                    <div className="space-y-2">
                      {sem.courses.map((course, ci) => (
                        <div key={ci} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-1.5 items-center">
                          <input value={course.code} onChange={e => updateCourse(idx, ci, { code: e.target.value.toUpperCase() })}
                            placeholder="CODE" className="border border-[#e8e8e8] rounded-lg px-2 py-1.5 text-xs font-mono w-20 outline-none focus:border-[#1a6b3a]" />
                          <input value={course.title} onChange={e => updateCourse(idx, ci, { title: e.target.value })}
                            placeholder="Course title" className="border border-[#e8e8e8] rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#1a6b3a]" />
                          <select value={course.units} onChange={e => updateCourse(idx, ci, { units: Number(e.target.value) })}
                            className="border border-[#e8e8e8] rounded-lg px-1 py-1.5 text-xs outline-none focus:border-[#1a6b3a] w-14">
                            {[1,2,3,4,5,6].map(u => <option key={u} value={u}>{u}u</option>)}
                          </select>
                          <select value={course.grade} onChange={e => updateCourse(idx, ci, { grade: e.target.value as Grade })}
                            className="border rounded-lg px-1 py-1.5 text-xs font-bold outline-none w-12"
                            style={{ borderColor: GRADE_COLORS[course.grade] + '60', color: GRADE_COLORS[course.grade], background: GRADE_COLORS[course.grade] + '10' }}>
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                          <button onClick={() => removeCourse(idx, ci)} className="w-6 h-6 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* GPA preview */}
                  <div className="bg-[#f9f9f7] rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#aaa] uppercase tracking-wide">Semester GPA</p>
                      <p className="text-xl font-black text-[#0a0a0a]">{gpa.toFixed(2)} / 5.00</p>
                    </div>
                    <GPABar value={gpa} />
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => deleteSemester(idx)}
                      className="flex items-center gap-1.5 px-3 py-2 text-red-500 bg-red-50 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                    <button onClick={() => saveSemester(idx)} disabled={saving === semKey(sem)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#1a6b3a] text-white rounded-xl text-xs font-bold disabled:opacity-60">
                      {saving === semKey(sem) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Semester
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {semesters.length === 0 && !loading && (
          <div className="bg-white border border-[#e8e8e8] rounded-2xl p-10 text-center">
            <TrendingUp className="w-10 h-10 text-[#e8e8e8] mx-auto mb-3" />
            <p className="font-bold text-[#0a0a0a] text-sm">No semesters yet</p>
            <p className="text-[#aaa] text-xs mt-1">Add your first semester to start tracking your CGPA</p>
          </div>
        )}
      </div>
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#0a0a0a] text-white text-xs px-4 py-2.5 rounded-full z-50">
          {toast}
        </div>
      )}
    </AppShell>
  )
}
