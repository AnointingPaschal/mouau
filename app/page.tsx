import type { Metadata } from 'next'
import Link from 'next/link'
import InstallButtons from '@/components/InstallButtons'

export const metadata: Metadata = {
  title: 'PDM MOUAU — Student Companion App for Michael Okpara University',
  description:
    'Navigate MOUAU campus, access past questions & study materials, track your registration, and stay connected with Pneuma Domain Ministry. Download free for Android and iPhone.',
  keywords:
    'MOUAU, Michael Okpara University, Agriculture, Umudike, PDM, Pneuma Domain Ministry, student app, campus navigation, past questions, freshers, 100 level',
  openGraph: {
    title: 'PDM MOUAU — Student Companion App',
    description: 'Your all-in-one MOUAU student app. Campus map, study library, PDM ministry, CGPA calculator & more.',
    url: 'https://mouau-rose.vercel.app',
    siteName: 'PDM MOUAU',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'PDM MOUAU' }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'PDM MOUAU', description: 'Your all-in-one MOUAU student companion app.' },
  robots: { index: true, follow: true },
}

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Campus Navigation',
    desc: 'Real-time GPS directions to every building, hostel, and facility on MOUAU campus. Never get lost again.',
    color: '#1e3a8a',
  },
  {
    icon: '📚',
    title: 'Study Library',
    desc: 'Access past questions, lecture notes, and projects. Apply and collect materials every Sunday.',
    color: '#1a6b3a',
  },
  {
    icon: '✝️',
    title: 'Pneuma Domain Ministry',
    desc: 'Connect with PDM MOUAU — gallery, programs, videos, events, and live service directions.',
    color: '#7c3aed',
  },
  {
    icon: '📋',
    title: 'Registration Guide',
    desc: '49-step guide covering every stage of MOUAU registration, from O\'level upload to departmental clearance.',
    color: '#d97706',
  },
  {
    icon: '🧮',
    title: 'CGPA Calculator',
    desc: 'Calculate your CGPA and estimate school fees instantly. Know exactly where you stand academically.',
    color: '#0891b2',
  },
  {
    icon: '📢',
    title: 'Announcements',
    desc: 'Instant push notifications for campus news, library pickups, and ministry announcements.',
    color: '#b91c1c',
  },
]

const STATS = [
  { value: '49',   label: 'Registration steps guided' },
  { value: '100+', label: 'Campus locations mapped' },
  { value: '24/7', label: 'Available anytime' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060c16] text-white">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#060c16]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icon-192.png" alt="PDM MOUAU" className="w-8 h-8 rounded-lg" />
            <span className="font-black text-sm tracking-tight">PDM MOUAU</span>
          </div>
          <Link href="/login"
            className="text-xs font-bold text-white bg-[#1a6b3a] hover:bg-[#145530] px-4 py-2 rounded-full transition-all">
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-24 px-5 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#1a6b3a]/20 rounded-full blur-[120px]" />
          <div className="absolute top-20 left-1/4 w-[200px] h-[200px] bg-[#1e3a8a]/20 rounded-full blur-[80px]" />
          <div className="absolute top-20 right-1/4 w-[200px] h-[200px] bg-[#7c3aed]/15 rounded-full blur-[80px]" />
        </div>

        <div className="max-w-2xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/8 border border-white/10 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a6b3a] animate-pulse" />
            Free for all MOUAU students
          </div>

          {/* Logo + Title */}
          <div className="flex justify-center mb-5">
            <img src="/icon-192.png" alt="PDM MOUAU" className="w-20 h-20 rounded-3xl shadow-2xl shadow-[#1a6b3a]/30" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4 tracking-tight">
            Your MOUAU
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4ade80] via-[#34d399] to-[#6ee7b7]">
              Campus Companion
            </span>
          </h1>

          <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto">
            Navigate campus, access study materials, track your registration, and stay connected — all in one app for Michael Okpara University students.
          </p>

          <InstallButtons />

          <p className="text-white/25 text-xs mt-5">
            Free · No account needed to browse · Works offline
          </p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-10 px-5 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-black text-[#4ade80]">{s.value}</p>
              <p className="text-[10px] sm:text-xs text-white/40 mt-1 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#4ade80] text-xs font-bold uppercase tracking-widest mb-2">Everything you need</p>
            <h2 className="text-2xl sm:text-3xl font-black">Built for MOUAU students</h2>
            <p className="text-white/40 text-sm mt-2">From freshers to finalists, we've got you covered.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div key={f.title}
                className="group bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-5 transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-xl"
                  style={{ background: `${f.color}25` }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-sm text-white mb-1.5">{f.title}</h3>
                <p className="text-white/45 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PDM HIGHLIGHT ── */}
      <section className="py-16 px-5 bg-gradient-to-b from-transparent via-[#1a6b3a]/8 to-transparent">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl overflow-hidden mb-5 shadow-xl">
            <img src="/icon-192.png" alt="PDM" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-3">
            Presented by <span className="text-[#4ade80]">Pneuma Domain Ministry</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            PDM MOUAU is more than an app — it's a ministry tool. We serve every student at Michael Okpara University of Agriculture, Umudike, connecting you to resources, community, and faith.
          </p>
          <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
            <span>📍</span>
            <span>Michael Okpara University of Agriculture, Umudike, Abia State</span>
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD CTA ── */}
      <section className="py-20 px-5">
        <div className="max-w-lg mx-auto bg-gradient-to-br from-[#1a6b3a]/20 to-[#1e3a8a]/20 border border-white/10 rounded-3xl p-8 sm:p-10 text-center">
          <div className="text-3xl mb-3">📱</div>
          <h2 className="text-xl sm:text-2xl font-black mb-2">Get the app today</h2>
          <p className="text-white/50 text-sm mb-7">
            Free for every MOUAU student. Works on Android and iPhone.
          </p>
          <InstallButtons />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-8 px-5">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
          <div className="flex items-center gap-2">
            <img src="/icon-192.png" alt="" className="w-5 h-5 rounded" />
            <span>PDM MOUAU · Pneuma Domain Ministry</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white/60 transition-colors">Student Login</Link>
            <Link href="/pdm"   className="hover:text-white/60 transition-colors">About PDM</Link>
            <Link href="/admin" className="hover:text-white/60 transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
