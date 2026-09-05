'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { BookOpen, Users, Bell, MapPin, Brain, LayoutDashboard, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const { admin, token } = useAdmin()
  const [stats, setStats] = useState({ students: 0, materials: 0, posts: 0, locations: 0, training: 0 })

  useEffect(() => {
    if (!token) return
    const h = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch('/api/admin/students', { headers: h }).then(r => r.json()),
      fetch('/api/admin/library', { headers: h }).then(r => r.json()),
      fetch('/api/admin/locations', { headers: h }).then(r => r.json()),
      fetch('/api/admin/ai-training', { headers: h }).then(r => r.json()),
    ]).then(([s, m, l, ai]) => {
      setStats({
        students: s.data?.length || 0,
        materials: m.data?.length || 0,
        posts: 0,
        locations: l.data?.length || 0,
        training: ai.data?.filter((d: any) => d.active).length || 0,
      })
    })
  }, [token])

  const cards = [
    { href:'/admin/content', label:'Site Content', desc:'Edit all website text', icon:LayoutDashboard, color:'bg-blue-50 text-blue-600' },
    { href:'/admin/library', label:'Library', desc:`${stats.materials} materials`, icon:BookOpen, color:'bg-[#1a6b3a]/10 text-[#1a6b3a]' },
    { href:'/admin/announcements', label:'Announcements', desc:'Post updates to students', icon:Bell, color:'bg-amber-50 text-amber-600' },
    { href:'/admin/map', label:'Campus Map', desc:`${stats.locations} locations`, icon:MapPin, color:'bg-purple-50 text-purple-600' },
    { href:'/admin/ai-training', label:'AI Training', desc:`${stats.training} active entries`, icon:Brain, color:'bg-pink-50 text-pink-600' },
    { href:'/admin/students', label:'Students', desc:`${stats.students} registered`, icon:Users, color:'bg-indigo-50 text-indigo-600' },
  ]

  return (
    <AdminShell>
      <div className="p-5 lg:p-8 max-w-4xl">
        <div className="mb-6">
          <p className="text-[11px] text-[#aaa] font-semibold uppercase tracking-widest mb-1">ADMIN PANEL</p>
          <h1 className="text-2xl font-black text-[#0a0a0a]">Welcome, {admin?.name?.split(' ')[0]}</h1>
          <p className="text-[#6b6b6b] text-sm mt-1">Manage all MOUAU FreshStart content and settings.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {[
            { label:'Students', value:stats.students },
            { label:'Materials', value:stats.materials },
            { label:'Locations', value:stats.locations },
            { label:'AI Training', value:stats.training },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-[#e8e8e8] rounded-xl p-4">
              <div className="text-2xl font-black text-[#0a0a0a]">{value}</div>
              <div className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="mb-3">
          <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest">MANAGE</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {cards.map(({ href, label, desc, icon: Icon, color }) => (
            <Link key={href} href={href} className="bg-white border border-[#e8e8e8] rounded-xl p-4 flex items-center gap-3 hover:border-[#1a6b3a]/30 transition-all group">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-4 h-4" strokeWidth={2}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#0a0a0a] text-sm">{label}</p>
                <p className="text-[#aaa] text-xs">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#ddd] group-hover:text-[#1a6b3a] transition-colors flex-shrink-0"/>
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  )
}
