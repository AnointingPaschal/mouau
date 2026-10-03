import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { flw, flwRef } from '@/lib/flutterwave'

const adminDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { studentId, phone, amount, network, planId, planName } = await req.json()
    if (!studentId || !phone || !amount || !network)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const sid = studentId.toLowerCase().trim()
    const amt = parseFloat(amount)

    const { data: wallet } = await adminDb
      .from('wallets').select('balance').eq('student_id', sid).maybeSingle()
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    if (parseFloat(wallet.balance) < amt)
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

    const reference = flwRef('DAT')

    await adminDb.from('wallets').update({
      balance:    parseFloat(wallet.balance) - amt,
      updated_at: new Date().toISOString(),
    }).eq('student_id', sid)

    // FLW data bundle purchase
    const result = await flw.post('/bills', {
      type:       'DATABUNDLE',
      country:    'NG',
      customer:   phone,
      amount:     amt,
      recurrence: 'ONCE',
      reference,
      ...(planId ? { biller_name: planId } : {}),
    })

    const status = result.status === 'success' ? 'success' : 'failed'

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
      flw_ref:      result.data?.reference || null,
      status,
      narration:    `${network} Data – ${planName || phone}`,
      phone_number: phone,
      network,
      metadata:     { planId, planName },
    })

    if (status === 'failed')
      return NextResponse.json({ error: result.message || 'Data purchase failed. Balance refunded.' }, { status: 400 })

    return NextResponse.json({ ok: true, message: `${planName || network + ' data'} sent to ${phone}` })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
