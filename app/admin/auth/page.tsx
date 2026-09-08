'use client'
import { useState, useEffect } from 'react'
import { useAdmin } from '@/components/AdminProvider'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function AdminAuthPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const { setAuth, admin, loading: authLoading } = useAdmin()
  const router = useRouter()

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && admin) router.replace('/admin/dashboard')
  }, [admin, authLoading, router])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim())    { setError('Enter your email'); return }
    if (!password.trim()) { setError('Enter your password'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return }
      setAuth(data.admin, data.token)
      router.push('/admin/dashboard')
    } catch {
      setError('Connection error. Please try again.')
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#1a6b3a] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#1a6b3a] rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-base">M</span>
          </div>
          <div>
            <p className="text-white font-black text-sm leading-tight">MOUAU Campus</p>
            <p className="text-white/30 text-[10px]">Administration Panel</p>
          </div>
        </div>

        <h1 className="text-2xl font-black text-white mb-1">Admin Sign In</h1>
        <p className="text-white/40 text-sm mb-8">Manage all content and settings</p>

        <form onSubmit={login} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@mouau.edu.ng"
              autoComplete="email"
              className="w-full px-3.5 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 outline-none focus:border-[#1a6b3a] focus:ring-2 focus:ring-[#1a6b3a]/20 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-3.5 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 outline-none focus:border-[#1a6b3a] focus:ring-2 focus:ring-[#1a6b3a]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-3">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a6b3a] hover:bg-[#145530] text-white font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
              : 'Sign In to Admin Panel'
            }
          </button>
        </form>

        <p className="text-center text-white/20 text-xs mt-8">
          <a href="/" className="hover:text-white/40 transition-colors">← Back to student portal</a>
        </p>
      </div>
    </div>
  )
}
