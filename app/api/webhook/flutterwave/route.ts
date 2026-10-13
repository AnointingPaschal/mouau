import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'
import { logApiError } from '@/lib/logError'

// Always return 200 to Flutterwave — it will retry on any other status
const ok = () => NextResponse.json({ ok: true })

export async function POST(req: NextRequest) {
  let payload: any = {}
  try {
    payload = await req.json()
    const adminDb = getAdminDb()

    // ── Signature check (use service-role client to read unmasked secret) ──
    const signature  = req.headers.get('verif-hash') ?? ''
    const { data: hashRow } = await adminDb
      .from('app_settings')
      .select('value')
      .eq('key', 'flw_webhook_hash')
      .maybeSingle()
    const webhookHash = hashRow?.value ?? ''

    // If a hash is configured, enforce it. If none configured, allow all.
    if (webhookHash && signature !== webhookHash) {
      // Log mismatch for debugging but still return 200 so FLW doesn't retry forever
      await adminDb.from('api_error_logs').insert({
        route:   '/api/webhook/flutterwave',
        error:   `Signature mismatch — received: "${signature}", expected: "${webhookHash.slice(0,8)}…"`,
        payload: JSON.stringify(payload).slice(0, 500),
      }).catch(() => {})
      return ok()
    }

    const { event, data } = payload

    // ── Log every incoming webhook for debugging ──
    await adminDb.from('api_error_logs').insert({
      route:   '/api/webhook/flutterwave [debug]',
      error:   `event=${event} status=${data?.status} acct=${data?.account_number ?? data?.virtual_account_number ?? 'none'} amount=${data?.amount}`,
      payload: JSON.stringify(payload).slice(0, 1000),
    }).catch(() => {})

    // Only handle successful charges
    if (event !== 'charge.completed' || data?.status !== 'successful') return ok()

    // Flutterwave virtual account bank transfer payload:
    // data.account_number — the virtual account number the customer paid into
    // Also check data.virtual_account_number and data.meta.* as fallbacks
    const accountNumber = (
      data?.account_number ||
      data?.virtual_account_number ||
      data?.meta?.account_number ||
      data?.meta?.virtual_account_number ||
      ''
    ).toString().trim()

    const amount = parseFloat(data?.amount ?? 0)
    const flwRef = (data?.flw_ref || data?.id?.toString() || '').toString()

    if (!accountNumber || !amount) return ok()

    // Find wallet by account number
    const { data: wallet } = await adminDb
      .from('wallets')
      .select('student_id, balance')
      .eq('account_number', accountNumber)
      .maybeSingle()

    if (!wallet) {
      // Log unmatched account for debugging
      await adminDb.from('api_error_logs').insert({
        route:   '/api/webhook/flutterwave [no-wallet]',
        error:   `No wallet found for account_number="${accountNumber}"`,
        payload: JSON.stringify(payload).slice(0, 500),
      }).catch(() => {})
      return ok()
    }

    // Prevent double-crediting
    if (flwRef) {
      const { data: exists } = await adminDb
        .from('wallet_transactions')
        .select('id')
        .eq('flw_ref', flwRef)
        .maybeSingle()
      if (exists) return ok()
    }

    // Credit wallet
    await adminDb.from('wallets').update({
      balance:    parseFloat(wallet.balance) + amount,
      updated_at: new Date().toISOString(),
    }).eq('student_id', wallet.student_id)

    // Record transaction
    await adminDb.from('wallet_transactions').insert({
      student_id: wallet.student_id,
      type:       'credit',
      category:   'deposit',
      amount,
      fee:        0,
      reference:  `DEP_${flwRef || Date.now()}`,
      flw_ref:    flwRef || null,
      status:     'success',
      narration:  data?.narration || `Wallet deposit of ₦${amount.toLocaleString()}`,
    })

    // In-app notification
    await adminDb.from('notifications').insert({
      recipient_id: wallet.student_id,
      type:         'info',
      title:        'Wallet Funded! 💰',
      body:         `₦${amount.toLocaleString()} has been added to your wallet.`,
      post_id:      '/wallet',
      actor:        'system',
      read:         false,
    }).catch(() => {})

    return ok()
  } catch (e: any) {
    await logApiError({ route: '/api/webhook/flutterwave', error: e })
    return ok() // Always 200
  }
}
