'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { saveStudent } from '@/lib/auth'
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Mail, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react'

// ─── ID Format Validation ────────────────────────────────────────────────────
// JAMB:   10–11 digits           e.g. 20241234567
// Matric: MOUAU/ABC/YY/NNNNN     e.g. MOUAU/CMP/18/30239
const JAMB_RE   = /^\d{10,11}$/
const MATRIC_RE = /^MOUAU\/[A-Z]{2,5}\/\d{2}\/\d+$/i

function validateId(id: string): string | null {
  const upper = id.trim().toUpperCase()
  if (!upper) return 'Enter your JAMB or Matric number'
  if (JAMB_RE.test(upper) || MATRIC_RE.test(upper)) return null
  if (upper.startsWith('MOUAU/')) return 'Matric format: MOUAU/CMP/18/30239'
  if (/^\d+$/.test(upper)) return 'JAMB number should be 10–11 digits (e.g. 20241234567)'
  return 'Enter a valid JAMB number or Matric number (MOUAU/CMP/18/30239)'
}

type Screen = 'signin' | 'register' | 'verify' | 'forgot' | 'reset'

export default function LoginPage() {
  const [screen,   setScreen]   = useState<Screen>('signin')
  const [idNumber, setIdNumber] = useState('')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [code,     setCode]     = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [info,     setInfo]     = useState('')
  const router = useRouter()
  const { setStudent } = useAuth()

  const reset = (s: Screen) => { setScreen(s); setError(''); setInfo(''); setCode('') }

  // ── Sign In ──────────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    setError('')
    const idErr = validateId(idNumber)
    if (idErr) { setError(idErr); return }
    if (!password) { setError('Enter your password'); return }
    setLoading(true)
    const r = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idNumber: idNumber.trim().toUpperCase(), password })
    })
    const d = await r.json()
    setLoading(false)
    if (!d.ok) { setError(d.error || 'Login failed'); return }
    saveStudent(d.student)
    setStudent(d.student)
    router.push('/dashboard')
  }

  // ── Register step 1: send verification email ─────────────────────────────
  const handleSendCode = async () => {
    setError('')
    const idErr = validateId(idNumber)
    if (idErr) { setError(idErr); return }
    if (!name.trim())  { setError('Enter your full name'); return }
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email address'); return }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    const r = await fetch('/api/auth/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idNumber: idNumber.trim().toUpperCase(), name, email })
    })
    const d = await r.json()
    setLoading(false)
    if (d.error) { setError(d.error); return }
    setInfo(d.emailSent ? `Verification code sent to ${email}` : 'Code generated (email not configured — ask admin for code)')
    setScreen('verify')
  }

  // ── Register step 2: verify code + create account ────────────────────────
  const handleVerifyAndRegister = async () => {
    setError('')
    if (code.length !== 6) { setError('Enter the 6-digit code from your email'); return }
    setLoading(true)
    const r = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idNumber: idNumber.trim().toUpperCase(), name, email, password, code })
    })
    const d = await r.json()
    setLoading(false)
    if (!d.ok) { setError(d.error || 'Registration failed'); return }
    saveStudent(d.student)
    setStudent(d.student)
    router.push('/dashboard')
  }

  // ── Forgot password: send reset code ─────────────────────────────────────
  const handleForgotSend = async () => {
    setError('')
    if (!email.includes('@')) { setError('Enter your registered email address'); return }
    setLoading(true)
    await fetch('/api/auth/forgot-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    setLoading(false)
    setInfo(`If that email is registered, a reset code was sent to ${email}`)
    setScreen('reset')
  }

  // ── Reset password: apply new password ───────────────────────────────────
  const handleReset = async () => {
    setError('')
    if (code.length !== 6) { setError('Enter the 6-digit code from your email'); return }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    const r = await fetch('/api/auth/reset-password', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword: password })
    })
    const d = await r.json()
    setLoading(false)
    if (!d.ok) { setError(d.error || 'Reset failed'); return }
    setInfo('Password reset successfully! Sign in with your new password.')
    reset('signin')
  }

  const IdInput = () => (
    <div>
      <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1.5 block">JAMB / Matric Number *</label>
      <input value={idNumber} onChange={e => setIdNumber(e.target.value.toUpperCase())}
        placeholder="e.g. 20241234567 or MOUAU/CMP/18/30239"
        className="w-full border border-[#e8e8e8] rounded-xl px-3.5 py-3 text-sm outline-none focus:border-[#1a6b3a] focus:ring-2 focus:ring-[#1a6b3a]/10 transition-all font-mono"/>
      <p className="text-[10px] text-[#aaa] mt-1">JAMB: 10–11 digits · Matric: MOUAU/DEPT/YY/NUMBER</p>
    </div>
  )

  const PwInput = ({ label = 'Password *', value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) => (
    <div>
      <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1.5 block">{label}</label>
      <div className="relative">
        <input type={showPw ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
          placeholder="Enter password" className="w-full border border-[#e8e8e8] rounded-xl px-3.5 py-3 text-sm outline-none focus:border-[#1a6b3a] focus:ring-2 focus:ring-[#1a6b3a]/10 transition-all pr-10"/>
        <button type="button" onClick={() => setShowPw(p => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#6b6b6b]">
          {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
        </button>
      </div>
    </div>
  )

  const SubmitBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick} disabled={loading}
      className="w-full bg-[#1a6b3a] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#145530] active:scale-[0.98] transition-all disabled:opacity-60 mt-2">
      {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <>{label} <ArrowRight className="w-4 h-4"/></>}
    </button>
  )

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[#0a0a0a] text-white p-12 w-[440px] flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 bg-[#1a6b3a] rounded flex items-center justify-center">
              <span className="text-white font-black text-xs">M</span>
            </div>
            <span className="font-black text-lg tracking-tight">MOUAU FreshStart</span>
          </div>
          <h1 className="text-4xl font-black leading-tight mb-6">
            Your complete<br/>campus companion<br/>
            <span className="text-[#1a6b3a]">at MOUAU.</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed">Navigate campus, access study materials, complete your registration, and connect with fellow students.</p>
        </div>
        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
          {[['5,000+','STUDENTS'],['500+','MATERIALS'],['30+','DEPTS']].map(([n,l])=>(
            <div key={l}><div className="text-2xl font-black">{n}</div><div className="text-[10px] font-semibold text-white/40 tracking-widest mt-0.5">{l}</div></div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center gap-2 px-5 py-4 border-b border-[#e8e8e8]">
          <div className="w-7 h-7 bg-[#1a6b3a] rounded flex items-center justify-center">
            <span className="text-white font-black text-xs">M</span>
          </div>
          <span className="font-black text-base tracking-tight">MOUAU FreshStart</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-[#f9f9f7]">
          <div className="w-full max-w-xl">

            {/* Error / Info banners */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl px-3.5 py-3 mb-4">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/>
                <span>{error}</span>
              </div>
            )}
            {info && (
              <div className="flex items-start gap-2.5 bg-[#f0f9f4] border border-[#1a6b3a]/20 text-[#1a6b3a] text-xs rounded-xl px-3.5 py-3 mb-4">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/>
                <span>{info}</span>
              </div>
            )}

            {/* ── SIGN IN ── */}
            {screen === 'signin' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e8e8e8] p-6 lg:p-8 space-y-4">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-[#0a0a0a]">Welcome back</h2>
                  <p className="text-[#6b6b6b] text-sm mt-1">Sign in with your JAMB or Matric number and password</p>
                </div>
                <IdInput/>
                <PwInput value={password} onChange={setPassword}/>
                <SubmitBtn label="Sign In" onClick={handleSignIn}/>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <button onClick={() => reset('forgot')} className="text-[#6b6b6b] hover:text-[#1a6b3a] transition-colors">Forgot password?</button>
                  <button onClick={() => { reset('register'); setPassword(''); setConfirm('') }}
                    className="text-[#1a6b3a] font-semibold hover:underline">New student? Register →</button>
                </div>
                <div className="border-t border-[#f0f0f0] pt-3 text-center">
                  <a href="/admin" className="text-[10px] text-[#aaa] hover:text-[#6b6b6b]">Admin? Sign in to admin panel</a>
                </div>
              </div>
            )}

            {/* ── REGISTER ── */}
            {screen === 'register' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e8e8e8] p-6 lg:p-8 space-y-4">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-[#0a0a0a]">Create account</h2>
                  <p className="text-[#6b6b6b] text-sm mt-1">Register as a MOUAU student</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1.5 block">Full Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Anointing Paschal"
                    className="w-full border border-[#e8e8e8] rounded-xl px-3.5 py-3 text-sm outline-none focus:border-[#1a6b3a] focus:ring-2 focus:ring-[#1a6b3a]/10 transition-all"/>
                </div>
                <IdInput/>
                <div>
                  <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1.5 block">Email Address *</label>
                  <input value={email} onChange={e => setEmail(e.target.value.toLowerCase())} type="email" placeholder="your@email.com"
                    className="w-full border border-[#e8e8e8] rounded-xl px-3.5 py-3 text-sm outline-none focus:border-[#1a6b3a] focus:ring-2 focus:ring-[#1a6b3a]/10 transition-all"/>
                  <p className="text-[10px] text-[#aaa] mt-1">For verification code and password reset</p>
                </div>
                <PwInput value={password} onChange={setPassword} label="Password * (min 6 chars)"/>
                <PwInput value={confirm} onChange={setConfirm} label="Confirm Password *"/>
                <SubmitBtn label="Send Verification Code" onClick={handleSendCode}/>
                <div className="text-center pt-2">
                  <button onClick={() => reset('signin')} className="text-xs text-[#6b6b6b] hover:text-[#1a6b3a]">← Already have an account? Sign in</button>
                </div>
              </div>
            )}

            {/* ── VERIFY EMAIL ── */}
            {screen === 'verify' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e8e8e8] p-6 lg:p-8 space-y-4">
                <div className="flex items-center justify-center w-14 h-14 bg-[#f0f9f4] rounded-2xl mx-auto mb-4">
                  <Mail className="w-7 h-7 text-[#1a6b3a]"/>
                </div>
                <div className="text-center mb-4">
                  <h2 className="text-xl font-black text-[#0a0a0a]">Check your email</h2>
                  <p className="text-[#6b6b6b] text-sm mt-1">Enter the 6-digit code sent to <strong>{email}</strong></p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1.5 block">6-Digit Verification Code</label>
                  <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                    placeholder="000000" maxLength={6}
                    className="w-full border border-[#e8e8e8] rounded-xl px-3.5 py-4 text-3xl font-mono font-black text-center tracking-[1rem] outline-none focus:border-[#1a6b3a] focus:ring-2 focus:ring-[#1a6b3a]/10 transition-all"/>
                </div>
                <SubmitBtn label="Verify & Create Account" onClick={handleVerifyAndRegister}/>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <button onClick={handleSendCode} disabled={loading} className="text-[#6b6b6b] hover:text-[#1a6b3a] flex items-center gap-1">
                    <RefreshCw className="w-3 h-3"/> Resend code
                  </button>
                  <button onClick={() => reset('register')} className="text-[#6b6b6b] hover:text-[#1a6b3a]">← Change details</button>
                </div>
              </div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {screen === 'forgot' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e8e8e8] p-6 lg:p-8 space-y-4">
                <div className="flex items-center justify-center w-14 h-14 bg-amber-50 rounded-2xl mx-auto mb-4">
                  <KeyRound className="w-7 h-7 text-amber-600"/>
                </div>
                <div className="text-center mb-4">
                  <h2 className="text-xl font-black text-[#0a0a0a]">Forgot password?</h2>
                  <p className="text-[#6b6b6b] text-sm mt-1">Enter your registered email to receive a reset code</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1.5 block">Registered Email *</label>
                  <input value={email} onChange={e => setEmail(e.target.value.toLowerCase())} type="email" placeholder="your@email.com"
                    className="w-full border border-[#e8e8e8] rounded-xl px-3.5 py-3 text-sm outline-none focus:border-[#1a6b3a] focus:ring-2 focus:ring-[#1a6b3a]/10 transition-all"/>
                </div>
                <SubmitBtn label="Send Reset Code" onClick={handleForgotSend}/>
                <div className="text-center pt-1">
                  <button onClick={() => reset('signin')} className="text-xs text-[#6b6b6b] hover:text-[#1a6b3a]">← Back to sign in</button>
                </div>
              </div>
            )}

            {/* ── RESET PASSWORD ── */}
            {screen === 'reset' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e8e8e8] p-6 lg:p-8 space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-black text-[#0a0a0a]">Reset password</h2>
                  <p className="text-[#6b6b6b] text-sm mt-1">Enter the code from your email and your new password</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1.5 block">6-Digit Reset Code</label>
                  <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                    placeholder="000000" maxLength={6}
                    className="w-full border border-[#e8e8e8] rounded-xl px-3.5 py-4 text-3xl font-mono font-black text-center tracking-[1rem] outline-none focus:border-[#1a6b3a] focus:ring-2 focus:ring-[#1a6b3a]/10 transition-all"/>
                </div>
                <PwInput value={password} onChange={setPassword} label="New Password * (min 6 chars)"/>
                <PwInput value={confirm} onChange={setConfirm} label="Confirm New Password *"/>
                <SubmitBtn label="Reset Password" onClick={handleReset}/>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <button onClick={handleForgotSend} disabled={loading} className="text-[#6b6b6b] hover:text-[#1a6b3a] flex items-center gap-1">
                    <RefreshCw className="w-3 h-3"/> Resend code
                  </button>
                  <button onClick={() => reset('signin')} className="text-[#6b6b6b] hover:text-[#1a6b3a]">← Back to sign in</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
