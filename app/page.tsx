'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { saveStudent } from '@/lib/auth'
import {
  Eye, EyeOff, ArrowRight, Loader2, AlertCircle,
  Mail, KeyRound, CheckCircle2, RefreshCw,
  GraduationCap, BookOpen, ChevronLeft
} from 'lucide-react'

type StudentType = 'fresher' | 'returning'

const JAMB_RE   = /^\d{10,11}$/
const MATRIC_RE = /^MOUAU\/[A-Z]{2,5}\/\d{2}\/\d+$/i
const LEVELS_RETURNING = ['200', '300', '400', '500', '600', '700']

function validateId(id: string, type: StudentType): string | null {
  const upper = id.trim().toUpperCase()
  if (!upper) return type === 'fresher' ? 'Enter your JAMB number' : 'Enter your Matric number'
  if (type === 'fresher') {
    if (JAMB_RE.test(upper)) return null
    return 'JAMB number should be 10–11 digits (e.g. 20241234567)'
  } else {
    if (MATRIC_RE.test(upper)) return null
    return 'Matric format: MOUAU/DEPT/YY/NUMBER (e.g. MOUAU/CMP/21/30239)'
  }
}

/* ── Reusable input — defined OUTSIDE component to avoid re-mount on every keystroke ── */
type InputProps = {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; hint?: string; mono?: boolean; autoFocus?: boolean
}
function TextInput({ label, value, onChange, placeholder, type = 'text', hint, mono = false, autoFocus }: InputProps) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1.5 block">{label}</label>
      <input
        autoFocus={autoFocus}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border border-[#e8e8e8] rounded-xl px-3.5 py-3 text-sm outline-none focus:border-[#1a6b3a] focus:ring-2 focus:ring-[#1a6b3a]/10 transition-all${mono ? ' font-mono' : ''}`}
      />
      {hint && <p className="text-[10px] text-[#aaa] mt-1">{hint}</p>}
    </div>
  )
}

type PwProps = { label?: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }
function PasswordInput({ label = 'Password *', value, onChange, show, onToggle }: PwProps) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Enter password"
          className="w-full border border-[#e8e8e8] rounded-xl px-3.5 py-3 text-sm outline-none focus:border-[#1a6b3a] focus:ring-2 focus:ring-[#1a6b3a]/10 transition-all pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#6b6b6b]"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

type BtnProps = { label: string; onClick: () => void; loading: boolean }
function SubmitButton({ label, onClick, loading }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full bg-[#1a6b3a] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#145530] active:scale-[0.98] transition-all disabled:opacity-60 mt-1"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <>{label} <ArrowRight className="w-4 h-4" /></>
      }
    </button>
  )
}

