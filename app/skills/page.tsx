'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import Link from 'next/link'
import { Zap, Search, ChevronRight, Clock, User, Briefcase, Globe, Users } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

type Skill = { id:string; title:string; tagline:string; category:string; level:string; duration:string; instructor:string; image_url:string }

const LEVEL_COLOR: Record<string,string> = { beginner:'#1a6b3a', intermediate:'#d97706', advanced:'#b91c1c' }
const CATEGORIES = ['All','Tech','Business','Creative','Vocational','Ministry','Academic']

const WHY_SKILLS = [
  { icon: Briefcase, label: 'Career ready',  color: '#1e3a8a' },
  { icon: Globe,     label: 'Global skills', color: '#1a6b3a' },
  { icon: Users,     label: 'Network & grow',color: '#7c3aed' },
]

export default function SkillsPage() {
  const { student } = useAuth()
  const [skills,  setSkills]  = useState<Skill[]>([])
  const [applied, setApplied] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)
  const [query,   setQuery]   = useState('')
  const [cat,     setCat]     = useState('All')

  useEffect(() => {
    fetch('/api/skills').then(r => r.json()).then(d => { setSkills(d.data || []); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!student?.idNumber) return
    fetch(`/api/skills/apply?student_id=${encodeURIComponent(student.idNumber)}`)
      .then(r => r.json()).then(d => {
        const map: Record<string,string> = {}
        for (const a of d.data || []) map[a.skill_id] = a.status
        setApplied(map)
      })
  }, [student?.idNumber])

  const filtered = skills.filter(s =>
    (cat === 'All' || s.category === cat) &&
    (!query || s.title.toLowerCase().includes(query.toLowerCase()) ||
               s.category?.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <AppShell>
      <TopBar title="Skill Acquisition" subtitle="Learn. Grow. Excel."/>

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] px-4 py-7 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#1a6b3a]/20 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#1e3a8a]/20 rounded-full blur-2xl pointer-events-none"/>
        <div className="relative max-w-lg">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-[#C9A227]"/>
            <span className="text-[#C9A227] text-[10px] font-bold uppercase tracking-widest">Skill Acquisition</span>
          </div>
          <h1 className="text-white font-black text-xl leading-tight mb-2">
            Invest in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4ade80] to-[#34d399]">yourself</span>
          </h1>
          <p className="text-white/50 text-xs leading-relaxed">
            Beyond academics — develop practical skills that employers and the world need. Apply, join classes, and grow with your campus community.
          </p>
        </div>
      </div>

      {/* Why skills */}
      <div className="px-4 py-4 grid grid-cols-3 gap-2.5 border-b border-[#e8e8e8]">
        {WHY_SKILLS.map(({ icon: Icon, label, color }) => (
          <div key={label} className="bg-[#f9f9f7] rounded-xl p-3 text-center">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5" style={{background:`${color}15`}}>
              <Icon className="w-3.5 h-3.5" style={{color}}/>
            </div>
            <p className="text-[10px] font-semibold text-[#0a0a0a] leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-[#e8e8e8] rounded-xl px-3 py-2.5 shadow-sm">
          <Search className="w-4 h-4 text-[#aaa] flex-shrink-0"/>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search skills…"
            className="flex-1 text-xs outline-none bg-transparent text-[#0a0a0a] placeholder-[#aaa]"/>
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-4 px-4">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all
                ${cat === c ? 'bg-[#1a6b3a] text-white border-[#1a6b3a]' : 'bg-white text-[#6b6b6b] border-[#e8e8e8] hover:border-[#1a6b3a]/40'}`}>
              {c}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-[#aaa] font-medium">{filtered.length} skill{filtered.length !== 1 ? 's' : ''} available</p>

        {/* Skills */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-[#1a6b3a] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-10 h-10 text-[#ddd] mx-auto mb-2"/>
            <p className="text-sm text-[#aaa]">No skills available yet</p>
            <p className="text-[11px] text-[#ccc] mt-1">Check back soon — new skills are added regularly</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 pb-24">
            {filtered.map(skill => {
              const status     = applied[skill.id]
              const levelColor = LEVEL_COLOR[skill.level?.toLowerCase()] || '#1a6b3a'
              return (
                <Link key={skill.id} href={`/skills/${skill.id}`}
                  className="card overflow-hidden flex flex-col group hover:shadow-md transition-all active:scale-[0.99]">

                  {/* Image area */}
                  <div className="relative h-32 overflow-hidden">
                    {skill.image_url ? (
                      <img src={skill.image_url} alt={skill.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] flex items-center justify-center">
                        <Zap className="w-10 h-10 text-white/10"/>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>

                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                      {skill.category && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white backdrop-blur-sm border border-white/20">
                          {skill.category}
                        </span>
                      )}
                      {skill.level && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:`${levelColor}cc`}}>
                          {skill.level}
                        </span>
                      )}
                    </div>

                    {/* Applied badge */}
                    {status && (
                      <div className={`absolute top-2.5 right-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full
                        ${status==='approved'?'bg-[#1a6b3a] text-white':status==='pending'?'bg-amber-500 text-white':'bg-[#e8e8e8] text-[#6b6b6b]'}`}>
                        {status === 'approved' ? 'Approved' : status === 'pending' ? 'Applied' : status}
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-3.5 flex-1 flex flex-col">
                    <h3 className="font-black text-[#0a0a0a] text-sm mb-0.5">{skill.title}</h3>
                    {skill.tagline && <p className="text-[11px] text-[#6b6b6b] mb-2 leading-snug">{skill.tagline}</p>}
                    <div className="flex items-center gap-3 mt-auto">
                      {skill.duration && (
                        <div className="flex items-center gap-1 text-[10px] text-[#aaa]">
                          <Clock className="w-3 h-3"/>{skill.duration}
                        </div>
                      )}
                      {skill.instructor && (
                        <div className="flex items-center gap-1 text-[10px] text-[#aaa]">
                          <User className="w-3 h-3"/>{skill.instructor}
                        </div>
                      )}
                      <ChevronRight className="w-4 h-4 text-[#1a6b3a] ml-auto"/>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
