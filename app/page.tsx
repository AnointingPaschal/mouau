import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, BookOpen, Users, ClipboardList, Calculator, Bell, ArrowRight, Star } from 'lucide-react'
import InstallButtons from '@/components/InstallButtons'
import { getSetting } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'PDM MOUAU — Student Companion App for Michael Okpara University',
  description: 'Navigate MOUAU campus, access past questions & study materials, track your registration, and connect with Pneuma Domain Ministry. Free for all students.',
  keywords: 'MOUAU, Michael Okpara University, Agriculture, Umudike, PDM, Pneuma Domain Ministry, student app, campus navigation, past questions, freshers',
  openGraph: {
    title: 'PDM MOUAU — Student Companion App',
    description: 'Your all-in-one MOUAU student app. Campus map, library, PDM ministry, CGPA calculator & more.',
    url: 'https://mouau-rose.vercel.app',
    siteName: 'PDM MOUAU',
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
    type: 'website',
  },
  robots: { index: true, follow: true },
}

// Load settings server-side
async function getLandingContent() {
  const keys = ['landing_badge','landing_title1','landing_title2','landing_description',
    'landing_stat1_value','landing_stat1_label','landing_stat2_value','landing_stat2_label',
    'landing_stat3_value','landing_stat3_label',
    'landing_f1_title','landing_f1_desc','landing_f1_image',
    'landing_f2_title','landing_f2_desc','landing_f2_image',
    'landing_f3_title','landing_f3_desc','landing_f3_image',
    'landing_f4_title','landing_f4_desc','landing_f4_image',
    'landing_f5_title','landing_f5_desc','landing_f5_image',
    'landing_f6_title','landing_f6_desc','landing_f6_image',
  ]
  const vals: Record<string,string> = {}
  await Promise.all(keys.map(async k => { vals[k] = await getSetting(k, '') }))
  return vals
}

const DEFAULT_FEATURES = [
  { icon: MapPin,       color:'#3b82f6', title:'Campus Navigation',   desc:'Real-time GPS directions to every building, hostel, and facility on MOUAU campus.' },
  { icon: BookOpen,     color:'#1a6b3a', title:'Study Library',        desc:'Past questions, lecture notes, and project files. Apply and collect every Sunday.' },
  { icon: Users,        color:'#7c3aed', title:'PDM Ministry',         desc:'Gallery, programs, videos, events, and directions to Pneuma Domain Ministry.' },
  { icon: ClipboardList,color:'#d97706', title:'Registration Guide',   desc:'Step-by-step guide covering all 49 stages of MOUAU registration from start to finish.' },
  { icon: Calculator,   color:'#0891b2', title:'CGPA Calculator',      desc:'Calculate your CGPA and estimate school fees instantly. Know where you stand.' },
  { icon: Bell,         color:'#b91c1c', title:'Announcements',        desc:'Instant push notifications for campus news, library pickups, and ministry updates.' },
]