type Screen = 'signin' | 'type-select' | 'register' | 'verify' | 'forgot' | 'reset'

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const [screen,      setScreen]      = useState<Screen>('signin')
  const [studentType, setStudentType] = useState<StudentType>('fresher')
  const [idNumber,    setIdNumber]    = useState('')
  const [matricNum,   setMatricNum]   = useState('')
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [level,       setLevel]       = useState('100')
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [code,        setCode]        = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [info,        setInfo]        = useState('')
  const router = useRouter()
  const { setStudent } = useAuth()

  const clearMessages = () => { setError(''); setInfo('') }
  const goTo = (s: Screen) => { clearMessages(); setCode(''); setScreen(s) }

  /* ── Sign In ── */
  const handleSignIn = async () => {
    clearMessages()
    if (!idNumber.trim()) { setError('Enter your JAMB or Matric number'); return }
    if (!password) { setError('Enter your password'); return }
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idNumber: idNumber.trim().toUpperCase(), password })
    })
    const d = await res.json()
    setLoading(false)
    if (!d.ok) { setError(d.error || 'Login failed'); return }
    saveStudent(d.student)
    setStudent(d.student)
    router.push('/dashboard')
  }

  /* ── Send verification code ── */
  const handleSendCode = async () => {
    clearMessages()
    const idErr = validateId(idNumber, studentType)
    if (idErr) { setError(idErr); return }
    if (studentType === 'fresher' && matricNum.trim()) {
      if (!MATRIC_RE.test(matricNum.trim().toUpperCase())) {
        setError('Matric format: MOUAU/DEPT/YY/NUMBER'); return
      }
    }
    if (!name.trim())  { setError('Enter your full name'); return }
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email address'); return }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    const res = await fetch('/api/auth/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idNumber: idNumber.trim().toUpperCase(), name, email })
    })
    const d = await res.json()
    setLoading(false)
    if (d.error) { setError(d.error); return }
    setInfo(d.emailSent ? `Verification code sent to ${email}` : 'Code generated — ask admin for code')
    setScreen('verify')
  }

  /* ── Verify & create account ── */
  const handleVerifyAndRegister = async () => {
    clearMessages()
    if (code.length !== 6) { setError('Enter the 6-digit code from your email'); return }
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idNumber: idNumber.trim().toUpperCase(), name, email, password, code,
        studentType,
        matricNumber: studentType === 'returning' ? idNumber.trim().toUpperCase() : matricNum.trim().toUpperCase(),
        jambNumber:   studentType === 'fresher'   ? idNumber.trim().toUpperCase() : '',
      })
    })
    const d = await res.json()
    setLoading(false)
    if (!d.ok) { setError(d.error || 'Registration failed'); return }
    saveStudent(d.student)
    setStudent(d.student)
    router.push('/dashboard')
  }

  /* ── Forgot password ── */
  const handleForgotSend = async () => {
    clearMessages()
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

  /* ── Reset password ── */
  const handleReset = async () => {
    clearMessages()
    if (code.length !== 6) { setError('Enter the 6-digit code from your email'); return }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword: password })
    })
    const d = await res.json()
    setLoading(false)
    if (!d.ok) { setError(d.error || 'Reset failed'); return }
    setInfo('Password reset! Sign in with your new password.')
    goTo('signin')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex flex-col justify-between bg-[#0a0a0a] text-white p-12 w-[420px] flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 bg-[#1a6b3a] rounded flex items-center justify-center">
              <span className="text-white font-black text-xs">M</span>
            </div>
            <span className="font-black text-lg tracking-tight">MOUAU Campus</span>
          </div>
          <h1 className="text-4xl font-black leading-tight mb-6">
            Your complete<br />campus companion<br />
            <span className="text-[#1a6b3a]">at MOUAU.</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            Navigate campus, access study materials, track your CGPA, complete registration, and connect with fellow students.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-8">
            <div className="border border-white/10 rounded-xl p-4">
              <GraduationCap className="w-6 h-6 text-[#4ade80] mb-2" />
              <p className="font-bold text-white text-sm">New Students</p>
              <p className="text-white/40 text-xs mt-1">Registration guide, orientation, campus map</p>
            </div>
            <div className="border border-white/10 rounded-xl p-4">
              <BookOpen className="w-6 h-6 text-[#60a5fa] mb-2" />
              <p className="font-bold text-white text-sm">Returning Students</p>
              <p className="text-white/40 text-xs mt-1">CGPA tracker, courses, results, resources</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
          {[['5,000+', 'STUDENTS'], ['500+', 'MATERIALS'], ['30+', 'DEPTS']].map(([n, l]) => (
            <div key={l}>
              <div className="text-2xl font-black">{n}</div>
              <div className="text-[10px] font-semibold text-white/40 tracking-widest mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col bg-[#f9f9f7]">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-2 px-5 py-4 border-b border-[#e8e8e8] bg-white">
          <div className="w-7 h-7 bg-[#1a6b3a] rounded flex items-center justify-center">
            <span className="text-white font-black text-xs">M</span>
          </div>
          <span className="font-black text-base tracking-tight">MOUAU Campus</span>
        </div>

        <div className="flex-1 flex items-start justify-center p-5 pt-8 lg:p-16 lg:items-center overflow-y-auto">
          <div className="w-full max-w-lg">

            {/* Banners */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl px-3.5 py-3 mb-4">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {info && (
              <div className="flex items-start gap-2.5 bg-[#f0f9f4] border border-[#1a6b3a]/20 text-[#1a6b3a] text-xs rounded-xl px-3.5 py-3 mb-4">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{info}</span>
              </div>
            )}

            {/* ════ SIGN IN ════ */}
            {screen === 'signin' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e8e8e8] p-6 lg:p-8 space-y-4">
                <div className="mb-2">
                  <h2 className="text-2xl font-black text-[#0a0a0a]">Welcome back</h2>
                  <p className="text-[#6b6b6b] text-sm mt-1">Sign in with your JAMB or Matric number</p>
                </div>
                <TextInput
                  label="JAMB / Matric Number *"
                  value={idNumber}
                  onChange={v => setIdNumber(v.toUpperCase())}
                  placeholder="e.g. 20241234567 or MOUAU/CMP/21/30239"
                  mono
                  hint="Both JAMB and Matric numbers are accepted"
                />
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  show={showPw}
                  onToggle={() => setShowPw(p => !p)}
                />
                <SubmitButton label="Sign In" onClick={handleSignIn} loading={loading} />
                <div className="flex items-center justify-between pt-1 text-xs">
                  <button onClick={() => goTo('forgot')} className="text-[#6b6b6b] hover:text-[#1a6b3a] transition-colors">
                    Forgot password?
                  </button>
                  <button
                    onClick={() => { goTo('type-select'); setPassword(''); setConfirm('') }}
                    className="text-[#1a6b3a] font-semibold hover:underline"
                  >
                    Create account →
                  </button>
                </div>
              </div>
            )}

            {/* ════ TYPE SELECT ════ */}
            {screen === 'type-select' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e8e8e8] p-6 lg:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-[#0a0a0a]">Create account</h2>
                  <p className="text-[#6b6b6b] text-sm mt-1">Are you a new fresher or a returning student?</p>
                </div>
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => { setStudentType('fresher'); setLevel('100'); goTo('register') }}
                    className="flex items-center gap-4 p-5 border-2 border-[#e8e8e8] rounded-2xl hover:border-[#1a6b3a] hover:bg-[#f0faf4] transition-all text-left w-full group"
                  >
                    <div className="w-12 h-12 bg-[#f0faf4] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#1a6b3a]/10">
                      <GraduationCap className="w-6 h-6 text-[#1a6b3a]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-[#0a0a0a] text-base">New Student (Fresher)</p>
                      <p className="text-[#6b6b6b] text-xs mt-1">Just got admitted? Start here. You'll need your JAMB reg number.</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#aaa] group-hover:text-[#1a6b3a]" />
                  </button>
                  <button
                    onClick={() => { setStudentType('returning'); setLevel('200'); goTo('register') }}
                    className="flex items-center gap-4 p-5 border-2 border-[#e8e8e8] rounded-2xl hover:border-[#2563eb] hover:bg-[#eff6ff] transition-all text-left w-full group"
                  >
                    <div className="w-12 h-12 bg-[#eff6ff] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#2563eb]/10">
                      <BookOpen className="w-6 h-6 text-[#2563eb]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-[#0a0a0a] text-base">Returning Student</p>
                      <p className="text-[#6b6b6b] text-xs mt-1">200L and above? Sign up with your Matric number.</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#aaa] group-hover:text-[#2563eb]" />
                  </button>
                </div>
                <div className="text-center">
                  <button onClick={() => goTo('signin')} className="text-xs text-[#6b6b6b] hover:text-[#1a6b3a] flex items-center gap-1 mx-auto">
                    <ChevronLeft className="w-3 h-3" /> Already have an account? Sign in
                  </button>
                </div>
              </div>
            )}

            {/* ════ REGISTER ════ */}
            {screen === 'register' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e8e8e8] p-6 lg:p-8 space-y-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${studentType === 'fresher' ? 'bg-[#f0faf4] text-[#1a6b3a]' : 'bg-[#eff6ff] text-[#2563eb]'}`}>
                    {studentType === 'fresher' ? <GraduationCap className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                    {studentType === 'fresher' ? 'New Fresher' : 'Returning Student'}
                  </div>
                  <button onClick={() => goTo('type-select')} className="text-[10px] text-[#aaa] hover:text-[#6b6b6b]">Change</button>
                </div>
                <h2 className="text-xl font-black text-[#0a0a0a]">Create your account</h2>

                <TextInput label="Full Name *" value={name} onChange={setName} placeholder="e.g. Anointing Paschal" />

                {studentType === 'fresher' ? (
                  <>
                    <TextInput
                      label="JAMB Registration Number *"
                      value={idNumber}
                      onChange={v => setIdNumber(v.toUpperCase())}
                      placeholder="e.g. 20241234567"
                      mono
                      hint="10–11 digit number from your JAMB result slip"
                    />
                    <TextInput
                      label="Matric Number (optional — add now if you have it)"
                      value={matricNum}
                      onChange={v => setMatricNum(v.toUpperCase())}
                      placeholder="MOUAU/DEPT/YY/NUMBER"
                      mono
                      hint="You can also add this later in your profile"
                    />
                  </>
                ) : (
                  <TextInput
                    label="Matric Number *"
                    value={idNumber}
                    onChange={v => setIdNumber(v.toUpperCase())}
                    placeholder="MOUAU/DEPT/YY/NUMBER"
                    mono
                    hint="Format: MOUAU/DEPARTMENT/YEAR/NUMBER"
                  />
                )}

                {studentType === 'returning' && (
                  <div>
                    <label className="text-xs font-semibold text-[#6b6b6b] uppercase tracking-wide mb-1.5 block">Current Level *</label>
                    <div className="flex flex-wrap gap-2">
                      {LEVELS_RETURNING.map(l => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setLevel(l)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${level === l ? 'border-[#2563eb] bg-[#eff6ff] text-[#2563eb]' : 'border-[#e8e8e8] text-[#6b6b6b]'}`}
                        >
                          {l}L
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <TextInput
                  label="Email Address *"
                  value={email}
                  onChange={v => setEmail(v.toLowerCase())}
                  type="email"
                  placeholder="your@email.com"
                  hint="For verification code and password reset"
                />
                <PasswordInput label="Password * (min 6 chars)" value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw(p => !p)} />
                <PasswordInput label="Confirm Password *" value={confirm} onChange={setConfirm} show={showPw} onToggle={() => setShowPw(p => !p)} />

                <SubmitButton label="Send Verification Code" onClick={handleSendCode} loading={loading} />
                <div className="text-center">
                  <button onClick={() => goTo('type-select')} className="text-xs text-[#6b6b6b] hover:text-[#1a6b3a] flex items-center gap-1 mx-auto">
                    <ChevronLeft className="w-3 h-3" /> Back
                  </button>
                </div>
              </div>
            )}

            {/* ════ VERIFY EMAIL ════ */}
            {screen === 'verify' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e8e8e8] p-6 lg:p-8 space-y-4">
                <div className="flex items-center justify-center w-14 h-14 bg-[#f0f9f4] rounded-2xl mx-auto mb-4">
                  <Mail className="w-7 h-7 text-[#1a6b3a]" />
                </div>
                <div className="text-center mb-4">
                  <h2 className="text-xl font-black text-[#0a0a0a]">Check your email</h2>
                  <p className="text-[#6b6b6b] text-sm mt-1">6-digit code sent to <strong>{email}</strong></p>
                </div>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  className="w-full border border-[#e8e8e8] rounded-xl px-3.5 py-4 text-3xl font-mono font-black text-center tracking-[1rem] outline-none focus:border-[#1a6b3a] focus:ring-2 focus:ring-[#1a6b3a]/10 transition-all"
                />
                <SubmitButton label="Verify & Create Account" onClick={handleVerifyAndRegister} loading={loading} />
                <div className="flex items-center justify-between pt-1 text-xs">
                  <button onClick={handleSendCode} disabled={loading} className="text-[#6b6b6b] hover:text-[#1a6b3a] flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Resend code
                  </button>
                  <button onClick={() => goTo('register')} className="text-[#6b6b6b] hover:text-[#1a6b3a]">← Change details</button>
                </div>
              </div>
            )}

            {/* ════ FORGOT PASSWORD ════ */}
            {screen === 'forgot' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e8e8e8] p-6 lg:p-8 space-y-4">
                <div className="flex items-center justify-center w-14 h-14 bg-amber-50 rounded-2xl mx-auto mb-4">
                  <KeyRound className="w-7 h-7 text-amber-600" />
                </div>
                <div className="text-center mb-4">
                  <h2 className="text-xl font-black text-[#0a0a0a]">Forgot password?</h2>
                  <p className="text-[#6b6b6b] text-sm mt-1">Enter your registered email for a reset code</p>
                </div>
                <TextInput label="Registered Email *" value={email} onChange={v => setEmail(v.toLowerCase())} type="email" placeholder="your@email.com" />
                <SubmitButton label="Send Reset Code" onClick={handleForgotSend} loading={loading} />
                <div className="text-center">
                  <button onClick={() => goTo('signin')} className="text-xs text-[#6b6b6b] hover:text-[#1a6b3a]">← Back to sign in</button>
                </div>
              </div>
            )}

            {/* ════ RESET PASSWORD ════ */}
            {screen === 'reset' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#e8e8e8] p-6 lg:p-8 space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-black text-[#0a0a0a]">Reset password</h2>
                  <p className="text-[#6b6b6b] text-sm mt-1">Enter the code from your email and your new password</p>
                </div>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  className="w-full border border-[#e8e8e8] rounded-xl px-3.5 py-4 text-3xl font-mono font-black text-center tracking-[1rem] outline-none focus:border-[#1a6b3a] focus:ring-2 focus:ring-[#1a6b3a]/10 transition-all"
                />
                <PasswordInput label="New Password * (min 6 chars)" value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw(p => !p)} />
                <PasswordInput label="Confirm New Password *" value={confirm} onChange={setConfirm} show={showPw} onToggle={() => setShowPw(p => !p)} />
                <SubmitButton label="Reset Password" onClick={handleReset} loading={loading} />
                <div className="flex items-center justify-between pt-1 text-xs">
                  <button onClick={handleForgotSend} disabled={loading} className="text-[#6b6b6b] hover:text-[#1a6b3a] flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Resend code
                  </button>
                  <button onClick={() => goTo('signin')} className="text-[#6b6b6b] hover:text-[#1a6b3a]">← Back to sign in</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
