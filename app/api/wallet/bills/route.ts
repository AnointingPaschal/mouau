import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'
import { flw, flwRef } from '@/lib/flutterwave'

// category → FLW bill type mapping
const BILL_TYPES: Record<string, string> = {
  betting:     'BETTING',
  electricity: 'POWER',
  cable:       'DSTV',
  water:       'WATERBOARD',
}

export async function POST(req: NextRequest) {
  try {
    const { studentId, category, customer, amount, billerName, narration } = await req.json()
    if (!studentId || !category || !customer || !amount)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const adminDb = getAdminDb()
    const sid = studentId.toLowerCase().trim()
    const amt = parseFloat(amount)
    const billType = BILL_TYPES[category] || category.toUpperCase()

    const { data: wallet } = await adminDb
      .from('wallets').select('balance').eq('student_id', sid).maybeSingle()
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    if (parseFloat(wallet.balance) < amt)
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

    const reference = flwRef('BILL')

    await adminDb.from('wallets').update({
      balance:    parseFloat(wallet.balance) - amt,
      updated_at: new Date().toISOString(),
    }).eq('student_id', sid)

    const result = await flw.post('/bills', {
      type:       billType,
      country:    'NG',
      customer,
      amount:     amt,
      recurrence: 'ONCE',
      reference,
      ...(billerName ? { biller_name: billerName } : {}),
    })

    const status = result.status === 'success' ? 'success' : 'failed'

    if (status === 'failed') {
      await adminDb.from('wallets').update({
        balance:    parseFloat(wallet.balance),
        updated_at: new Date().toISOString(),
      }).eq('student_id', sid)
    }

    await adminDb.from('wallet_transactions').insert({
      student_id:        sid,
      type:              'debit',
      category,
      amount:            amt,
      fee:               0,
      reference,
      flw_ref:           result.data?.reference || null,
      status,
      narration:         narration || `${category} – ${customer}`,
      recipient_account: customer,
      metadata:          { billerName },
    })

    if (status === 'failed')
      return NextResponse.json({ error: result.message || 'Bill payment failed. Balance refunded.' }, { status: 400 })

    return NextResponse.json({ ok: true, message: `${category} payment successful` })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
