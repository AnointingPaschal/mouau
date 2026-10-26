import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function db() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const sig     = req.headers.get('x-paystack-signature') || ''
    const client  = db()

    // Fetch webhook secret
    const { data: secretRow } = await client.from('app_settings')
      .select('value').eq('key', 'paystack_webhook_secret').maybeSingle()
    const secret = (secretRow?.value || '').trim()

    if (secret) {
      const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
      if (hash !== sig) {
        await client.from('api_errors').insert({ route: '/api/webhook/paystack', error: 'Invalid signature', created_at: new Date().toISOString() })
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(rawBody)
    const type  = event.event

    // ── DVA charge: wallet funding ─────────────────────────────
    if (type === 'charge.success' || type === 'dedicatedaccount.assign.success') {
      const data       = event.data
      const amount     = parseFloat(data.amount) / 100  // Paystack amounts in kobo
      const acctNumber = data.authorization?.receiver_bank_account_number ||
                         data.dedicated_account?.account_number

      if (!acctNumber) return NextResponse.json({ ok: true })

      const { data: wallet } = await client.from('wallets')
        .select('student_id, balance').eq('account_number', acctNumber).maybeSingle()
      if (!wallet) return NextResponse.json({ ok: true })

      const newBalance = parseFloat(wallet.balance || '0') + amount
      await client.from('wallets').update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('student_id', wallet.student_id)

      const ref = data.reference || `psk_${Date.now()}`
      const { data: exists } = await client.from('wallet_transactions')
        .select('id').eq('reference', ref).maybeSingle()
      if (!exists) {
        await client.from('wallet_transactions').insert({
          student_id: wallet.student_id,
          type:       'credit',
          category:   'deposit',
          amount,
          fee:        0,
          reference:  ref,
          status:     'successful',
          narration:  `Wallet funded via Paystack`,
          created_at: new Date().toISOString(),
        })
      }
    }

    // ── Transfer success/failure ───────────────────────────────
    if (type === 'transfer.success' || type === 'transfer.failed' || type === 'transfer.reversed') {
      const data   = event.data
      const ref    = data.reference
      const status = type === 'transfer.success' ? 'successful' : 'failed'

      await client.from('wallet_transactions').update({ status }).eq('reference', ref)

      if (type !== 'transfer.success') {
        // Reverse deduction on failure
        const { data: txn } = await client.from('wallet_transactions')
          .select('student_id, amount, fee').eq('reference', ref).maybeSingle()
        if (txn) {
          const { data: w } = await client.from('wallets')
            .select('balance').eq('student_id', txn.student_id).maybeSingle()
          if (w) {
            await client.from('wallets').update({
              balance:    parseFloat(w.balance) + txn.amount + (txn.fee || 0),
              updated_at: new Date().toISOString(),
            }).eq('student_id', txn.student_id)
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const client = db()
    await client.from('api_errors').insert({ route: '/api/webhook/paystack', error: e.message, created_at: new Date().toISOString() }).catch(() => {})
    return NextResponse.json({ ok: true })
  }
}
