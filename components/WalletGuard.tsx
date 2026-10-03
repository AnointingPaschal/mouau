'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, Loader2 } from 'lucide-react'

export default function WalletGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [allowed,  setAllowed]  = useState(false)

  useEffect(() => {
    fetch('/api/admin/wallet-toggle')
      .then(r => r.json())
      .then(d => {
        setAllowed(!!d.enabled)
        setChecking(false)
        if (!d.enabled) {
          // Redirect back after 3 s
          setTimeout(() => router.push('/dashboard'), 3000)
        }
      })
      .catch(() => { setAllowed(false); setChecking(false) })
  }, [])

  if (checking) return (
    <div className="flex justify-center items-center py-32">
      <Loader2 className="w-6 h-6 animate-spin text-[#aaa]"/>
    </div>
  )

  if (!allowed) return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 bg-[#f5f5f5] rounded-full flex items-center justify-center mb-4">
        <Wallet className="w-7 h-7 text-[#ccc]"/>
      </div>
      <p className="font-bold text-[#0a0a0a] text-base mb-1">Wallet Coming Soon</p>
      <p className="text-sm text-[#888]">This feature is not yet enabled. Redirecting you back…</p>
    </div>
  )

  return <>{children}</>
}
