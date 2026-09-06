'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { supabase } from '@/lib/supabase'
import { Calendar, MapPin, Clock, Loader2, Star, Tag } from 'lucide-react'
import { format, isPast, isToday, isTomorrow } from 'date-fns'

type Event = { id:string; title:string; description:string; location:string; event_date:string; category:string; organizer:string; important:boolean }
const CATS = ['All','Academic','Ceremony','Social','Sports']
const CAT_COLORS:Record<string,string> = { academic:'#1a6b3a', ceremony:'#d97706', social:'#7c3aed', sports:'#2563eb', general:'#6b6b6b', religious:'#e11d48' }

export default function EventsPage() {
  const [events,  setEvents]  = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [cat,     setCat]     = useState('All')

  useEffect(() => {
    setLoading(true)
    let q = supabase.from('campus_events').select('*').eq('active',true).order('event_date',{ascending:true})
    if (cat!=='All') q = q.eq('category', cat.toLowerCase())
    q.then(({data})=>{ setEvents((data as Event[])||[]); setLoading(false) })
  },[cat])

  const dateLabel = (d:string) => {
    const date = new Date(d)
    if (isPast(date))    return {label:'Past',    dim:true}
    if (isToday(date))   return {label:'Today',   dim:false}
    if (isTomorrow(date)) return {label:'Tomorrow',dim:false}
    return {label:format(date,'MMM d'), dim:false}
  }

  return (
    <AppShell>
      <TopBar title="Campus Events" subtitle="Upcoming events and deadlines"/>
      <div className="max-w-2xl mx-auto p-4 pb-24 space-y-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${cat===c?'bg-[#0a0a0a] text-white':'bg-white border border-[#e8e8e8] text-[#6b6b6b]'}`}>
              {c}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : events.length===0 ? (
          <div className="card p-10 text-center">
            <Calendar className="w-8 h-8 text-[#ddd] mx-auto mb-3"/>
            <p className="text-sm font-semibold text-[#0a0a0a]">No upcoming events</p>
          </div>
        ) : events.map(ev=>{
          const {label,dim} = dateLabel(ev.event_date)
          const color = CAT_COLORS[ev.category]||'#6b6b6b'
          return (
            <div key={ev.id} className={`card overflow-hidden ${dim?'opacity-60':''}`}>
              <div className="flex items-stretch">
                <div className="w-14 flex flex-col items-center justify-center py-4 flex-shrink-0" style={{background:color+'18'}}>
                  <span className="text-[9px] font-bold uppercase" style={{color}}>{label}</span>
                  <span className="text-xl font-black text-[#0a0a0a] leading-tight">{format(new Date(ev.event_date),'d')}</span>
                  <span className="text-[9px] text-[#aaa]">{format(new Date(ev.event_date),'MMM')}</span>
                </div>
                <div className="flex-1 p-3.5 min-w-0">
                  <div className="flex items-start gap-1.5 mb-1">
                    {ev.important&&<Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0 mt-0.5"/>}
                    <p className="font-bold text-[#0a0a0a] text-sm leading-tight">{ev.title}</p>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase mb-2" style={{background:color+'20',color}}>{ev.category}</span>
                  {ev.description&&<p className="text-[#6b6b6b] text-xs leading-relaxed line-clamp-2 mb-2">{ev.description}</p>}
                  <div className="space-y-1">
                    {ev.location&&<div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#aaa]"/><p className="text-[10px] text-[#6b6b6b] truncate">{ev.location}</p></div>}
                    <div className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-[#aaa]"/><p className="text-[10px] text-[#6b6b6b]">{format(new Date(ev.event_date),'h:mm a')}</p></div>
                    {ev.organizer&&<div className="flex items-center gap-1.5"><Tag className="w-3 h-3 text-[#aaa]"/><p className="text-[10px] text-[#6b6b6b]">{ev.organizer}</p></div>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
