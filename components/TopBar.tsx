'use client'
import { useAuth } from './AuthProvider'
import { Bell, Search, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'

type Notif = { id:string; type:string; title:string; body:string; post_id:string; actor:string; read:boolean; created_at:string }

export default function TopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { student } = useAuth()
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery]           = useState('')
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs]         = useState<Notif[]>([])
  const [unread, setUnread]         = useState(0)
  const [avatarUrl, setAvatarUrl]   = useState<string|null>(null)
  const router = useRouter()
  const h = new Date().getHours()
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  const av = (student?.name||'ST').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)

  useEffect(()=>{
    if(!student?.idNumber) return
    // Load notifications
    const loadNotifs = async () => {
      const { data } = await supabase.from('notifications')
        .select('*').eq('recipient_id', student.idNumber)
        .order('created_at', { ascending:false }).limit(20)
      if(data){ setNotifs(data as Notif[]); setUnread(data.filter((n:Notif)=>!n.read).length) }
    }
    loadNotifs()
    // Load avatar
    supabase.from('students').select('avatar_url').eq('id_number', student.idNumber).single()
      .then(({data})=>{ if(data?.avatar_url) setAvatarUrl(data.avatar_url) })
    // Subscribe to new notifications
    const sub = supabase.channel('notifs-'+student.idNumber)
      .on('postgres_changes',{ event:'INSERT', schema:'public', table:'notifications', filter:`recipient_id=eq.${student.idNumber}` },
        payload => {
          setNotifs(prev => [payload.new as Notif, ...prev])
          setUnread(u => u + 1)
        })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  },[student?.idNumber])

  const markAllRead = async () => {
    if(!student?.idNumber) return
    await supabase.from('notifications').update({ read:true }).eq('recipient_id', student.idNumber).eq('read', false)
    setNotifs(prev => prev.map(n=>({...n, read:true}))); setUnread(0)
  }

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    if(query.trim()) { router.push(`/library?search=${encodeURIComponent(query)}`); setShowSearch(false); setQuery('') }
  }

  const notifIcon = (type: string) => {
    if(type==='comment')  return '💬'
    if(type==='reaction') return '👍'
    if(type==='announcement') return '📢'
    return '🔔'
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#e8e8e8] px-4 lg:px-5 py-2.5">
        <div className="flex items-center justify-between">
          <div>
            {title ? (
              <><h1 className="font-black text-[#0a0a0a] text-sm leading-tight">{title}</h1>
              {subtitle && <p className="text-[11px] text-[#aaa]">{subtitle}</p>}</>
            ) : (
              <><p className="text-[11px] text-[#aaa]">{greet},</p>
              <h1 className="font-black text-[#0a0a0a] text-sm">{student?.name?.split(' ')[0]||'Student'}</h1></>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {showSearch ? (
              <form onSubmit={search} className="flex items-center">
                <input autoFocus value={query} onChange={e=>setQuery(e.target.value)}
                  onBlur={()=>{ if(!query) setShowSearch(false) }}
                  placeholder="Search library..." className="input w-40 lg:w-52 text-xs py-1.5"/>
              </form>
            ) : (
              <button onClick={()=>setShowSearch(true)} className="p-1.5 rounded-lg hover:bg-[#f9f9f7] text-[#aaa] hover:text-[#0a0a0a] transition-all">
                <Search className="w-4 h-4"/>
              </button>
            )}
            {/* Notification bell */}
            <div className="relative">
              <button onClick={()=>{ setShowNotifs(p=>!p); if(!showNotifs&&unread>0) markAllRead() }}
                className="relative p-1.5 rounded-lg hover:bg-[#f9f9f7] text-[#aaa] transition-all">
                <Bell className="w-4 h-4" fill={unread>0?'#1a6b3a':'none'} color={unread>0?'#1a6b3a':'#aaa'}/>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 animate-pulse">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
            </div>
            {/* Avatar */}
            <button onClick={()=>router.push('/profile')}
              className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#1a6b3a]/30 hover:ring-[#1a6b3a] transition-all">
              {avatarUrl ? (
                <img src={avatarUrl} alt={student?.name||''} className="w-full h-full object-cover"/>
              ) : (
                <div className="w-full h-full bg-[#1a6b3a] flex items-center justify-center">
                  <span className="text-white font-bold text-[10px]">{av}</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Notification panel */}
      {showNotifs && (
        <>
          <div className="fixed inset-0 z-40" onClick={()=>setShowNotifs(false)}/>
          <div className="fixed top-14 right-3 z-50 w-80 bg-white border border-[#e8e8e8] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e8e8]">
              <p className="font-black text-[#0a0a0a] text-sm">Notifications</p>
              <button onClick={()=>setShowNotifs(false)} className="p-1 rounded-full hover:bg-[#f9f9f7]"><X className="w-3.5 h-3.5 text-[#aaa]"/></button>
            </div>
            <div className="overflow-y-auto max-h-80">
              {notifs.length===0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-[#ddd] mx-auto mb-2"/>
                  <p className="text-xs text-[#aaa]">No notifications yet</p>
                </div>
              ) : notifs.map(n=>(
                <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-[#f5f5f5] hover:bg-[#f9f9f7] transition-colors ${!n.read?'bg-[#f0f9f4]':''}`}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{notifIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#0a0a0a] leading-tight">{n.title}</p>
                    {n.body&&<p className="text-[10px] text-[#6b6b6b] mt-0.5 truncate">{n.body}</p>}
                    <p className="text-[10px] text-[#aaa] mt-1">{formatDistanceToNow(new Date(n.created_at),{addSuffix:true})}</p>
                  </div>
                  {!n.read&&<div className="w-2 h-2 bg-[#1a6b3a] rounded-full flex-shrink-0 mt-1"/>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
