'use client'
import { useState } from 'react'
import { useAdmin } from '@/components/AdminProvider'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setAuth } = useAdmin()
  const router = useRouter()

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return }
      setAuth(data.admin, data.token)
      router.push('/admin/dashboard')
    } catch { setError('Connection error'); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#1a6b3a] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">M</span>
            </div>
            <div>
              <p className="text-white font-black text-sm">MOUAU FreshStart</p>
              <p className="text-white/30 text-[10px]">Administration</p>
            </div>
          </div>
          <h1 className="text-2xl font-black text-white">Admin Sign In</h1>
          <p className="text-white/40 text-sm mt-1">Manage all content and settings</p>
        </div>
        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#1a6b3a] transition-colors"
              placeholder="admin@mouau.edu.ng"/>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wide mb-1.5 block">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full px-3.5 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#1a6b3a] transition-colors"
                placeholder="••••••••"/>
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#1a6b3a] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#145530] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Signing in...</> : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-white/20 text-xs mt-6">
          <a href="/" className="hover:text-white/40 transition-colors">Back to student portal</a>
        </p>
      </div>
    </div>
  )
}
