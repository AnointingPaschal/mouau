'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { Copy, CheckCircle2, Loader2, RefreshCw, Building2 } from 'lucide-react'

export default function FundWalletPage() {
  const { student } = useAuth()
  const [wallet,    setWallet]    = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [creating,  setCreating]  = useState(false)
  const [copied,    setCopied]    = useState(false)
  const [error,     setError]     = useState('')

  const fetchWallet = async (sid: string) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/wallet?studentId=${sid}`)
      const d = await r.json()
      setWallet(d.wallet || null)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (student?.idNumber) fetchWallet(student.idNumber)
    else setLoading(false)
  }, [student?.idNumber])

  const createAccount = async () => {
    if (!student) return
    setCreating(true); setError('')
    if (!student?.idNumber) return
    const r = await fetch('/api/wallet/create-virtual-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId:   student.idNumber,
        studentName: student.name,
        email:       student.email || `${student.idNumber}@mouau.edu.ng`,
        phone:       student.phone || '08000000000',
      }),
    })
    const d = await r.json()
    setCreating(false)
    if (d.error) setError(d.error)
    else fetchWallet(student.idNumber)
  }

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AppShell>
      <TopBar title="Fund Wallet" />
      <main className="pb-28 pt-4 px-4 max-w-lg mx-auto space-y-4">

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#aaa]"/></div>
        ) : !wallet?.account_number ? (
          /* No virtual account yet */
          <div className="card p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-[#f0fdf4] rounded-full flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-[#1a6b3a]"/>
            </div>
            <div>
              <p className="font-bold text-[#0a0a0a] text-base">Get Your Dedicated Account</p>
              <p className="text-sm text-[#888] mt-1 leading-relaxed">
                A personal bank account number will be created for you. Transfer any amount to it and your wallet is credited instantly.
              </p>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button onClick={createAccount} disabled={creating}
              className="w-full py-3 bg-[#1a6b3a] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {creating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Building2 className="w-4 h-4"/>}
              {creating ? 'Creating account…' : 'Create Virtual Account'}
            </button>
          </div>
        ) : (
          /* Show virtual account */
          <>
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#888] uppercase tracking-wide">Your Dedicated Account</p>
                <button onClick={fetchWallet} className="p-1.5 rounded-lg hover:bg-[#f5f5f5]">
                  <RefreshCw className="w-3.5 h-3.5 text-[#aaa]"/>
                </button>
              </div>

              <div className="bg-gradient-to-br from-[#1a6b3a] to-[#0f4424] rounded-2xl p-5 text-white space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 opacity-70"/>
                  <p className="text-xs opacity-70 font-medium">{wallet.bank_name || 'Wema Bank'}</p>
                </div>
                <div>
                  <p className="text-[10px] opacity-60 uppercase tracking-widest mb-1">Account Number</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-black tracking-widest font-mono">{wallet.account_number}</p>
                    <button onClick={() => copyText(wallet.account_number)}
                      className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0">
                      {copied ? <CheckCircle2 className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] opacity-60 uppercase tracking-widest mb-0.5">Account Name</p>
                  <p className="font-semibold text-sm">{wallet.account_name || student?.name}</p>
                </div>
              </div>

              <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3">
                <p className="text-[11px] text-[#92400e] leading-relaxed">
                  <strong>How to fund:</strong> Transfer any amount to the account above using your mobile banking app or USSD. Your wallet will be credited automatically within seconds.
                </p>
              </div>
            </div>

            {/* Current balance */}
            <div className="card p-4 flex items-center justify-between">
              <span className="text-sm text-[#888]">Current Balance</span>
              <span className="font-black text-lg text-[#1a6b3a]">
                ₦{parseFloat(wallet.balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Steps */}
            <div className="card p-4 space-y-3">
              <p className="text-xs font-bold text-[#888] uppercase tracking-wide">How It Works</p>
              {[
                { step: '1', text: 'Open your bank app or dial your bank\'s USSD code' },
                { step: '2', text: 'Select "Transfer to other banks" or "Inter-bank transfer"' },
                { step: '3', text: `Enter account number: ${wallet.account_number}` },
                { step: '4', text: `Select bank: ${wallet.bank_name || 'Wema Bank'}` },
                { step: '5', text: 'Enter amount and confirm — your wallet updates instantly' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#1a6b3a] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-[10px] font-black">{step}</span>
                  </div>
                  <p className="text-xs text-[#555] leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </AppShell>
  )
}
