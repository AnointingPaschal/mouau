'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { REGISTRATION_STEPS } from '@/lib/data'
import { getRegistrationProgress, saveRegistrationProgress } from '@/lib/auth'
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Award, FileText, Info } from 'lucide-react'

export default function RegisterPage() {
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState<string | null>('1')

  useEffect(() => { setProgress(getRegistrationProgress()) }, [])

  const toggle = (id: string) => {
    const updated = { ...progress, [id]: !progress[id] }
    setProgress(updated)
    saveRegistrationProgress(updated)
  }

  const totalSteps = REGISTRATION_STEPS.reduce((a, s) => a + s.substeps.length, 0)
  const completed = Object.values(progress).filter(Boolean).length
  const percent = Math.round((completed / totalSteps) * 100)

  const stepDone = (step: typeof REGISTRATION_STEPS[0]) =>
    step.substeps.every(sub => progress[sub.id])

  return (
    <AppShell>
      <TopBar title="Registration Guide" subtitle="Your step-by-step admission checklist"/>
      <div className="p-4 lg:p-6 space-y-5 animate-fade-in">

        {/* Progress Card */}
        <div className="bg-green-gradient rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-black text-xl">Registration Progress</h2>
              <p className="text-white/70 text-sm">2024/2025 Academic Session</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-white">{percent}%</div>
              <div className="text-white/60 text-xs">{completed}/{totalSteps} steps</div>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{width:`${percent}%`}}/>
          </div>
          {percent === 100 && (
            <div className="mt-3 flex items-center gap-2 bg-gold/20 rounded-xl px-4 py-2">
              <Award className="w-5 h-5 text-gold"/>
              <span className="text-gold font-bold text-sm">Registration Complete!</span>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="card p-4 flex items-start gap-3 border-l-4 border-l-blue-400 bg-blue-50">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="font-semibold text-blue-800 text-sm">First-time students</p>
            <p className="text-blue-600 text-xs mt-0.5 leading-relaxed">
              Complete all steps in order. Bring all original documents and photocopies to campus.
              Contact the ICT Centre (+234 902 434 8507) for portal access issues.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {REGISTRATION_STEPS.map((step, idx) => {
            const isOpen = open === step.id
            const done = stepDone(step)
            const partialDone = step.substeps.some(s => progress[s.id])

            return (
              <div key={step.id} className={`card overflow-hidden transition-all duration-200 ${done ? 'border-green-200 bg-green-50/50' : ''}`}>
                <button onClick={() => setOpen(isOpen ? null : step.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50/80 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all ${
                    done ? 'bg-mouau text-white' : partialDone ? 'bg-gold text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {done ? <CheckCircle2 className="w-5 h-5"/> : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-mouau-dark text-sm">{step.title}</h3>
                      {done && <span className="badge badge-green text-[10px]">Done</span>}
                      {partialDone && !done && <span className="badge badge-gold text-[10px]">In Progress</span>}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{step.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {isOpen ? <ChevronDown className="w-5 h-5 text-gray-400"/> : <ChevronRight className="w-5 h-5 text-gray-400"/>}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 p-4 space-y-3 animate-fade-in">
                    {step.substeps.map(sub => (
                      <label key={sub.id} className="flex items-start gap-3 cursor-pointer group">
                        <div className="mt-0.5 flex-shrink-0" onClick={() => toggle(sub.id)}>
                          {progress[sub.id] ? (
                            <CheckCircle2 className="w-5 h-5 text-mouau"/>
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 group-hover:text-mouau/50 transition-colors"/>
                          )}
                        </div>
                        <span className={`text-sm leading-relaxed transition-colors ${
                          progress[sub.id] ? 'text-gray-400 line-through' : 'text-gray-700'
                        }`}>{sub.text}</span>
                      </label>
                    ))}

                    {done && (
                      <div className="mt-2 pt-2 border-t border-green-100 flex items-center gap-2 text-mouau">
                        <CheckCircle2 className="w-4 h-4"/>
                        <span className="text-sm font-semibold">Step completed!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Documents Needed */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-mouau"/>
            <h3 className="font-bold text-mouau-dark">Documents to Bring</h3>
          </div>
          <div className="space-y-2">
            {[
              'JAMB Notification of Admission',
              'WAEC/NECO/NABTEB Certificate (Original + 3 copies)',
              'JAMB Result Slip',
              'Birth Certificate or Declaration of Age',
              '4 Recent Passport Photographs (white background)',
              'School Fees Payment Receipt',
              'Acceptance Fee Payment Receipt',
              'Local Government Identification Letter',
            ].map(doc => (
              <div key={doc} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2 flex-shrink-0"/>
                <p className="text-gray-600 text-sm">{doc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Help Contact */}
        <div className="card p-4 bg-mouau-surface border-mouau/10">
          <p className="font-semibold text-mouau text-sm mb-1">Need help?</p>
          <p className="text-gray-600 text-xs leading-relaxed">
            Visit the ICT Centre or Admin Block for assistance. You can also ask our AI Assistant any registration questions.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
