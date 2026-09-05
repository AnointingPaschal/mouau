'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { REGISTRATION_STEPS } from '@/lib/data'
import { getRegistrationProgress, saveRegistrationProgress } from '@/lib/auth'
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Award, FileText, Info } from 'lucide-react'

export default function RegisterPage() {
  const [progress, setProgress] = useState<Record<string,boolean>>({})
  const [open, setOpen] = useState<string|null>('1')

  useEffect(() => { setProgress(getRegistrationProgress()) }, [])

  const toggle = (id: string) => {
    const updated = { ...progress, [id]: !progress[id] }
    setProgress(updated)
    saveRegistrationProgress(updated)
  }

  const total = REGISTRATION_STEPS.reduce((a,s)=>a+s.substeps.length,0)
  const done = Object.values(progress).filter(Boolean).length
  const pct = Math.round((done/total)*100)
  const stepDone = (s: typeof REGISTRATION_STEPS[0]) => s.substeps.every(sub=>progress[sub.id])

  return (
    <AppShell>
      <TopBar title="Registration Guide" subtitle="Step-by-step admission checklist"/>
      <div className="p-3 lg:p-4 space-y-3 animate-fade-in">

        {/* Progress */}
        <div className="bg-green-gradient rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <h2 className="text-white font-black text-sm">Registration Progress</h2>
              <p className="text-white/60 text-[10px]">2024/2025 Academic Session</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-white">{pct}%</div>
              <div className="text-white/50 text-[10px]">{done}/{total}</div>
            </div>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`}}/></div>
          {pct===100&&(
            <div className="mt-2 flex items-center gap-1.5 bg-gold/20 rounded-lg px-3 py-1.5">
              <Award className="w-3.5 h-3.5 text-gold"/>
              <span className="text-gold font-bold text-xs">Registration Complete!</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="card p-3 flex items-start gap-2 border-l-4 border-l-blue-400 bg-blue-50">
          <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5"/>
          <p className="text-blue-700 text-[10px] leading-relaxed">Complete all steps in order. Bring original documents + photocopies. Contact ICT Centre for portal issues.</p>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {REGISTRATION_STEPS.map((step,idx)=>{
            const isOpen = open===step.id
            const isDone = stepDone(step)
            const partial = step.substeps.some(s=>progress[s.id])
            return (
              <div key={step.id} className={`card overflow-hidden ${isDone?'border-green-200 bg-green-50/30':''}`}>
                <button onClick={()=>setOpen(isOpen?null:step.id)} className="w-full flex items-center gap-3 p-3 text-left">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs transition-all ${isDone?'bg-mouau text-white':partial?'bg-gold text-white':'bg-gray-100 text-gray-500'}`}>
                    {isDone?<CheckCircle2 className="w-3.5 h-3.5"/>:idx+1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-mouau-dark text-xs">{step.title}</h3>
                      {isDone&&<span className="badge badge-green text-[9px]">Done</span>}
                      {partial&&!isDone&&<span className="badge badge-gold text-[9px]">In Progress</span>}
                    </div>
                    <p className="text-gray-400 text-[10px]">{step.description}</p>
                  </div>
                  {isOpen?<ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"/>:<ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"/>}
                </button>
                {isOpen&&(
                  <div className="border-t border-gray-100 p-3 space-y-2 animate-fade-in">
                    {step.substeps.map(sub=>(
                      <label key={sub.id} className="flex items-start gap-2 cursor-pointer group">
                        <div className="mt-0.5 flex-shrink-0" onClick={()=>toggle(sub.id)}>
                          {progress[sub.id]?<CheckCircle2 className="w-4 h-4 text-mouau"/>:<Circle className="w-4 h-4 text-gray-300 group-hover:text-mouau/50"/>}
                        </div>
                        <span className={`text-xs leading-relaxed ${progress[sub.id]?'text-gray-400 line-through':'text-gray-700'}`}>{sub.text}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Documents */}
        <div className="card p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <FileText className="w-3.5 h-3.5 text-mouau"/>
            <h3 className="font-bold text-mouau-dark text-xs">Documents to Bring</h3>
          </div>
          <div className="space-y-1.5">
            {['JAMB Notification of Admission','WAEC/NECO Certificate (Original + 3 copies)','JAMB Result Slip','Birth Certificate','4 Passport Photographs (white bg)','School Fees Receipt','Acceptance Fee Receipt','L.G.A. Identification Letter'].map(doc=>(
              <div key={doc} className="flex items-start gap-1.5">
                <div className="w-1 h-1 rounded-full bg-gold mt-1.5 flex-shrink-0"/>
                <p className="text-gray-600 text-[10px] leading-relaxed">{doc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
