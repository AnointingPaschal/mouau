'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { updateStudent } from '@/lib/auth'
import { COLLEGES, DEPARTMENTS } from '@/lib/data'
import {
  User, Mail, Phone, GraduationCap, Building2, Edit2, Save,
  X, CheckCircle2, Star, Download, TrendingUp, LogOut, Shield, Bell
} from 'lucide-react'

export default function ProfilePage() {
  const { student, setStudent, logout } = useAuth()
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({
    name: student?.name || '',
    email: student?.email || '',
    phone: student?.phone || '',
    department: student?.department || '',
    college: student?.college || '',
    level: student?.level || '100',
  })

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        department: student.department || '',
        college: student.college || '',
        level: student.level || '100',
      })
    }
  }, [student])

  const save = () => {
    const updated = updateStudent(form)
    if (updated) {
      setStudent(updated)
      setEditing(false)
      showToast('Profile updated successfully!')
    }
  }

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 3000)
  }

  const departments = form.college ? (DEPARTMENTS[form.college] || []) : []

  const stats = [
    { label:'Points', value: student?.points || 0, icon:Star, color:'text-amber-600', bg:'bg-amber-50' },
    { label:'Downloads', value: student?.downloads || 0, icon:Download, color:'text-purple-600', bg:'bg-purple-50' },
    { label:'Level', value: `${student?.level || 100}L`, icon:GraduationCap, color:'text-mouau', bg:'bg-mouau-surface' },
    { label:'Progress', value: `0%`, icon:TrendingUp, color:'text-blue-600', bg:'bg-blue-50' },
  ]

  const initials = (student?.name || 'ST').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)

  return (
    <AppShell>
      <TopBar title="My Profile" subtitle="Manage your MOUAU account"/>
      <div className="p-4 lg:p-6 space-y-5 animate-fade-in">

        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-mouau text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-slide-up">
            <CheckCircle2 className="w-4 h-4 text-green-300"/>
            <span className="text-sm font-medium">{toast}</span>
          </div>
        )}

        {/* Avatar Card */}
        <div className="bg-green-gradient rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full"/>
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-20 h-20 bg-gold rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-black text-3xl">{initials}</span>
            </div>
            <div>
              <h2 className="text-white font-black text-xl">{student?.name || 'MOUAU Student'}</h2>
              <p className="text-white/70 text-sm mt-0.5">{student?.idNumber}</p>
              {student?.department && (
                <span className="inline-block mt-2 bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full">
                  {student.department} · {student.level || 100}L
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-3 text-center">
              <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center mx-auto mb-1.5`}>
                <Icon className={`w-4 h-4 ${color}`}/>
              </div>
              <div className={`font-black text-base ${color}`}>{value}</div>
              <div className="text-gray-400 text-[10px]">{label}</div>
            </div>
          ))}
        </div>

        {/* Profile Form */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-mouau-dark text-base">Personal Information</h3>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm text-mouau font-semibold bg-mouau-surface px-3 py-1.5 rounded-xl hover:bg-green-100 transition-all">
                <Edit2 className="w-3.5 h-3.5"/> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 font-medium px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-all">
                  <X className="w-3.5 h-3.5"/> Cancel
                </button>
                <button onClick={save}
                  className="flex items-center gap-1.5 text-sm bg-mouau text-white font-semibold px-3 py-1.5 rounded-xl hover:bg-mouau-mid transition-all">
                  <Save className="w-3.5 h-3.5"/> Save
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5 block">
                <User className="w-3.5 h-3.5"/> Full Name
              </label>
              {editing ? (
                <input value={form.name} onChange={e => setForm({...form,name:e.target.value})}
                  className="input" placeholder="Your full name"/>
              ) : (
                <p className="text-mouau-dark font-semibold bg-mouau-bg px-4 py-3 rounded-xl text-sm">
                  {student?.name || '—'}
                </p>
              )}
            </div>

            {/* ID Number */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5 block">
                <Shield className="w-3.5 h-3.5"/> JAMB / Matric Number
              </label>
              <p className="text-mouau-dark font-semibold bg-gray-50 px-4 py-3 rounded-xl text-sm border border-gray-100 text-gray-400">
                {student?.idNumber || '—'} <span className="text-xs text-gray-300 ml-1">(cannot change)</span>
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5 block">
                <Mail className="w-3.5 h-3.5"/> Email Address
              </label>
              {editing ? (
                <input value={form.email} onChange={e => setForm({...form,email:e.target.value})}
                  className="input" type="email" placeholder="your@email.com"/>
              ) : (
                <p className="text-mouau-dark bg-mouau-bg px-4 py-3 rounded-xl text-sm">
                  {student?.email || '—'}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5 block">
                <Phone className="w-3.5 h-3.5"/> Phone Number
              </label>
              {editing ? (
                <input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}
                  className="input" type="tel" placeholder="+234 XXX XXX XXXX"/>
              ) : (
                <p className="text-mouau-dark bg-mouau-bg px-4 py-3 rounded-xl text-sm">
                  {student?.phone || '—'}
                </p>
              )}
            </div>

            {/* College */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5 block">
                <Building2 className="w-3.5 h-3.5"/> College
              </label>
              {editing ? (
                <select value={form.college} onChange={e => setForm({...form,college:e.target.value,department:''})}
                  className="input text-sm py-2">
                  <option value="">Select college...</option>
                  {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <p className="text-mouau-dark bg-mouau-bg px-4 py-3 rounded-xl text-sm">
                  {student?.college || '—'}
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5 block">
                <GraduationCap className="w-3.5 h-3.5"/> Department
              </label>
              {editing ? (
                <select value={form.department} onChange={e => setForm({...form,department:e.target.value})}
                  className="input text-sm py-2" disabled={!form.college}>
                  <option value="">{form.college ? 'Select department...' : 'Select college first'}</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <p className="text-mouau-dark bg-mouau-bg px-4 py-3 rounded-xl text-sm">
                  {student?.department || '—'}
                </p>
              )}
            </div>

            {/* Level */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Academic Level</label>
              {editing ? (
                <div className="grid grid-cols-5 gap-2">
                  {['100','200','300','400','500'].map(l => (
                    <button key={l} type="button" onClick={() => setForm({...form,level:l})}
                      className={`py-2 rounded-xl text-sm font-bold transition-all border ${
                        form.level===l ? 'bg-mouau text-white border-mouau shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-mouau/50'
                      }`}>{l}L</button>
                  ))}
                </div>
              ) : (
                <p className="text-mouau-dark bg-mouau-bg px-4 py-3 rounded-xl text-sm">
                  {student?.level || 100} Level
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card p-5">
          <h3 className="font-bold text-mouau-dark text-base mb-4">Preferences</h3>
          <div className="space-y-3">
            {[
              { icon:Bell, label:'Push Notifications', desc:'Get campus alerts and announcements' },
              { icon:Download, label:'Auto-save Downloads', desc:'Keep downloaded files for offline access' },
            ].map(({ icon:Icon, label, desc }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-mouau-surface rounded-xl flex items-center justify-center">
                    <Icon className="w-4 h-4 text-mouau"/>
                  </div>
                  <div>
                    <p className="font-semibold text-mouau-dark text-sm">{label}</p>
                    <p className="text-gray-400 text-xs">{desc}</p>
                  </div>
                </div>
                <button className="w-11 h-6 bg-mouau rounded-full relative transition-all shadow-inner">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm transition-all"/>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <button onClick={logout}
          className="w-full card p-4 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 transition-all border-red-100">
          <LogOut className="w-4 h-4"/>
          <span className="font-semibold text-sm">Sign Out</span>
        </button>

        <p className="text-center text-xs text-gray-300 pb-2">
          MOUAU FreshStart v1.0 · Michael Okpara University of Agriculture
        </p>
      </div>
    </AppShell>
  )
}
