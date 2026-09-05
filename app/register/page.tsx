'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Info } from 'lucide-react'

type Step = {
  id: string; step_number: number; title: string; description: string
  substeps: string[]; sort_order: number; active: boolean
}

export default function RegisterPage() {
  const { student } = useAuth()
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['']))
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    // Load steps from DB
    supabase.from('registration_steps').select('*').eq('active', true).order('sort_order')
      .then(({ data }) => {
        const parsed = (data || []).map((s: any) => ({
          ...s,
          substeps: Array.isArray(s.substeps) ? s.substeps : (() => { try { return JSON.parse(s.substeps || '[]') } catch { return [] } })()
        }))
        setSteps(parsed as Step[])
        setLoading(false)
        // Auto-expand first incomplete step
        if (parsed.length > 0) setExpanded(new Set([parsed[0].id]))
      })

    // Load progress from localStorage (fast) and then sync from DB
    try {
      const local = localStorage.getItem(`reg_progress_${student?.idNumber}`)
      if (local) setChecked(JSON.parse(local))
    } catch {}

    if (student?.idNumber) {
      supabase.from('student_progress').select('step_key, done').eq('student_id', student.idNumber)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const map: Record<string, boolean> = {}
            data.forEach((d: any) => { map[d.step_key] = d.done })
            setChecked(map)
            localStorage.setItem(`reg_progress_${student.idNumber}`, JSON.stringify(map))
          }
        })
    }
  }, [student?.idNumber])

  const toggleExpand = (id: string) => {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  const toggleCheck = async (stepId: string, substepIdx: number) => {
    const key = `${stepId}-${substepIdx}`
    const newVal = !checked[key]
    const newChecked = { ...checked, [key]: newVal }
    setChecked(newChecked)
    localStorage.setItem(`reg_progress_${student?.idNumber}`, JSON.stringify(newChecked))

    if (!student?.idNumber) return
    setSaving(key)
    await supabase.from('student_progress').upsert(
      { student_id: student.idNumber, step_key: key, done: newVal },
      { onConflict: 'student_id,step_key' }
    )
    setSaving(null)
  }

  const isStepDone = (step: Step) => step.substeps.every((_, i) => checked[`${step.id}-${i}`])
  const isStepStarted = (step: Step) => step.substeps.some((_, i) => checked[`${step.id}-${i}`])
  const totalSubsteps = steps.reduce((acc, s) => acc + s.substeps.length, 0)
  const doneSubsteps = Object.values(checked).filter(Boolean).length
  const pct = totalSubsteps > 0 ? Math.round((doneSubsteps / totalSubsteps) * 100) : 0

  return (
    <AppShell>
      <TopBar title="Registration Guide" subtitle="Step-by-step admission checklist"/>
      <div className="p-4 lg:p-5 max-w-2xl mx-auto space-y-4 pb-24 lg:pb-6 animate-fade-in">

        {/* Progress card */}
        <div className="bg-[#1a6b3a] rounded-xl p-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-black text-lg">Registration Progress</p>
              <p className="text-white/60 text-xs mt-0.5">2024/2025 Academic Session</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black">{pct}%</div>
              <div className="text-white/50 text-[10px] uppercase tracking-wide">{doneSubsteps}/{totalSubsteps} steps</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${pct}%` }}/>
            </div>
          </div>
          {pct === 100 && (
            <div className="mt-3 bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white"/>
              <p className="text-white text-xs font-semibold">Registration complete! Congratulations.</p>
            </div>
          )}
        </div>

        {/* Info banner */}
        <div className="border-l-4 border-[#1a6b3a] bg-[#1a6b3a]/5 rounded-r-xl p-3.5 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#1a6b3a] flex-shrink-0 mt-0.5"/>
          <p className="text-[#0a0a0a] text-xs leading-relaxed font-medium">
            Complete all steps in order. Bring original documents + photocopies. Contact ICT Centre for portal issues.
          </p>
        </div>

        {/* Steps */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-[#f0f0f0] rounded w-1/2 mb-2"/>
                <div className="h-3 bg-[#f0f0f0] rounded w-3/4"/>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {steps.map((step, idx) => {
              const done = isStepDone(step)
              const started = isStepStarted(step)
              const open = expanded.has(step.id)

              return (
                <div key={step.id} className={`card overflow-hidden transition-all ${done ? 'border-[#1a6b3a]/30' : started ? 'border-[#1a6b3a]/15' : ''}`}>
                  {/* Step header */}
                  <button onClick={() => toggleExpand(step.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#fafafa] transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm transition-all ${done ? 'bg-[#1a6b3a] text-white' : started ? 'bg-[#1a6b3a]/10 text-[#1a6b3a] border-2 border-[#1a6b3a]/30' : 'bg-[#f9f9f7] text-[#aaa] border-2 border-[#e8e8e8]'}`}>
                      {done ? <CheckCircle2 className="w-4 h-4"/> : step.step_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${done ? 'text-[#1a6b3a]' : 'text-[#0a0a0a]'}`}>{step.title}</p>
                      <p className="text-[#aaa] text-[11px] mt-0.5 truncate">{step.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {started && !done && (
                        <span className="text-[9px] font-semibold text-[#1a6b3a] bg-[#1a6b3a]/10 px-2 py-0.5 rounded-full">
                          {step.substeps.filter((_, i) => checked[`${step.id}-${i}`]).length}/{step.substeps.length}
                        </span>
                      )}
                      {open ? <ChevronDown className="w-4 h-4 text-[#aaa]"/> : <ChevronRight className="w-4 h-4 text-[#aaa]"/>}
                    </div>
                  </button>

                  {/* Substeps */}
                  {open && step.substeps.length > 0 && (
                    <div className="border-t border-[#f0f0f0] divide-y divide-[#f9f9f7] animate-fade-in">
                      {step.substeps.map((sub, i) => {
                        const key = `${step.id}-${i}`
                        const isDone = !!checked[key]
                        const isSaving = saving === key

                        return (
                          <button key={i} onClick={() => toggleCheck(step.id, i)} disabled={isSaving}
                            className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all hover:bg-[#fafafa] active:bg-[#f0f0f0] ${isDone ? 'bg-[#1a6b3a]/3' : ''}`}>
                            <div className="flex-shrink-0 mt-0.5">
                              {isSaving ? (
                                <div className="w-5 h-5 border-2 border-[#1a6b3a]/30 border-t-[#1a6b3a] rounded-full animate-spin"/>
                              ) : isDone ? (
                                <CheckCircle2 className="w-5 h-5 text-[#1a6b3a]"/>
                              ) : (
                                <Circle className="w-5 h-5 text-[#ddd]"/>
                              )}
                            </div>
                            <p className={`text-sm leading-relaxed transition-all ${isDone ? 'text-[#6b6b6b] line-through' : 'text-[#0a0a0a]'}`}>{sub}</p>
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
