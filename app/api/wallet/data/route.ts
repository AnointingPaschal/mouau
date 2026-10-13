import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'
import { bigi, bigiRef, bigiSuccess, NETWORK_IDS, BIGI_ENDPOINTS } from '@/lib/bigisub'
import { logApiError } from '@/lib/logError'

export async function POST(req: NextRequest) {
  try {
    const { studentId, phone, amount, network, planId, planName } = await req.json()
    if (!studentId || !phone || !network || !planId)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const adminDb = getAdminDb()
    const sid = studentId.toLowerCase().trim()
    const networkName = NETWORK_NAMES[network.toUpperCase()] ?? 'MTN'
    const amt = parseFloat(amount || '0')

    const { data: wallet } = await adminDb
      .from('wallets').select('balance').eq('student_id', sid).maybeSingle()
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    if (amt > 0 && parseFloat(wallet.balance) < amt)
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

    const reference = bigiRef('DAT')

    if (amt > 0) {
      await adminDb.from('wallets').update({
        balance: parseFloat(wallet.balance) - amt,
        updated_at: new Date().toISOString(),
      }).eq('student_id', sid)
    }

    // POST /api/v2/vtu/data/purchase/
    // v2 fields: network (string), plan (plan id string), phone (string)
    let result: any
    let status: 'success' | 'failed' = 'failed'
    try {
      result = await bigi.post(BIGI_ENDPOINTS.dataPurchase, {
        network:      networkId,
        plan:         planId,     // numeric plan ID from data/plans response
        phone_number: phone,
        Ported_number: true,
      })
      status = bigiSuccess(result) ? 'success' : 'failed'
    } catch (err: any) {
      result = { error: err.message }
      status = 'failed'
    }

    if (status === 'failed' && amt > 0) {
      await adminDb.from('wallets').update({
        balance: parseFloat(wallet.balance),
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
      flw_ref:      result?.data?.transaction_id || result?.data?.reference || null,
      status,
      narration:    `${network} Data – ${planName || planId}`,
      phone_number: phone,
      network,
      metadata:     { planId, planName },
    })

    if (status === 'failed') {
      const msg = result?.error || result?.message
        || (result?.errors ? JSON.stringify(result.errors) : null)
        || 'Data purchase failed. Balance refunded.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: `${planName || network + ' data'} sent to ${phone}` })
  } catch (e: any) {
    await logApiError({ route: '/api/wallet/data', error: e })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
