'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Info, GraduationCap, UserCheck } from 'lucide-react'

type Step = {
  id: string; step_number: number; title: string; description: string
  substeps: string[]; sort_order: number; active: boolean; student_type: string
}

export default function RegisterPage() {
  const { student } = useAuth()
  const isFresher = !student?.level || student.level === '100'
  const studentType = isFresher ? 'new' : 'returning'

  const [steps,    setSteps]    = useState<Step[]>([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['']))
  const [checked,  setChecked]  = useState<Record<string, boolean>>({})
  const [saving,   setSaving]   = useState<string | null>(null)

  useEffect(() => {
    supabase.from('registration_steps')
      .select('*')
      .eq('active', true)
      .eq('student_type', studentType)
      .order('sort_order')
      .then(({ data }) => {
        const parsed = (data || []).map((s: any) => ({
          ...s,
          substeps: Array.isArray(s.substeps) ? s.substeps : (() => { try { return JSON.parse(s.substeps || '[]') } catch { return [] } })()
        }))
        setSteps(parsed as Step[])
        setLoading(false)
        if (parsed.length > 0) setExpanded(new Set([parsed[0].id]))
      })

    // Load progress
    const progressKey = `reg_progress_${student?.idNumber}_${studentType}`
    try {
      const local = localStorage.getItem(progressKey)
      if (local) setChecked(JSON.parse(local))
    } catch {}

    if (student?.idNumber) {
      supabase.from('student_progress')
        .select('step_key, done')
        .eq('student_id', student.idNumber)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const map: Record<string, boolean> = {}
            data.forEach((d: any) => { if (d.step_key.startsWith(studentType + '_') || !d.step_key.startsWith('returning_')) map[d.step_key] = d.done })
            setChecked(map)
            localStorage.setItem(progressKey, JSON.stringify(map))
          }
        })
    }
  }, [student?.idNumber, studentType])

  const toggle = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const check = async (key: string, val: boolean) => {
    setSaving(key)
    const updated = { ...checked, [key]: val }
    setChecked(updated)
    const progressKey = `reg_progress_${student?.idNumber}_${studentType}`
    localStorage.setItem(progressKey, JSON.stringify(updated))
    if (student?.idNumber) {
      await supabase.from('student_progress').upsert(
        { student_id: student.idNumber, step_key: key, done: val },
        { onConflict: 'student_id,step_key' }
      )
    }
    setSaving(null)
  }

  // Stats
  const allSubsteps = steps.flatMap(s => s.substeps.map((_, i) => `${s.id}_${i}`))
  const doneCount   = allSubsteps.filter(k => checked[k]).length
  const totalCount  = allSubsteps.length
  const pct         = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <AppShell>
      <TopBar title="Registration Guide" subtitle="Step-by-step admission checklist"/>

      <div className="px-4 py-4 pb-28 space-y-4">

        {/* Student type badge */}
        <div className={`flex items-center gap-2.5 p-3 rounded-2xl border
          ${isFresher ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
          {isFresher
            ? <UserCheck className="w-4 h-4 text-amber-600 flex-shrink-0"/>
            : <GraduationCap className="w-4 h-4 text-[#1e3a8a] flex-shrink-0"/>}
          <div>
            <p className={`text-xs font-bold ${isFresher ? 'text-amber-800' : 'text-[#1e3a8a]'}`}>
              {isFresher ? 'New Student Guide (100 Level)' : `Returning Student Guide (${student?.level || '200'} Level)`}
            </p>
            <p className={`text-[10px] ${isFresher ? 'text-amber-600' : 'text-blue-600'}`}>
              {isFresher ? 'Admission, JAMB & first-time registration steps' : 'Course registration, fees & semester clearance'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="card p-3.5">
            <div className="flex justify-between text-[10px] text-[#aaa] mb-1.5">
              <span>Progress</span>
              <span className="font-bold text-[#0a0a0a]">{doneCount}/{totalCount} steps · {pct}%</span>
            </div>
            <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width:`${pct}%`, background: isFresher ? 'linear-gradient(90deg,#d97706,#f59e0b)' : 'linear-gradient(90deg,#1e3a8a,#3b82f6)' }}/>
            </div>
          </div>
        )}

        {/* Info banner */}
        <div className="flex items-start gap-2.5 bg-[#f0f9f4] border border-[#1a6b3a]/20 rounded-2xl p-3">
          <Info className="w-4 h-4 text-[#1a6b3a] flex-shrink-0 mt-0.5"/>
          <p className="text-[11px] text-[#1a6b3a] leading-relaxed">
            {isFresher
              ? 'Complete all steps in order. Bring original documents + photocopies. Contact ICT Centre for portal issues.'
              : 'Complete course registration each semester. Pay fees early to avoid portal lockout. Keep your matric number handy.'}
          </p>
        </div>

        {/* Steps */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-[#1a6b3a] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : steps.length === 0 ? (
          <div className="card p-10 text-center">
            <GraduationCap className="w-10 h-10 text-[#ddd] mx-auto mb-2"/>
            <p className="text-sm text-[#aaa]">No guide available yet</p>
            <p className="text-[11px] text-[#ccc] mt-1">Admin will add steps soon</p>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, idx) => {
              const isOpen   = expanded.has(step.id)
              const stepDone = step.substeps.every((_, i) => checked[`${step.id}_${i}`])
              const stepPct  = step.substeps.length > 0
                ? Math.round((step.substeps.filter((_, i) => checked[`${step.id}_${i}`]).length / step.substeps.length) * 100) : 0
              const doneInStep = step.substeps.filter((_, i) => checked[`${step.id}_${i}`]).length

              return (
                <div key={step.id} className={`card overflow-hidden transition-all ${stepDone ? 'border-[#1a6b3a]/30' : ''}`}>
                  <button onClick={() => toggle(step.id)}
                    className="w-full flex items-center gap-3 p-4 text-left">
                    {/* Step number / done indicator */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm transition-all
                      ${stepDone ? 'bg-[#1a6b3a] text-white' : 'bg-[#f0f0f0] text-[#6b6b6b]'}`}>
                      {stepDone ? <CheckCircle2 className="w-5 h-5"/> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${stepDone ? 'text-[#1a6b3a]' : 'text-[#0a0a0a]'}`}>{step.title}</p>
                      <p className="text-[10px] text-[#aaa] mt-0.5 truncate">{step.description}</p>
                      {step.substeps.length > 0 && !isOpen && (
                        <p className="text-[10px] text-[#aaa] mt-0.5">{doneInStep}/{step.substeps.length} sub-steps</p>
                      )}
                    </div>
                    {step.substeps.length > 0 && !isOpen && (
                      <span className="text-[10px] font-bold text-[#aaa] mr-1">{stepPct}%</span>
                    )}
                    {isOpen ? <ChevronDown className="w-4 h-4 text-[#aaa] flex-shrink-0"/> : <ChevronRight className="w-4 h-4 text-[#aaa] flex-shrink-0"/>}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-[#f5f5f5] pt-3 space-y-2.5">
                      {step.substeps.map((sub, i) => {
                        const key  = `${step.id}_${i}`
                        const done = !!checked[key]
                        return (
                          <button key={i} onClick={() => check(key, !done)}
                            className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all
                              ${done ? 'bg-[#f0f9f4] opacity-80' : 'hover:bg-[#f9f9f7]'}`}>
                            <div className="mt-0.5 flex-shrink-0">
                              {saving === key ? (
                                <div className="w-4 h-4 border-2 border-[#1a6b3a] border-t-transparent rounded-full animate-spin"/>
                              ) : done ? (
                                <CheckCircle2 className="w-4 h-4 text-[#1a6b3a]"/>
                              ) : (
                                <Circle className="w-4 h-4 text-[#ccc]"/>
                              )}
                            </div>
                            <span className={`text-xs leading-relaxed ${done ? 'line-through text-[#aaa]' : 'text-[#0a0a0a]'}`}>{sub}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
