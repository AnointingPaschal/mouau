'use client'
import { useState, useMemo } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { Search, BookOpen, ChevronDown, ChevronUp, Info } from 'lucide-react'

// MOUAU General cut-off mark
const GENERAL_CUTOFF = 45

type Department = { name: string; cutoff: number }
type College = { name: string; shortName: string; color: string; departments: Department[] }

const COLLEGES: College[] = [
  {
    name: 'College of Veterinary Medicine',
    shortName: 'CVM',
    color: '#b91c1c',
    departments: [
      { name: 'Veterinary Medicine', cutoff: 70 },
      { name: 'Veterinary Surgery', cutoff: 70 },
      { name: 'Veterinary Anatomy', cutoff: 65 },
      { name: 'Veterinary Pharmacology & Endocrinology', cutoff: 60 },
      { name: 'Veterinary Public Health & Preventive Medicine', cutoff: 60 },
      { name: 'Veterinary Pathology', cutoff: 57 },
    ],
  },
  {
    name: 'College of Engineering & Engineering Technology',
    shortName: 'CEET',
    color: '#c2410c',
    departments: [
      { name: 'Mechanical Engineering', cutoff: 52 },
      { name: 'Electrical/Electronic Engineering', cutoff: 52 },
      { name: 'Civil Engineering', cutoff: 52 },
      { name: 'Chemical Engineering', cutoff: 52 },
      { name: 'Agricultural & Bio-Resource Engineering', cutoff: 52 },
    ],
  },
  {
    name: 'College of Natural Sciences',
    shortName: 'CNS',
    color: '#0369a1',
    departments: [
      { name: 'Zoology & Environmental Biology', cutoff: 57 },
      { name: 'Biochemistry', cutoff: 55 },
      { name: 'Microbiology', cutoff: 55 },
    ],
  },
  {
    name: 'College of Physical and Applied Science',
    shortName: 'CPAS',
    color: '#7c3aed',
    departments: [
      { name: 'Computer Science', cutoff: 55 },
      { name: 'Statistics', cutoff: 55 },
      { name: 'Chemistry', cutoff: 45 },
      { name: 'Physics', cutoff: 45 },
      { name: 'Mathematics', cutoff: 45 },
    ],
  },
  {
    name: 'College of Crop & Soil Sciences',
    shortName: 'CCSS',
    color: '#15803d',
    departments: [
      { name: 'Agronomy', cutoff: 50 },
      { name: 'Plant Science & Biotechnology', cutoff: 50 },
      { name: 'Soil Science & Meteorology', cutoff: 50 },
      { name: 'Meteorology', cutoff: 50 },
      { name: 'Plant Health Management', cutoff: 45 },
    ],
  },
  {
    name: 'College of Animal Science & Production',
    shortName: 'CASP',
    color: '#92400e',
    departments: [
      { name: 'Animal Breeding & Physiology', cutoff: 50 },
      { name: 'Animal Production', cutoff: 45 },
    ],
  },
  {
    name: 'College of Natural Resources & Environmental Management',
    shortName: 'CNREM',
    color: '#065f46',
    departments: [
      { name: 'Forestry & Environmental Management', cutoff: 50 },
      { name: 'Environmental Management & Toxicology', cutoff: 50 },
      { name: 'Fisheries & Aquatic Management', cutoff: 50 },
    ],
  },
  {
    name: 'College of Applied Food Science & Tourism',
    shortName: 'CAFST',
    color: '#b45309',
    departments: [
      { name: 'Human Nutrition & Dietetics', cutoff: 52 },
      { name: 'Hotel Management & Tourism', cutoff: 52 },
      { name: 'Food Science & Technology', cutoff: 50 },
      { name: 'Archaeology & Tourism', cutoff: 50 },
      { name: 'Home Economics', cutoff: 45 },
    ],
  },
  {
    name: 'College of Agricultural Economics, Rural Sociology & Extension',
    shortName: 'CAERSE',
    color: '#166534',
    departments: [
      { name: 'Agricultural Economics', cutoff: 50 },
      { name: 'Agricultural Business & Management', cutoff: 50 },
      { name: 'Rural Sociology & Extension', cutoff: 50 },
    ],
  },
  {
    name: 'College of Management & Social Sciences',
    shortName: 'CMSS',
    color: '#1e3a8a',
    departments: [
      { name: 'Business Administration', cutoff: 52 },
      { name: 'International Relations', cutoff: 55 },
      { name: 'Accounting', cutoff: 50 },
      { name: 'Banking & Finance', cutoff: 50 },
      { name: 'Economics', cutoff: 50 },
      { name: 'Marketing', cutoff: 50 },
      { name: 'Human Resources Management', cutoff: 50 },
      { name: 'Entrepreneurial Studies', cutoff: 50 },
      { name: 'Library & Information Science', cutoff: 50 },
    ],
  },
  {
    name: 'College of Education',
    shortName: 'COE',
    color: '#5b21b6',
    departments: [
      { name: 'Guidance & Counselling', cutoff: 55 },
      { name: 'Chemistry Education', cutoff: 50 },
      { name: 'Educational Administration & Planning', cutoff: 50 },
      { name: 'Adult & Continuing Education', cutoff: 50 },
      { name: 'Physics Education', cutoff: 45 },
      { name: 'Mathematics Education', cutoff: 45 },
      { name: 'Biological Education', cutoff: 45 },
      { name: 'Computer Science Education', cutoff: 45 },
      { name: 'Integrated Science Education', cutoff: 45 },
      { name: 'Industrial Technology Education', cutoff: 45 },
      { name: 'Home Economics Education', cutoff: 45 },
      { name: 'Economics Education', cutoff: 45 },
      { name: 'Education Foundations', cutoff: 45 },
      { name: 'Business Education', cutoff: 45 },
      { name: 'Agricultural Education', cutoff: 45 },
      { name: 'Accounting Education', cutoff: 45 },
    ],
  },
]

