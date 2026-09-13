'use client'
import { useState, useEffect, useRef } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { 
  Camera, Save, Loader2, CheckCircle2, User, Mail, 
  Phone, BookOpen, GraduationCap, LogOut, Edit3, X, AlertCircle 
} from 'lucide-react'

export default function ProfilePage() {
  const { student, logout } = useAuth()
  
  // Profile & Avatar State
  const [avatarUrl, setAvatarUrl] = useState<string|null>(null)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved]         = useState(false)
  const [dbStudent, setDbStudent] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving]   = useState(false)
  const [errorMsg, setErrorMsg]   = useState('')
  const [formData, setFormData]   = useState({
    name: '',
    department: '',
    email: '',
    whatsapp: '',
    level: ''
  })

  // Fetch student data on mount
  useEffect(() => {
    if(!student?.idNumber) return
    supabase.from('students').select('*').eq('id_number', student.idNumber).single()
      .then(({data}) => { 
        if(data){ 
          setDbStudent(data)
          if(data.avatar_url) setAvatarUrl(data.avatar_url) 
          
          // Pre-fill form data
          setFormData({
            name: data.name || student.name || '',
            department: data.department || '',
            email: data.email || '',
            whatsapp: data.whatsapp || '',
            level: data.level || student.level || '100'
          })
        } 
      })
  }, [student?.idNumber, student?.name, student?.level])

  // Handle Avatar Upload
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

  // Handle Profile Save with Upsert Fallback and Error Handling
  const handleSaveProfile = async () => {
    setIsSaving(true)
    setErrorMsg('')

    // 1. Attempt standard update and select the modified row to confirm success
    const { data, error } = await supabase
      .from('students')
      .update({
        name: formData.name,
        department: formData.department,
        email: formData.email,
        whatsapp: formData.whatsapp,
        level: formData.level
      })
      .eq('id_number', student?.idNumber)
      .select()

    if (error) {
      console.error("Update error:", error)
      setErrorMsg(error.message)
    } else if (!data || data.length === 0) {
      // 2. If no error but no rows returned, the student record doesn't exist yet. Fallback to upsert.
      const { error: upsertError } = await supabase
        .from('students')
        .upsert({
          id_number: student?.idNumber,
          name: formData.name,
          department: formData.department,
          email: formData.email,
          whatsapp: formData.whatsapp,
          level: formData.level
        })

      if (upsertError) {
        console.error("Upsert error:", upsertError)
        setErrorMsg(upsertError.message)
      } else {
        handleSuccess()
      }
    } else {
      // 3. Update was successful
      handleSuccess()
    }
    setIsSaving(false)
  }

  const handleSuccess = () => {
    setDbStudent({ ...dbStudent, ...formData })
    setIsEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const [downloads, setDownloads] = useState(0)
  useEffect(()=>{ setDownloads(parseInt(localStorage.getItem(`downloads_${student?.idNumber}`) || '0')) },[student?.idNumber])

  // Display Name logic (prioritize updated db name, fallback to context name)
  const displayName = dbStudent?.name || student?.name || 'Student'
  const displayLevel = dbStudent?.level || student?.level || '100'
  const av = displayName.split(' ').map((w: string)=>w[0]).join('').toUpperCase().slice(0,2)

  return (
    <AppShell>
      <TopBar title="My Profile" subtitle="Your student profile"/>
      <div className="w-full p-4 lg:p-6 pb-24 space-y-4 animate-fade-in">

        {/* Avatar section */}
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#1a6b3a]/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover"/>
              ) : (
                <div className="w-full h-full bg-[#1a6b3a] flex items-center justify-center">
                  <span className="text-white font-black text-3xl">{av}</span>
                </div>
              )}
            </div>
            <button onClick={()=>fileRef.current?.click()} disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#1a6b3a] rounded-full flex items-center justify-center shadow-lg hover:bg-[#145530] transition-colors border-2 border-white">
              {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin"/> : <Camera className="w-4 h-4 text-white"/>}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload}/>
          </div>
          <h2 className="font-black text-[#0a0a0a] text-xl">{displayName}</h2>
          <p className="text-[#6b6b6b] text-sm mt-0.5">{student?.idNumber}</p>
          {saved && (
            <div className="flex items-center gap-1.5 mt-2 text-[#1a6b3a] text-xs font-semibold animate-slide-up">
              <CheckCircle2 className="w-3.5 h-3.5"/> Profile updated!
            </div>
          )}
          {/* Big visible Edit Profile button */}
          <button onClick={() => { setIsEditing(e => !e); setErrorMsg('') }}
            className={`mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${isEditing ? 'bg-[#f0f0f0] text-[#6b6b6b]' : 'bg-[#1a6b3a] text-white hover:bg-[#145530] active:scale-95'}`}>
            {isEditing ? <><X className="w-4 h-4"/> Cancel</> : <><Edit3 className="w-4 h-4"/> Edit Profile</>}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label:'Level', value: displayLevel },
            { label:'Downloads', value: downloads || dbStudent?.downloads || 0 },
            { label:'Points', value: dbStudent?.points || 0 },
          ].map(s=>(
            <div key={s.label} className="card p-3.5 text-center">
              <div className="font-black text-lg text-[#0a0a0a]">{s.value}</div>
              <div className="text-[10px] text-[#aaa] uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Profile Info / Edit Form */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] bg-[#f9f9f7]">
            <h3 className="text-xs font-bold text-[#0a0a0a] uppercase tracking-wide">Personal Details</h3>
            {!isEditing ? (
              <button onClick={() => { setIsEditing(true); setErrorMsg(''); }} className="text-[11px] font-semibold text-[#1a6b3a] flex items-center gap-1 bg-[#1a6b3a]/10 px-2.5 py-1 rounded-full hover:bg-[#1a6b3a]/20 transition-colors">
                <Edit3 className="w-3 h-3"/> Edit
              </button>
            ) : (
              <button onClick={() => { setIsEditing(false); setErrorMsg(''); }} className="text-[11px] font-semibold text-[#6b6b6b] flex items-center gap-1 bg-white border border-[#e8e8e8] px-2.5 py-1 rounded-full hover:bg-[#f0f0f0]">
                <X className="w-3 h-3"/> Cancel
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="divide-y divide-[#f0f0f0]">
              {[
                { icon:<User className="w-4 h-4 text-[#1a6b3a]"/>,        label:'Full Name',   value: displayName },
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
          ) : (
            <div className="p-4 space-y-4 animate-fade-in">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm focus:border-[#1a6b3a] outline-none transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">ID Number</label>
                <input 
                  type="text" 
                  value={student?.idNumber || ''} 
                  disabled
                  className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm bg-[#f9f9f7] text-[#6b6b6b] cursor-not-allowed"
                />
                <p className="text-[9px] text-[#aaa]">ID Number cannot be changed.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">Level</label>
                <select 
                  value={formData.level}
                  onChange={e => setFormData({...formData, level: e.target.value})}
                  className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm focus:border-[#1a6b3a] outline-none transition-colors bg-white"
                >
                  <option value="100">100 Level</option>
                  <option value="200">200 Level</option>
                  <option value="300">300 Level</option>
                  <option value="400">400 Level</option>
                  <option value="500">500 Level</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">Department</label>
                <input 
                  type="text" 
                  value={formData.department} 
                  onChange={e => setFormData({...formData, department: e.target.value})}
                  className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm focus:border-[#1a6b3a] outline-none transition-colors"
                  placeholder="e.g. Computer Science"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm focus:border-[#1a6b3a] outline-none transition-colors"
                  placeholder="student@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide">WhatsApp Number</label>
                <input 
                  type="tel" 
                  value={formData.whatsapp} 
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                  className="w-full border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm focus:border-[#1a6b3a] outline-none transition-colors"
                  placeholder="08012345678"
                />
              </div>

              {/* Explicit Error Display */}
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl mt-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-red-600 font-medium leading-relaxed">
                    Failed to save: {errorMsg}. <br />
                    <span className="text-[10px] font-normal">If this is an RLS policy issue, check your Supabase dashboard to ensure the user is allowed to update/insert.</span>
                  </p>
                </div>
              )}

              <button 
                onClick={handleSaveProfile} 
                disabled={isSaving}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
              >
                {isSaving ? <><Loader2 className="w-4 h-4 animate-spin"/> Saving...</> : <><Save className="w-4 h-4"/> Save Profile</>}
              </button>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 border border-red-100 bg-white rounded-xl text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors shadow-sm">
          <LogOut className="w-4 h-4"/> Sign Out
        </button>
      </div>
    </AppShell>
  )
}