export default async function LandingPage() {
  const c = await getLandingContent()

  const badge  = c.landing_badge        || 'Free for all MOUAU students'
  const title1 = c.landing_title1       || 'Your MOUAU'
  const title2 = c.landing_title2       || 'Campus Companion'
  const desc   = c.landing_description  || 'Navigate campus, access study materials, track your registration, and stay connected — all in one place for Michael Okpara University students.'

  const stats = [
    { value: c.landing_stat1_value || '49',   label: c.landing_stat1_label || 'Registration steps' },
    { value: c.landing_stat2_value || '100+', label: c.landing_stat2_label || 'Campus locations' },
    { value: c.landing_stat3_value || '24/7', label: c.landing_stat3_label || 'Available anytime' },
  ]

  const features = DEFAULT_FEATURES.map((f, i) => ({
    ...f,
    title: c[`landing_f${i+1}_title`] || f.title,
    desc:  c[`landing_f${i+1}_desc`]  || f.desc,
    image: c[`landing_f${i+1}_image`] || null,
  }))

  return (
    <div className="min-h-screen bg-[#05090f] text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#05090f]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icon-192.png" alt="PDM MOUAU" className="w-7 h-7 rounded-lg"/>
            <span className="font-black text-xs tracking-tight">PDM MOUAU</span>
          </div>
          <Link href="/login"
            className="text-xs font-bold text-white bg-[#1a6b3a] hover:bg-[#145530] px-3.5 py-1.5 rounded-full transition-all">
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-24 pb-16 px-4 text-center overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#1a6b3a]/15 rounded-full blur-[100px] animate-pulse-glow"/>
          <div className="absolute top-16 left-1/4 w-[150px] h-[150px] bg-[#1e3a8a]/20 rounded-full blur-[60px]"/>
          <div className="absolute top-16 right-1/4 w-[150px] h-[150px] bg-[#7c3aed]/15 rounded-full blur-[60px]"/>
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',backgroundSize:'40px 40px'}}/>
        </div>

        <div className="max-w-lg mx-auto relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#1a6b3a]/20 border border-[#1a6b3a]/40 rounded-full px-3 py-1 mb-5 animate-reveal-fade">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse flex-shrink-0"/>
            <span className="text-[11px] font-semibold text-[#4ade80]">{badge}</span>
          </div>

          {/* App icon */}
          <div className="flex justify-center mb-4 animate-reveal-up animation-delay-100">
            <div className="relative">
              <div className="absolute inset-0 bg-[#1a6b3a]/40 rounded-[28px] blur-xl scale-110 animate-pulse-glow"/>
              <img src="/icon-192.png" alt="PDM MOUAU" className="relative w-16 h-16 rounded-[22px] shadow-2xl"/>
            </div>
          </div>

          <h1 className="animate-reveal-up animation-delay-200">
            <span className="block text-3xl sm:text-4xl font-black leading-none tracking-tight text-white mb-1">{title1}</span>
            <span className="block text-3xl sm:text-4xl font-black leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#4ade80] via-[#34d399] to-[#86efac]">{title2}</span>
          </h1>

          <p className="text-white/50 text-sm leading-relaxed mt-3 mb-6 animate-reveal-up animation-delay-300">{desc}</p>

          <div className="animate-reveal-up animation-delay-400">
            <InstallButtons size="md"/>
          </div>

          <p className="text-white/20 text-[10px] mt-4 animate-reveal-up animation-delay-500">
            Free · No account needed to browse · Works offline
          </p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-8 px-4 border-y border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-sm mx-auto grid grid-cols-3 gap-3">
          {stats.map((s,i) => (
            <div key={i} className="text-center">
              <p className="text-xl sm:text-2xl font-black text-[#4ade80]">{s.value}</p>
              <p className="text-[9px] text-white/35 mt-0.5 font-medium leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#4ade80] text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5">Everything you need</p>
            <h2 className="text-xl sm:text-2xl font-black">Built for MOUAU students</h2>
            <p className="text-white/35 text-xs mt-1.5 max-w-xs mx-auto">From freshers to finalists — all the tools you need on campus.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i}
                  className="group relative bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] hover:border-white/[0.14] rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5">

                  {/* Feature image or gradient placeholder */}
                  <div className="relative h-36 overflow-hidden">
                    {f.image ? (
                      <img src={f.image} alt={f.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{background:`radial-gradient(circle at 30% 40%, ${f.color}25, transparent 60%), linear-gradient(135deg, ${f.color}15, transparent)`}}>
                        {/* Decorative rings */}
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/20"/>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-white/15"/>
                        </div>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                          style={{background:`${f.color}30`, border:`1px solid ${f.color}50`}}>
                          <Icon className="w-7 h-7" style={{color:f.color}}/>
                        </div>
                      </div>
                    )}
                    {/* Gradient fade at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#05090f]/90 to-transparent"/>
                    {/* Icon badge on image */}
                    {f.image && (
                      <div className="absolute bottom-2.5 left-3 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
                        style={{background:`${f.color}ee`}}>
                        <Icon className="w-4 h-4 text-white"/>
                      </div>
                    )}
                  </div>

                  <div className="px-4 pb-4 pt-2.5">
                    <h3 className="font-bold text-sm text-white mb-1">{f.title}</h3>
                    <p className="text-white/40 text-[11px] leading-relaxed">{f.desc}</p>
                  </div>

                  {/* Hover accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity" style={{background:`linear-gradient(90deg, transparent, ${f.color}, transparent)`}}/>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PDM SECTION ── */}
      <section className="py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="relative bg-gradient-to-br from-[#1a6b3a]/15 to-[#1e3a8a]/10 border border-white/[0.08] rounded-3xl p-6 text-center overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-[#1a6b3a]/30 blur-2xl"/>
            <div className="relative">
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#1a6b3a]/40 rounded-2xl blur-lg"/>
                  <img src="/icon-192.png" alt="PDM" className="relative w-12 h-12 rounded-2xl"/>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[...Array(5)].map((_,i) => <Star key={i} className="w-3 h-3 fill-[#C9A227] text-[#C9A227]"/>)}
              </div>
              <h2 className="text-base font-black mb-2">
                Presented by <span className="text-[#4ade80]">Pneuma Domain Ministry</span>
              </h2>
              <p className="text-white/45 text-xs leading-relaxed mb-4">
                PDM MOUAU serves every student at Michael Okpara University of Agriculture, Umudike — connecting you to resources, community, and faith.
              </p>
              <div className="flex items-center justify-center gap-1.5 text-white/25 text-[10px]">
                <MapPin className="w-3 h-3"/>
                <span>Michael Okpara University of Agriculture, Umudike, Abia State</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-12 px-4">
        <div className="max-w-sm mx-auto text-center">
          <h2 className="text-lg font-black mb-1.5">Get the app today</h2>
          <p className="text-white/40 text-xs mb-5">Free for every MOUAU student. Works on Android and iPhone.</p>
          <InstallButtons size="md"/>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-white/25">
          <div className="flex items-center gap-2">
            <img src="/icon-192.png" alt="" className="w-4 h-4 rounded"/>
            <span>PDM MOUAU · Pneuma Domain Ministry MOUAU</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login"  className="hover:text-white/50 transition-colors">Student Login</Link>
            <Link href="/pdm"    className="hover:text-white/50 transition-colors">About PDM</Link>
            <Link href="/admin"  className="hover:text-white/50 transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
