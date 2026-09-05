'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { login } from '@/lib/auth'
import { upsertStudent } from '@/lib/db'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [idNumber, setIdNumber] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login'|'register'>('login')
  const router = useRouter()
  const { setStudent } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!idNumber.trim()) { setError('Enter your JAMB or Matric number'); return }
    if (!password || password.length < 4) { setError('Password must be at least 4 characters'); return }
    if (mode === 'register') {
      if (!name.trim()) { setError('Enter your full name'); return }
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    const student = login(idNumber.trim().toUpperCase(), name || undefined)
    if (mode === 'register') {
      await upsertStudent({ id_number: idNumber.trim().toUpperCase(), name, email, whatsapp })
    }
    setStudent(student)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left — Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-[#0a0a0a] text-white p-12 w-[480px] flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 bg-[#1a6b3a] rounded flex items-center justify-center">
              <span className="text-white font-black text-xs">M</span>
            </div>
            <span className="font-black text-lg tracking-tight">MOUAU FreshStart</span>
          </div>
          <div className="section-label text-white/40 mb-6">
            <span className="text-white/40">STUDENT COMPANION · 2024/2025</span>
          </div>
          <h1 className="text-4xl font-black leading-tight mb-6">
            Your complete<br />campus companion<br />
            <span className="text-[#1a6b3a]">at MOUAU.</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            Navigate campus, access study materials, complete your registration, and connect with fellow students.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10">
          {[['5,000+','STUDENTS'],['500+','MATERIALS'],['30+','DEPTS']].map(([n,l])=>(
            <div key={l}>
              <div className="text-2xl font-black text-white">{n}</div>
              <div className="text-[10px] font-semibold text-white/40 tracking-widest mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-2 px-5 py-4 border-b border-[#e8e8e8]">
          <div className="w-7 h-7 bg-[#1a6b3a] rounded flex items-center justify-center">
            <span className="text-white font-black text-xs">M</span>
          </div>
          <span className="font-black text-base tracking-tight">MOUAU FreshStart</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-[#f9f9f7]">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-[#0a0a0a] mb-1">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-[#6b6b6b] text-sm">
                {mode === 'login' ? 'Sign in with your JAMB or Matric number' : 'Register as a MOUAU student'}
              </p>
            </div>

            {/* Toggle */}
            <div className="flex border border-[#e8e8e8] rounded-lg p-0.5 mb-6 bg-white">
              {(['login','register'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setError('') }}
                  className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${mode===m?'bg-[#0a0a0a] text-white':'text-[#6b6b6b] hover:text-[#0a0a0a]'}`}>
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[#0a0a0a] mb-1.5 block">Full Name *</label>
                    <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="e.g. Chukwuemeka Okonkwo"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#0a0a0a] mb-1.5 block">Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="yourname@gmail.com"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#0a0a0a] mb-1.5 block">WhatsApp Number</label>
                    <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="input" placeholder="+234 800 000 0000"/>
                  </div>
                </>
              )}
              <div>
                <label className="text-xs font-semibold text-[#0a0a0a] mb-1.5 block">JAMB / Matric Number *</label>
                <input value={idNumber} onChange={e => setIdNumber(e.target.value)} className="input uppercase" placeholder="e.g. 20241234567"/>
                <p className="text-[11px] text-[#aaa] mt-1">Freshers use JAMB number · Returning students use Matric number</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0a0a0a] mb-1.5 block">Password *</label>
                <div className="relative">
                  <input type={showPw?'text':'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="input pr-10" placeholder={mode==='register'?'Create a password (min. 4 chars)':'Your password'}/>
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#0a0a0a]">
                    {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-red-600 text-xs">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Please wait...</span></>
                ) : (
                  <><span>{mode==='login'?'Sign In':'Create Account'}</span><ArrowRight className="w-4 h-4"/></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#e8e8e8]">
              <p className="text-xs text-[#aaa] text-center">
                Admin? <a href="/admin" className="text-[#1a6b3a] font-semibold hover:underline">Sign in to admin panel</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
