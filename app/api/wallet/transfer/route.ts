import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { flw, flwRef } from '@/lib/flutterwave'

const adminDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TRANSFER_FEE = 10.75 // NGN flat fee per transfer

export async function POST(req: NextRequest) {
  try {
    const { studentId, accountBank, accountNumber, amount, narration, beneficiaryName } = await req.json()
    if (!studentId || !accountBank || !accountNumber || !amount || !beneficiaryName)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const sid = studentId.toLowerCase().trim()
    const total = parseFloat(amount) + TRANSFER_FEE

    // Check balance
    const { data: wallet } = await adminDb
      .from('wallets').select('balance').eq('student_id', sid).maybeSingle()
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    if (parseFloat(wallet.balance) < total)
      return NextResponse.json({ error: `Insufficient balance. Need ₦${total.toFixed(2)} (including ₦${TRANSFER_FEE} fee)` }, { status: 400 })

    const reference = flwRef('TRF')

    // Create pending transaction
    await adminDb.from('wallet_transactions').insert({
      student_id:        sid,
      type:              'debit',
      category:          'transfer',
      amount:            parseFloat(amount),
      fee:               TRANSFER_FEE,
      reference,
      status:            'pending',
      narration:         narration || `Transfer to ${beneficiaryName}`,
      recipient_name:    beneficiaryName,
      recipient_account: accountNumber,
      recipient_bank:    accountBank,
    })

    // Deduct balance optimistically
    await adminDb.from('wallets').update({
      balance:    parseFloat(wallet.balance) - total,
      updated_at: new Date().toISOString(),
    }).eq('student_id', sid)

    // Initiate FLW transfer
    const result = await flw.post('/transfers', {
      account_bank:     accountBank,
      account_number:   accountNumber,
      amount:           parseFloat(amount),
      narration:        narration || `PDM MOUAU – ${beneficiaryName}`,
      currency:         'NGN',
      reference,
      beneficiary_name: beneficiaryName,
      callback_url:     'https://mouau-rose.vercel.app/api/webhook/flutterwave',
    })

    if (result.status === 'success') {
      await adminDb.from('wallet_transactions').update({
        status:  'success',
        flw_ref: result.data?.id?.toString(),
      }).eq('reference', reference)
      return NextResponse.json({ ok: true, message: 'Transfer initiated successfully', reference })
    } else {
      // Refund balance on failure
      await adminDb.from('wallets').update({
        balance:    parseFloat(wallet.balance),
        updated_at: new Date().toISOString(),
      }).eq('student_id', sid)
      await adminDb.from('wallet_transactions').update({ status: 'failed' }).eq('reference', reference)
      return NextResponse.json({ error: result.message || 'Transfer failed' }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
