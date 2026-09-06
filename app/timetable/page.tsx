'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { Plus, Trash2, Clock } from 'lucide-react'

type ClassEntry = { course:string; venue:string; time:string; duration:string; color:string }
type Schedule = Record<string, ClassEntry[]>
const DAYS   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const TIMES  = ['7:00','8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']
const COLORS = ['#1a6b3a','#2563eb','#7c3aed','#d97706','#dc2626','#0284c7','#059669','#db2777']
const KEY    = 'mouau_timetable'
const EMPTY:ClassEntry = { course:'', venue:'', time:'7:00', duration:'1', color:'#1a6b3a' }

export default function TimetablePage() {
  const [schedule,  setSchedule]  = useState<Schedule>({})
  const [activeDay, setActiveDay] = useState('Monday')
  const [adding,    setAdding]    = useState(false)
  const [entry,     setEntry]     = useState<ClassEntry>({...EMPTY})

  useEffect(()=>{
    try{ const s=localStorage.getItem(KEY); if(s) setSchedule(JSON.parse(s)) }catch{}
  },[])

  const save=(s:Schedule)=>{ setSchedule(s); localStorage.setItem(KEY,JSON.stringify(s)) }
  const addClass = () => {
    if(!entry.course.trim()) return
    const updated={...schedule,[activeDay]:[...(schedule[activeDay]||[]),entry].sort((a,b)=>a.time.localeCompare(b.time))}
    save(updated); setAdding(false); setEntry({...EMPTY})
  }
  const deleteClass=(day:string,i:number)=>{
    const updated={...schedule,[day]:(schedule[day]||[]).filter((_,j)=>j!==i)}
    save(updated)
  }
  const dayClasses = schedule[activeDay]||[]
  const totalWeekClasses = Object.values(schedule).reduce((s,c)=>s+(c?.length||0),0)

  return (
    <AppShell>
      <TopBar title="My Timetable" subtitle="Weekly class schedule"/>
      <div className="max-w-2xl mx-auto p-4 pb-24 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          {[['Classes Today', dayClasses.length],['Week Total', totalWeekClasses],['Days Planned', Object.keys(schedule).filter(d=>(schedule[d]?.length||0)>0).length]].map(([l,v])=>(
            <div key={String(l)} className="card p-3.5 text-center">
              <div className="font-black text-xl text-[#0a0a0a]">{v}</div>
              <div className="text-[10px] text-[#aaa] uppercase tracking-wide mt-0.5">{l}</div>
            </div>
          ))}
        </div>

        {/* Day tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {DAYS.map(d=>(
            <button key={d} onClick={()=>setActiveDay(d)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all relative ${activeDay===d?'bg-[#0a0a0a] text-white':'bg-white border border-[#e8e8e8] text-[#6b6b6b]'}`}>
              {d.slice(0,3)}
              {(schedule[d]?.length||0)>0&&(
                <span className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center ${activeDay===d?'bg-[#1a6b3a] text-white':'bg-[#1a6b3a] text-white'}`}>
                  {schedule[d]?.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Classes for active day */}
        <div className="space-y-2.5">
          {dayClasses.length===0 ? (
            <div className="card p-8 text-center">
              <Clock className="w-8 h-8 text-[#ddd] mx-auto mb-2"/>
              <p className="text-sm font-semibold text-[#0a0a0a]">No classes on {activeDay}</p>
              <p className="text-xs text-[#aaa] mt-1">Tap + below to add a class</p>
            </div>
          ) : dayClasses.map((c,i)=>(
            <div key={i} className="card flex items-center gap-3 p-3.5 overflow-hidden">
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{background:c.color}}/>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#0a0a0a] text-sm truncate">{c.course}</p>
                <p className="text-[11px] text-[#6b6b6b] truncate">{c.venue}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-[#0a0a0a]">{c.time}</p>
                <p className="text-[10px] text-[#aaa]">{c.duration}hr{parseInt(c.duration)>1?'s':''}</p>
              </div>
              <button onClick={()=>deleteClass(activeDay,i)} className="text-red-300 hover:text-red-500 p-1 transition-colors">
                <Trash2 className="w-4 h-4"/>
              </button>
            </div>
          ))}
        </div>

        {/* Add class form */}
        {adding ? (
          <div className="card p-4 space-y-3">
            <p className="font-bold text-[#0a0a0a] text-sm">Add Class — {activeDay}</p>
            <div>
              <label className="text-[10px] text-[#aaa] uppercase tracking-wide">Course Name *</label>
              <input value={entry.course} onChange={e=>setEntry(x=>({...x,course:e.target.value}))}
                placeholder="e.g. MTH 101" className="input mt-1 text-sm"/>
            </div>
            <div>
              <label className="text-[10px] text-[#aaa] uppercase tracking-wide">Venue</label>
              <input value={entry.venue} onChange={e=>setEntry(x=>({...x,venue:e.target.value}))}
                placeholder="e.g. LT1, Block C" className="input mt-1 text-sm"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#aaa] uppercase tracking-wide">Start Time</label>
                <select value={entry.time} onChange={e=>setEntry(x=>({...x,time:e.target.value}))} className="input mt-1 text-sm">
                  {TIMES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#aaa] uppercase tracking-wide">Duration (hrs)</label>
                <select value={entry.duration} onChange={e=>setEntry(x=>({...x,duration:e.target.value}))} className="input mt-1 text-sm">
                  {['1','1.5','2','2.5','3'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#aaa] uppercase tracking-wide mb-1.5 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c=>(
                  <button key={c} onClick={()=>setEntry(x=>({...x,color:c}))}
                    className={`w-7 h-7 rounded-full transition-all ${entry.color===c?'ring-2 ring-offset-2 ring-[#0a0a0a] scale-110':''}`}
                    style={{background:c}}/>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={()=>{ setAdding(false); setEntry({...EMPTY}) }}
                className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">Cancel</button>
              <button onClick={addClass}
                className="flex-1 py-2.5 bg-[#1a6b3a] rounded-xl text-sm font-bold text-white">Save Class</button>
            </div>
          </div>
        ) : (
          <button onClick={()=>setAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#1a6b3a]/30 rounded-xl text-[#1a6b3a] font-semibold text-sm hover:bg-[#1a6b3a]/5 transition-colors">
            <Plus className="w-4 h-4"/> Add Class on {activeDay}
          </button>
        )}
      </div>
    </AppShell>
  )
}
