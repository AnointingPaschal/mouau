'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { login } from '@/lib/auth'
import { Eye, EyeOff, Sprout, GraduationCap, MapPin, BookOpen, MessageCircle, ArrowRight, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const [idNumber, setIdNumber] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const router = useRouter()
  const { setStudent } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!idNumber.trim()) { setError('Please enter your JAMB/Matric number'); return }
    if (!password.trim() || password.length < 4) { setError('Password must be at least 4 characters'); return }
    if (mode === 'register' && !name.trim()) { setError('Please enter your full name'); return }

    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    const student = login(idNumber.trim().toUpperCase(), name || undefined)
    setStudent(student)
    router.push('/dashboard')
  }

  const features = [
    { icon: MapPin, label: 'Campus Navigation', desc: 'Find any location on campus easily' },
    { icon: BookOpen, label: 'Study Materials', desc: 'Access handouts and past questions' },
    { icon: GraduationCap, label: 'Registration Guide', desc: 'Step-by-step admission help' },
    { icon: MessageCircle, label: 'AI Assistant', desc: 'Ask any question, get instant answers' },
  ]

  return (
    <div className="min-h-screen flex lg:flex-row flex-col">
      {/* Left Panel - Branding */}
      <div className="lg:flex-1 bg-green-gradient relative overflow-hidden lg:flex flex-col justify-between p-8 lg:p-12 hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center shadow-lg">
              <Sprout className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-white font-black text-xl leading-none">MOUAU</h1>
              <p className="text-white/70 text-sm">FreshStart</p>
            </div>
          </div>

          <h2 className="text-white font-black text-4xl leading-tight mb-4">
            Your Campus<br />
            <span className="text-gold">Companion.</span>
          </h2>
          <p className="text-white/80 text-lg leading-relaxed mb-10 max-w-sm">
            Everything a MOUAU student needs — all in one place. Navigate, register, study, and connect.
          </p>

          <div className="space-y-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-white/60 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-8">
          <p className="text-white/50 text-xs">Michael Okpara University of Agriculture, Umudike</p>
          <p className="text-white/30 text-xs mt-1">Established 1992 · Abia State, Nigeria</p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="lg:w-[480px] w-full flex flex-col min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-green-gradient px-6 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <h1 className="text-white font-black text-xl leading-none">MOUAU</h1>
              <p className="text-white/70 text-xs">FreshStart</p>
            </div>
          </div>
          <p className="text-white/80 text-sm">Your complete campus companion</p>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-10 bg-gray-50">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-mouau-dark mb-1">
                {mode === 'login' ? 'Welcome back' : 'Get Started'}
              </h2>
              <p className="text-gray-500 text-sm">
                {mode === 'login'
                  ? 'Sign in with your JAMB or Matric number'
                  : 'Create your FreshStart account'}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-white rounded-2xl p-1 mb-6 shadow-sm border border-gray-100">
              {(['login','register'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setError('') }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    mode === m ? 'bg-mouau text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="e.g. Chukwuemeka Okonkwo"
                    className="input"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  JAMB / Matric Number
                </label>
                <input
                  type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)}
                  placeholder="e.g. 20244567890 or 2024/101/CSC/001"
                  className="input uppercase"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Freshers use JAMB number · Returning students use Matric number
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Create a password' : 'Enter your password'}
                    className="input pr-12"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {mode === 'register' && (
                  <p className="text-xs text-gray-400 mt-1">
                    Default password for new students is your JAMB number
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-6">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-2 text-xs text-gray-400">
                <CheckCircle className="w-4 h-4 text-mouau flex-shrink-0 mt-0.5" />
                <span>Safe and secure — your data stays on your device</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-400">
                <CheckCircle className="w-4 h-4 text-mouau flex-shrink-0 mt-0.5" />
                <span>No personal data sent to external servers</span>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              Michael Okpara University of Agriculture, Umudike<br />
              <span className="text-mouau font-medium">FreshStart v1.0</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
