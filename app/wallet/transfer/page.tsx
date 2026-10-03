'use client'
import WalletGuard from '@/components/WalletGuard'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { ArrowUpRight, Loader2, Search, ChevronRight, CheckCircle2 } from 'lucide-react'

type Bank = { id: number; code: string; name: string }

export default function TransferPage() {
  const { student } = useAuth()
  const [banks,          setBanks]         = useState<Bank[]>([])
  const [bankSearch,     setBankSearch]    = useState('')
  const [selectedBank,   setSelectedBank]  = useState<Bank|null>(null)
  const [showBankList,   setShowBankList]  = useState(false)
  const [accountNumber,  setAccountNumber] = useState('')
  const [amount,         setAmount]        = useState('')
  const [narration,      setNarration]     = useState('')
  const [beneficiaryName,setBeneficiary]   = useState('')
  const [loadingBanks,   setLoadingBanks]  = useState(false)
  const [verifying,      setVerifying]     = useState(false)
  const [submitting,     setSubmitting]    = useState(false)
  const [balance,        setBalance]       = useState<number>(0)
  const [error,          setError]         = useState('')
  const [success,        setSuccess]       = useState('')

  useEffect(() => {
    const loadBanks = async () => {
      setLoadingBanks(true)
      const r = await fetch('/api/wallet/banks')
      const d = await r.json()
      setBanks(d.banks || [])
      setLoadingBanks(false)
    }
    const loadBalance = async () => {
      if (!student?.idNumber) return
      const r = await fetch(`/api/wallet?studentId=${student.idNumber}`)
      const d = await r.json()
      setBalance(parseFloat(d.wallet?.balance || 0))
    }
    loadBanks(); loadBalance()
  }, [student?.idNumber])

  const filteredBanks = banks.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  )

  const verifyAccount = async () => {
    if (!selectedBank || accountNumber.length < 10) return
    setVerifying(true); setBeneficiary(''); setError('')
    const r = await fetch('/api/wallet/verify-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountNumber, bankCode: selectedBank.code }),
    })
    const d = await r.json()
    setVerifying(false)
    if (d.error) setError(d.error)
    else setBeneficiary(d.accountName || '')
  }

  useEffect(() => {
    if (accountNumber.length === 10 && selectedBank) verifyAccount()
  }, [accountNumber, selectedBank])

  const submit = async () => {
    if (!student || !selectedBank || !accountNumber || !amount || !beneficiaryName) return
    setSubmitting(true); setError(''); setSuccess('')
    const r = await fetch('/api/wallet/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId:       student.idNumber,
        accountBank:     selectedBank.code,
        accountNumber,
        amount:          parseFloat(amount),
        narration:       narration || `Transfer to ${beneficiaryName}`,
        beneficiaryName,
      }),
    })
    const d = await r.json()
    setSubmitting(false)
    if (d.error) setError(d.error)
    else {
      setSuccess(d.message || 'Transfer successful!')
      setAmount(''); setNarration(''); setAccountNumber(''); setSelectedBank(null); setBeneficiary('')
    }
  }

  const fee = 10.75
  const total = parseFloat(amount || '0') + fee

  return (<WalletGuard>
    <AppShell>
      <TopBar title="Bank Transfer" />
      <main className="pb-28 pt-4 px-4 max-w-lg mx-auto space-y-4">

        {/* Balance */}
        <div className="card p-4 flex items-center justify-between">
          <span className="text-sm text-[#888]">Available Balance</span>
          <span className="font-bold text-[#1e3a8a]">₦{balance.toLocaleString('en-NG', {minimumFractionDigits:2})}</span>
        </div>

        {success && (
          <div className="rounded-xl p-4 bg-green-50 border border-green-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#1a6b3a] flex-shrink-0"/>
            <p className="text-sm text-[#1a6b3a] font-semibold">{success}</p>
          </div>
        )}
        {error && (
          <div className="rounded-xl p-4 bg-red-50 border border-red-200">
            <p className="text-sm text-[#b91c1c]">{error}</p>
          </div>
        )}

        <div className="card p-4 space-y-4">
          {/* Bank selector */}
          <div>
            <label className="text-xs font-semibold text-[#333] mb-1 block">Bank</label>
            <button onClick={() => setShowBankList(p=>!p)}
              className="input w-full text-left text-sm flex items-center justify-between">
              <span className={selectedBank ? 'text-[#0a0a0a]' : 'text-[#aaa]'}>
                {selectedBank ? selectedBank.name : 'Select a bank…'}
              </span>
              <ChevronRight className="w-4 h-4 text-[#aaa]"/>
            </button>
            {showBankList && (
              <div className="border border-[#e5e5e5] rounded-xl mt-1 max-h-48 overflow-y-auto bg-white shadow-lg z-10 relative">
                <div className="sticky top-0 bg-white p-2 border-b border-[#f0f0f0]">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa]"/>
                    <input value={bankSearch} onChange={e=>setBankSearch(e.target.value)}
                      placeholder="Search bank…" className="input pl-7 text-xs py-1.5 w-full"/>
                  </div>
                </div>
                {loadingBanks
                  ? <div className="py-4 text-center"><Loader2 className="w-5 h-5 animate-spin text-[#aaa] mx-auto"/></div>
                  : filteredBanks.map(bank => (
                    <button key={bank.id} onClick={() => { setSelectedBank(bank); setShowBankList(false); setBankSearch('') }}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#f5f5f5] border-b border-[#f7f7f7] last:border-0">
                      {bank.name}
                    </button>
                  ))
                }
              </div>
            )}
          </div>

          {/* Account number */}
          <div>
            <label className="text-xs font-semibold text-[#333] mb-1 block">Account Number</label>
            <div className="relative">
              <input value={accountNumber} onChange={e=>setAccountNumber(e.target.value.replace(/\D/,'').slice(0,10))}
                placeholder="10-digit account number" className="input w-full text-sm font-mono" maxLength={10}/>
              {verifying && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#aaa]"/>}
            </div>
            {beneficiaryName && (
              <p className="text-xs text-[#1a6b3a] font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5"/> {beneficiaryName}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-[#333] mb-1 block">Amount (₦)</label>
            <input value={amount} onChange={e=>setAmount(e.target.value.replace(/\D/,''))}
              placeholder="Enter amount" className="input w-full text-sm" type="number" min="100"/>
            {amount && (
              <p className="text-[10px] text-[#888] mt-1">
                Amount: ₦{parseFloat(amount).toLocaleString()} + Fee: ₦{fee} = <strong>₦{total.toLocaleString()}</strong>
              </p>
            )}
          </div>

          {/* Narration */}
          <div>
            <label className="text-xs font-semibold text-[#333] mb-1 block">Narration <span className="text-[#aaa] font-normal">(optional)</span></label>
            <input value={narration} onChange={e=>setNarration(e.target.value)}
              placeholder="e.g. School fees, Rent…" className="input w-full text-sm"/>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={submitting || !selectedBank || !accountNumber || !amount || !beneficiaryName}
          className="w-full py-3.5 bg-[#1e3a8a] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <ArrowUpRight className="w-4 h-4"/>}
          Send ₦{parseFloat(amount||'0').toLocaleString()}
        </button>

        <p className="text-[10px] text-[#aaa] text-center">Transfers are processed immediately. A flat fee of ₦10.75 applies.</p>
      </main>
    </AppShell>
  </WalletGuard>
  )
}
