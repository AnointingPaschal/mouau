'use client'
import { useState, useEffect, useRef } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Camera, Save, Loader2, CheckCircle2, User, Mail, Phone, BookOpen, GraduationCap, Download, LogOut } from 'lucide-react'

export default function ProfilePage() {
  const { student, logout } = useAuth()
  const [avatarUrl, setAvatarUrl]   = useState<string|null>(null)
  const [uploading, setUploading]   = useState(false)
  const [saved, setSaved]           = useState(false)
  const [dbStudent, setDbStudent]   = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(()=>{
    if(!student?.idNumber) return
    supabase.from('students').select('*').eq('id_number', student.idNumber).single()
      .then(({data})=>{ if(data){ setDbStudent(data); if(data.avatar_url) setAvatarUrl(data.avatar_url) } })
  },[student?.idNumber])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${student?.idNumber}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('materials').upload(path, file, { contentType: file.type, upsert: true })
    if(!error){
      const { data:{ publicUrl }} = supabase.storage.from('materials').getPublicUrl(path)
      setAvatarUrl(publicUrl)
      await supabase.from('students').update({ avatar_url: publicUrl }).eq('id_number', student?.idNumber)
      setSaved(true); setTimeout(()=>setSaved(false), 2500)
    }
    setUploading(false)
  }

  const av = (student?.name||'ST').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
  const downloads = parseInt(localStorage.getItem(`downloads_${student?.idNumber}`) || '0')

  return (
    <AppShell>
      <TopBar title="My Profile" subtitle="Your student profile"/>
      <div className="max-w-lg mx-auto p-4 lg:p-5 pb-24 space-y-4 animate-fade-in">

        {/* Avatar section */}
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#1a6b3a]/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt={student?.name||''} className="w-full h-full object-cover"/>
              ) : (
                <div className="w-full h-full bg-[#1a6b3a] flex items-center justify-center">
                  <span className="text-white font-black text-3xl">{av}</span>
                </div>
              )}
            </div>
            {/* Camera button */}
            <button onClick={()=>fileRef.current?.click()} disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#1a6b3a] rounded-full flex items-center justify-center shadow-lg hover:bg-[#145530] transition-colors border-2 border-white">
              {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin"/> : <Camera className="w-4 h-4 text-white"/>}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload}/>
          </div>
          <h2 className="font-black text-[#0a0a0a] text-xl">{student?.name}</h2>
          <p className="text-[#6b6b6b] text-sm mt-0.5">{student?.idNumber}</p>
          {saved && (
            <div className="flex items-center gap-1.5 mt-2 text-[#1a6b3a] text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5"/> Avatar updated!
            </div>
          )}
          <p className="text-[10px] text-[#aaa] mt-2">Tap the camera icon to change your photo</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label:'Level', value: student?.level||'100' },
            { label:'Downloads', value: downloads || dbStudent?.downloads || 0 },
            { label:'Points', value: dbStudent?.points || 0 },
          ].map(s=>(
            <div key={s.label} className="card p-3.5 text-center">
              <div className="font-black text-lg text-[#0a0a0a]">{s.value}</div>
              <div className="text-[10px] text-[#aaa] uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Profile info */}
        <div className="card divide-y divide-[#f0f0f0]">
          {[
            { icon:<User className="w-4 h-4 text-[#1a6b3a]"/>,        label:'Full Name',   value: student?.name || '—' },
            { icon:<GraduationCap className="w-4 h-4 text-[#1a6b3a]"/>,label:'ID Number',   value: student?.idNumber || '—' },
            { icon:<BookOpen className="w-4 h-4 text-[#1a6b3a]"/>,    label:'Department',  value: dbStudent?.department || '—' },
            { icon:<Mail className="w-4 h-4 text-[#1a6b3a]"/>,        label:'Email',       value: dbStudent?.email || '—' },
            { icon:<Phone className="w-4 h-4 text-[#1a6b3a]"/>,       label:'WhatsApp',    value: dbStudent?.whatsapp || '—' },
          ].map(item=>(
            <div key={item.label} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-shrink-0">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">{item.label}</p>
                <p className="text-sm text-[#0a0a0a] font-medium truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sign out */}
        <button onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 border border-red-100 rounded-xl text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4"/> Sign Out
        </button>
      </div>
    </AppShell>
  )
}
