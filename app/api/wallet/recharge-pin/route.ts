import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'
import { bigi, bigiRef, bigiSuccess, BIGI_ENDPOINTS } from '@/lib/bigisub'
import { logApiError } from '@/lib/logError'

// POST /api/wallet/recharge-pin
// Body: { studentId, planId, quantity, phone }
export async function POST(req: NextRequest) {
  try {
    const { studentId, planId, quantity = 1, phone, amount, planLabel } = await req.json()
    if (!studentId || !planId)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const adminDb = getAdminDb()
    const sid = studentId.toLowerCase().trim()
    const amt = parseFloat(amount || '0')

    const { data: wallet } = await adminDb
      .from('wallets').select('balance').eq('student_id', sid).maybeSingle()
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    if (amt > 0 && parseFloat(wallet.balance) < amt)
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

    const reference = bigiRef('RCP')

    if (amt > 0) {
      await adminDb.from('wallets').update({
        balance: parseFloat(wallet.balance) - amt,
        updated_at: new Date().toISOString(),
      }).eq('student_id', sid)
    }

    // POST /api/v2/vtu/recharge-pin/purchase/
    // Body: { plan: id, quantity }
    let result: any
    let status: 'success' | 'failed' = 'failed'
    try {
      result = await bigi.post(BIGI_ENDPOINTS.rechargePinBuy, {
        plan:     planId,
        quantity: quantity || 1,
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
      category:     'recharge-pin',
      amount:       amt,
      fee:          0,
      reference,
      flw_ref:      result?.data?.transaction_id || result?.data?.reference || null,
      status,
      narration:    `Recharge Pin – ${planLabel || planId} x${quantity}`,
      phone_number: phone || null,
      metadata:     { planId, quantity },
    })

    if (status === 'failed') {
      const msg = result?.error || result?.message
        || (result?.errors ? JSON.stringify(result.errors) : null)
        || 'Recharge pin purchase failed. Balance refunded.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // Return pins if available
    const pins = result?.data?.pins ?? result?.data?.pin ?? result?.pins ?? null
    return NextResponse.json({
      ok: true,
      message: `${planLabel || 'Recharge pin'} purchased successfully`,
      pins: Array.isArray(pins) ? pins : pins ? [pins] : [],
    })
  } catch (e: any) {
    await logApiError({ route: '/api/wallet/recharge-pin', error: e })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