function getCutoffColor(score: number): string {
  if (score >= 65) return '#b91c1c'   // red – very competitive
  if (score >= 55) return '#c2410c'   // orange – competitive
  if (score >= 50) return '#d97706'   // amber – moderate
  return '#15803d'                    // green – accessible
}

function CutoffBadge({ score }: { score: number }) {
  const color = getCutoffColor(score)
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-white font-bold text-xs min-w-[40px] justify-center"
      style={{ backgroundColor: color }}
    >
      {score}
    </span>
  )
}

export default function CutoffPage() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string[]>([])

  const toggle = (name: string) =>
    setExpanded(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return COLLEGES
    return COLLEGES
      .map(c => ({
        ...c,
        departments: c.departments.filter(d => d.name.toLowerCase().includes(q)),
      }))
      .filter(c => c.departments.length > 0 || c.name.toLowerCase().includes(q) || c.shortName.toLowerCase().includes(q))
  }, [search])

  // Auto-expand all when searching
  const visibleExpanded = search ? filtered.map(c => c.name) : expanded

  return (
    <AppShell>
      <TopBar title="Cut-Off Marks" />
      <main className="pb-28 pt-4 px-4 max-w-lg mx-auto space-y-4">

        {/* Header card */}
        <div className="rounded-xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1a6b3a 100%)' }}>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5" />
            <span className="font-bold text-base">MOUAU Cut-Off Marks</span>
          </div>
          <p className="text-white/80 text-xs">2024/2025 UTME Cut-Off Marks for all departments</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="bg-white/20 rounded-lg px-3 py-1.5 text-center">
              <div className="font-bold text-xl">45</div>
              <div className="text-[10px] text-white/70 uppercase tracking-wide">General</div>
            </div>
            <div className="text-xs text-white/80 flex-1">
              General cut-off is <strong>45</strong>. Departmental cut-offs are higher — check your department below.
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="card p-3">
          <p className="text-[10px] font-bold text-[#888] uppercase tracking-wide mb-2 flex items-center gap-1"><Info className="w-3 h-3"/>Score Legend</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '65+  Very Competitive', color: '#b91c1c' },
              { label: '55–64  Competitive',    color: '#c2410c' },
              { label: '50–54  Moderate',       color: '#d97706' },
              { label: '45–49  Accessible',     color: '#15803d' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-[#555]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaa]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search department or college…"
            className="input pl-9 text-sm w-full"
          />
        </div>

        {/* Colleges */}
        {filtered.map(college => {
          const isOpen = visibleExpanded.includes(college.name)
          const highest = Math.max(...college.departments.map(d => d.cutoff))
          const lowest  = Math.min(...college.departments.map(d => d.cutoff))
          return (
            <div key={college.name} className="card overflow-hidden">
              <button
                onClick={() => toggle(college.name)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                {/* College badge */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px]"
                  style={{ backgroundColor: college.color }}
                >
                  {college.shortName}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#0a0a0a] leading-tight">{college.name}</div>
                  <div className="text-[11px] text-[#888] mt-0.5">
                    {college.departments.length} dept{college.departments.length !== 1 ? 's' : ''} ·{' '}
                    {lowest === highest
                      ? <span style={{ color: getCutoffColor(lowest) }}>Cut-off: {lowest}</span>
                      : <><span style={{ color: getCutoffColor(lowest) }}>{lowest}</span>–<span style={{ color: getCutoffColor(highest) }}>{highest}</span></>
                    }
                  </div>
                </div>
                {isOpen
                  ? <ChevronUp className="w-4 h-4 text-[#aaa] flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-[#aaa] flex-shrink-0" />
                }
              </button>

              {isOpen && (
                <div className="border-t border-[#f0f0f0]">
                  {college.departments.map((dept, i) => (
                    <div
                      key={dept.name}
                      className="flex items-center justify-between px-4 py-3 gap-3"
                      style={{ borderBottom: i < college.departments.length - 1 ? '1px solid #f7f7f7' : undefined }}
                    >
                      <span className="text-sm text-[#333] flex-1 leading-tight">{dept.name}</span>
                      <CutoffBadge score={dept.cutoff} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#aaa]">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No results for &quot;{search}&quot;</p>
          </div>
        )}

        {/* Footer note */}
        <div className="rounded-xl p-4 bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Note:</strong> Cut-off marks may be updated by the university. Always confirm with the{' '}
            <strong>MOUAU Admissions Office</strong> or official JAMB portal for the most current figures.
          </p>
        </div>
      </main>
    </AppShell>
  )
}
