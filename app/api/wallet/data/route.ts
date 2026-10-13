import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'
import { bigi, bigiRef, NETWORK_IDS } from '@/lib/bigisub'
import { logApiError } from '@/lib/logError'

export async function POST(req: NextRequest) {
  try {
    const { studentId, phone, amount, network, planId, planName } = await req.json()
    if (!studentId || !phone || !network || !planId)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const adminDb = getAdminDb()
    const sid = studentId.toLowerCase().trim()
    const networkId = NETWORK_IDS[network.toUpperCase()] ?? NETWORK_IDS['MTN']

    // Fetch plan price from Bigisub (plan has its own price)
    const { data: wallet } = await adminDb
      .from('wallets').select('balance').eq('student_id', sid).maybeSingle()
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })

    // amount is passed from frontend (plan.price)
    const amt = parseFloat(amount)
    if (parseFloat(wallet.balance) < amt)
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

    const reference = bigiRef('DAT')

    // Deduct balance first
    await adminDb.from('wallets').update({
      balance:    parseFloat(wallet.balance) - amt,
      updated_at: new Date().toISOString(),
    }).eq('student_id', sid)

    // Bigisub data purchase
    // POST /api/data/ { network, mobile_number, plan, Ported_number }
    let result: any
    let status: 'success' | 'failed' = 'failed'
    try {
      result = await bigi.post('/api/data/', {
        network:       networkId,
        mobile_number: phone,
        plan:          planId,          // plan id from /api/databundles/
        Ported_number: true,
      })
      const s = (result?.Status || result?.status || '').toLowerCase()
      status = s.includes('success') || s.includes('successful') ? 'success' : 'failed'
    } catch (err: any) {
      result = { error: err.message }
      status = 'failed'
    }

    // Refund on failure
    if (status === 'failed') {
      await adminDb.from('wallets').update({
        balance:    parseFloat(wallet.balance),
        updated_at: new Date().toISOString(),
      }).eq('student_id', sid)
    }

    await adminDb.from('wallet_transactions').insert({
      student_id:   sid,
      type:         'debit',
      category:     'data',
      amount:       amt,
      fee:          0,
      reference,
      flw_ref:      result?.id?.toString() || result?.transaction_id?.toString() || null,
      status,
      narration:    `${network} Data – ${planName || phone}`,
      phone_number: phone,
      network,
      metadata:     { planId, planName },
    })

    if (status === 'failed') {
      const msg = result?.error || result?.message || result?.errors || 'Data purchase failed. Balance refunded.'
      return NextResponse.json({ error: typeof msg === 'string' ? msg : JSON.stringify(msg) }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: `${planName || network + ' data'} sent to ${phone}` })
  } catch (e: any) {
    await logApiError({ route: '/api/wallet/data', error: e })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
