'use client'
import WalletGuard from '@/components/WalletGuard'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import { useAuth } from '@/components/AuthProvider'
import { MessageSquare, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react'

export default function SMSPage() {
  const { student } = useAuth()
  const [message,    setMessage]    = useState('')
  const [recipients, setRecipients] = useState('')
  const [senderId,   setSenderId]   = useState('PDM MOUAU')
  const [pricing,    setPricing]    = useState<any>(null)
  const [balance,    setBalance]    = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState('')
  const [jobId,      setJobId]      = useState<string|null>(null)

  useEffect(() => {
    if (!student?.idNumber) return
    fetch(`/api/wallet?studentId=${student.idNumber}`)
      .then(r=>r.json()).then(d=>setBalance(parseFloat(d.wallet?.balance||0)))
    fetch('/api/admin/bigisub/sms-pricing')
      .then(r=>r.json()).then(d=>setPricing(d.pricing))
  }, [student?.idNumber])

  const recipientList = recipients.split(/[\n,;]+/).map(r=>r.trim()).filter(Boolean)
  const charCount = message.length
  const isUnicode = /[^\x00-\x7F]/.test(message)
  const charsPerPage = pricing ? (isUnicode ? pricing.unicode_chars_per_page : pricing.normal_chars_per_page) : (isUnicode ? 70 : 160)
  const pages = message ? Math.ceil(charCount / charsPerPage) : 0
  const costPerPage = pricing?.cost_per_page ?? 6.5
  const totalCost = pages * costPerPage * recipientList.length

  const submit = async () => {
    if (!student || !message || recipientList.length === 0) return
    setLoading(true); setError(''); setSuccess(''); setJobId(null)
    try {
      const r = await fetch('/api/wallet/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId:  student.idNumber,
          message,
          recipients: recipientList,
          senderId,
          amount: totalCost,
        }),
      })
      const d = await r.json()
      if (d.error) setError(d.error)
      else {
        setSuccess(d.message)
        if (d.job_id) setJobId(d.job_id)
        setMessage(''); setRecipients('')
        fetch(`/api/wallet?studentId=${student.idNumber}`).then(r=>r.json()).then(d=>setBalance(parseFloat(d.wallet?.balance||0)))
      }
    } catch { setError('Network error. Please try again.') }
    setLoading(false)
  }

  return (
    <WalletGuard>
      <AppShell>
        <TopBar title="Bulk SMS" />
        <main className="pb-28 pt-4 px-4 max-w-lg mx-auto space-y-4">

          {/* Balance */}
          <div className="rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg,#1e3a8a,#1a6b3a)' }}>
            <span className="text-white/70 text-xs">Wallet Balance</span>
            <span className="text-white font-black text-base">₦{balance.toLocaleString('en-NG',{minimumFractionDigits:2})}</span>
          </div>

          {success && (
            <div className="rounded-2xl p-4 bg-green-50 border border-green-200 space-y-1">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#1a6b3a] mt-0.5 flex-shrink-0"/>
                <p className="text-sm text-[#1a6b3a] font-semibold">{success}</p>
              </div>
              {jobId && <p className="text-[10px] text-[#888] pl-8">Job ID: <span className="font-mono font-bold">{jobId}</span></p>}
            </div>
          )}
          {error && (
            <div className="rounded-2xl p-4 bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#b91c1c] mt-0.5 flex-shrink-0"/>
              <p className="text-sm text-[#b91c1c]">{error}</p>
            </div>
          )}

          <div className="card p-5 space-y-4">
            {/* Sender ID */}
            <div>
              <label className="text-xs font-bold text-[#555] uppercase tracking-wide mb-1.5 block">Sender ID</label>
              <input value={senderId} onChange={e=>setSenderId(e.target.value.slice(0,11))}
                placeholder="e.g. PDM MOUAU" maxLength={11}
                className="input w-full text-sm"/>
              <p className="text-[10px] text-[#aaa] mt-1">Max 11 characters</p>
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#555] uppercase tracking-wide">Message</label>
                <span className="text-[10px] text-[#aaa]">{charCount} chars · {pages} page{pages!==1?'s':''}</span>
              </div>
              <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4}
                placeholder="Type your message here..."
                className="input w-full text-sm resize-none"/>
              {pricing && (
                <p className="text-[10px] text-[#aaa] mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3"/>
                  ₦{costPerPage}/page · {isUnicode ? pricing.unicode_chars_per_page : pricing.normal_chars_per_page} chars/page
                </p>
              )}
            </div>

            {/* Recipients */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#555] uppercase tracking-wide">Recipients</label>
                <span className="text-[10px] text-[#aaa]">{recipientList.length} number{recipientList.length!==1?'s':''}</span>
              </div>
              <textarea value={recipients} onChange={e=>setRecipients(e.target.value)} rows={4}
                placeholder="08012345678, 08087654321&#10;One number per line or comma-separated"
                className="input w-full text-sm font-mono resize-none"/>
              <p className="text-[10px] text-[#aaa] mt-1">Max 500 recipients</p>
            </div>
          </div>

          {/* Cost preview */}
          {message && recipientList.length > 0 && (
            <div className="card p-4 border-2 border-[#1a6b3a]/20">
              <p className="text-xs text-[#888] mb-2 font-semibold">Cost Preview</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#f9f9f9] rounded-xl p-2">
                  <p className="text-lg font-black text-[#1a6b3a]">{pages}</p>
                  <p className="text-[9px] text-[#aaa] uppercase tracking-wide">Pages</p>
                </div>
                <div className="bg-[#f9f9f9] rounded-xl p-2">
                  <p className="text-lg font-black text-[#1a6b3a]">{recipientList.length}</p>
                  <p className="text-[9px] text-[#aaa] uppercase tracking-wide">Recipients</p>
                </div>
                <div className="bg-[#f9f9f9] rounded-xl p-2">
                  <p className="text-lg font-black text-[#1e3a8a]">₦{totalCost.toFixed(2)}</p>
                  <p className="text-[9px] text-[#aaa] uppercase tracking-wide">Total</p>
                </div>
              </div>
            </div>
          )}

          <button onClick={submit}
            disabled={loading || !message || recipientList.length===0 || totalCost>balance}
            className="w-full py-4 bg-[#1a6b3a] text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <MessageSquare className="w-5 h-5"/>}
            {loading ? 'Sending...' : `Send SMS${recipientList.length>0?' to '+recipientList.length+' recipient'+(recipientList.length>1?'s':''):''}`}
          </button>

          <p className="text-center text-[10px] text-[#aaa]">Powered by Bigisub · Max 500 recipients per send</p>
        </main>
      </AppShell>
    </WalletGuard>
  )
}
