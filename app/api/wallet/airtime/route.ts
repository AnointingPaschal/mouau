import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'
import { flw, flwRef } from '@/lib/flutterwave'

export async function POST(req: NextRequest) {
  try {
    const { studentId, phone, amount, network } = await req.json()
    if (!studentId || !phone || !amount || !network)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const adminDb = getAdminDb()
    const sid = studentId.toLowerCase().trim()
    const amt = parseFloat(amount)

    const { data: wallet } = await adminDb
      .from('wallets').select('balance').eq('student_id', sid).maybeSingle()
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    if (parseFloat(wallet.balance) < amt)
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

    const reference = flwRef('AIR')

    // Deduct balance
    await adminDb.from('wallets').update({
      balance:    parseFloat(wallet.balance) - amt,
      updated_at: new Date().toISOString(),
    }).eq('student_id', sid)

    // FLW airtime purchase
    const result = await flw.post('/bills', {
      type:       'AIRTIME',
      country:    'NG',
      customer:   phone,
      amount:     amt,
      recurrence: 'ONCE',
      reference,
    })

    const status = result.status === 'success' ? 'success' : 'failed'

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
      category:     'airtime',
      amount:       amt,
      fee:          0,
      reference,
      flw_ref:      result.data?.reference || null,
      status,
      narration:    `${network} Airtime – ${phone}`,
      phone_number: phone,
      network,
    })

    if (status === 'failed')
      return NextResponse.json({ error: result.message || 'Airtime purchase failed. Balance refunded.' }, { status: 400 })

    return NextResponse.json({ ok: true, message: `₦${amt} ${network} airtime sent to ${phone}` })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
