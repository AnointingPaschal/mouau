import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { paystackRequest, paystackRef } from '@/lib/paystack'
import { logApiError } from '@/lib/logError'

function db() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  return createClient(url, key, { auth: { persistSession: false } })
}

const TRANSFER_FEE = 10

export async function POST(req: NextRequest) {
  try {
    const { studentId, bankCode, accountNumber, amount, narration, beneficiaryName } = await req.json()
    if (!studentId || !bankCode || !accountNumber || !amount || !beneficiaryName)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const client = db()
    const sid    = studentId.toLowerCase().trim()
    const total  = parseFloat(amount) + TRANSFER_FEE

    const { data: wallet } = await client.from('wallets').select('balance').eq('student_id', sid).maybeSingle()
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    if (parseFloat(wallet.balance) < total)
      return NextResponse.json({ error: `Insufficient balance. Need ₦${total.toFixed(2)} (incl. ₦${TRANSFER_FEE} fee)` }, { status: 400 })

    const reference = paystackRef('TRF')

    // Step 1: create transfer recipient
    const recpRes = await paystackRequest('/transferrecipient', 'POST', {
      type:           'nuban',
      name:           beneficiaryName,
      account_number: accountNumber,
      bank_code:      bankCode,
      currency:       'NGN',
    })
    const recipientCode = recpRes.data?.recipient_code
    if (!recipientCode) {
      return NextResponse.json({ error: recpRes.message || 'Failed to create transfer recipient' }, { status: 400 })
    }

    // Step 2: initiate transfer
    const tfrRes = await paystackRequest('/transfer', 'POST', {
      source:    'balance',
      amount:    Math.round(parseFloat(amount) * 100), // kobo
      recipient: recipientCode,
      reason:    narration || `PDM MOUAU – ${beneficiaryName}`,
      reference,
    })

    if (!tfrRes.status) {
      return NextResponse.json({ error: tfrRes.message || 'Transfer failed' }, { status: 400 })
    }

    // Deduct balance
    await client.from('wallets').update({
      balance:    parseFloat(wallet.balance) - total,
      updated_at: new Date().toISOString(),
    }).eq('student_id', sid)

    // Record transaction
    await client.from('wallet_transactions').insert({
      student_id:        sid,
      type:              'debit',
      category:          'transfer',
      amount:            parseFloat(amount),
      fee:               TRANSFER_FEE,
      reference,
      status:            tfrRes.data?.status === 'success' ? 'successful' : 'pending',
      narration:         narration || `Transfer to ${beneficiaryName}`,
      recipient_name:    beneficiaryName,
      recipient_account: accountNumber,
      recipient_bank:    bankCode,
      provider:          'paystack',
    })

    return NextResponse.json({ ok: true, status: tfrRes.data?.status, reference })
  } catch (e: any) {
    await logApiError({ route: '/api/wallet/paystack-transfer', error: e })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
