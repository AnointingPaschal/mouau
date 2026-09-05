'use client'
import { useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { updateStudent } from '@/lib/auth'
import { COLLEGES, DEPARTMENTS } from '@/lib/data'
import { User, Mail, Phone, GraduationCap, Building2, Save, CheckCircle2, Award, Download, Shield, LogOut, Edit2 } from 'lucide-react'

export default function ProfilePage() {
  const { student, setStudent, logout } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name:student?.name||'', email:student?.email||'', phone:student?.phone||'',
    department:student?.department||'', college:student?.college||'', level:student?.level||'100'
  })
  const depts = form.college?(DEPARTMENTS[form.college]||[]):[]

  const save = () => {
    const updated = updateStudent({ ...form })
    if (updated) setStudent(updated)
    setEditing(false); setSaved(true)
    setTimeout(()=>setSaved(false),3000)
  }

  return (
    <AppShell>
      <TopBar title="My Profile" subtitle="Your student account"/>
      <div className="p-3 lg:p-4 space-y-3 animate-fade-in">

        {/* Profile Header */}
        <div className="bg-green-gradient rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-black text-lg">{student?.avatar||'S'}</span>
              </div>
              <div>
                <h2 className="font-black text-sm text-white">{student?.name}</h2>
                <p className="text-white/60 text-[10px]">{student?.idNumber}</p>
                <p className="text-white/50 text-[10px]">{student?.department||'Department not set'}</p>
              </div>
            </div>
            <button onClick={()=>setEditing(!editing)} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all">
              <Edit2 className="w-3.5 h-3.5 text-white"/>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{l:'Level',v:`${student?.level||100}L`},{l:'Points',v:student?.points||0},{l:'Downloads',v:student?.downloads||0}].map(({l,v})=>(
              <div key={l} className="bg-white/10 rounded-lg p-2 text-center">
                <div className="text-white font-black text-sm">{v}</div>
                <div className="text-white/50 text-[10px]">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {saved&&<div className="flex items-center gap-1.5 p-2.5 bg-green-50 border border-green-100 rounded-lg animate-fade-in"><CheckCircle2 className="w-3.5 h-3.5 text-mouau"/><span className="text-mouau font-semibold text-xs">Saved!</span></div>}

        {/* Edit Form */}
        {editing&&(
          <div className="card p-3 space-y-2.5 animate-fade-in">
            <h3 className="font-bold text-mouau-dark text-xs">Edit Information</h3>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Full Name</label>
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input"/>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Email</label>
                <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="input" type="email"/>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Phone</label>
                <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="input" type="tel"/>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 mb-1 block">College</label>
              <select value={form.college} onChange={e=>setForm({...form,college:e.target.value,department:''})} className="input py-1.5 text-[10px]">
                <option value="">Select college...</option>
                {COLLEGES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Department</label>
              <select value={form.department} onChange={e=>setForm({...form,department:e.target.value})} className="input py-1.5 text-[10px]" disabled={!form.college}>
                <option value="">Select dept...</option>
                {depts.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Level</label>
              <select value={form.level} onChange={e=>setForm({...form,level:e.target.value})} className="input py-1.5 text-[10px]">
                {['100','200','300','400','500'].map(l=><option key={l} value={l}>{l} Level</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={save} className="btn-primary flex-1 flex items-center justify-center gap-1"><Save className="w-3 h-3"/>Save</button>
              <button onClick={()=>setEditing(false)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        )}

        {/* Info Display */}
        {!editing&&(
          <div className="card p-3 space-y-2">
            {[
              {icon:User,l:'Name',v:student?.name||'Not set'},
              {icon:Mail,l:'Email',v:student?.email||'Not set'},
              {icon:Phone,l:'Phone',v:student?.phone||'Not set'},
              {icon:Building2,l:'College',v:student?.college||'Not set'},
              {icon:GraduationCap,l:'Department',v:student?.department||'Not set'},
            ].map(({icon:Icon,l,v})=>(
              <div key={l} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <div className="w-6 h-6 bg-mouau-surface rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3 h-3 text-mouau"/>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-gray-400">{l}</p>
                  <p className="font-semibold text-gray-800 text-xs truncate">{v}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Achievements */}
        <div className="card p-3">
          <h3 className="font-bold text-mouau-dark text-xs mb-2">Achievements</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              {icon:Award,l:'FreshStart',d:'Joined the platform',c:'text-gold',bg:'bg-amber-50',earned:true},
              {icon:Download,l:'First Download',d:'Downloaded a material',c:'text-purple-600',bg:'bg-purple-50',earned:false},
              {icon:Shield,l:'Verified',d:'Complete your profile',c:'text-mouau',bg:'bg-mouau-surface',earned:!!(student?.college&&student?.department)},
              {icon:User,l:'Active Member',d:'Post in the forum',c:'text-blue-600',bg:'bg-blue-50',earned:false},
            ].map(({icon:Icon,l,d,c,bg,earned})=>(
              <div key={l} className={`p-2.5 rounded-xl border ${earned?'border-mouau/20 bg-white':'border-gray-100 bg-gray-50 opacity-50'}`}>
                <div className={`w-6 h-6 ${bg} rounded-lg flex items-center justify-center mb-1.5`}><Icon className={`w-3 h-3 ${c}`}/></div>
                <p className="font-bold text-[10px] text-gray-800">{l}</p>
                <p className="text-gray-400 text-[9px]">{d}</p>
                {earned&&<span className="badge badge-green text-[9px] mt-1">Earned</span>}
              </div>
            ))}
          </div>
        </div>

        <button onClick={logout} className="w-full card p-3 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 transition-all text-xs font-semibold">
          <LogOut className="w-3.5 h-3.5"/> Sign Out
        </button>
        <p className="text-center text-[10px] text-gray-300 pb-2">MOUAU FreshStart v1.0 · 2024/2025</p>
      </div>
    </AppShell>
  )
}
