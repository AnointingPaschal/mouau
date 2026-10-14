import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'
import { logApiError } from '@/lib/logError'

// Always return 200 to Flutterwave — any other status triggers retries
const ok = () => NextResponse.json({ ok: true })

async function safeLog(adminDb: any, route: string, error: string, payload?: string) {
  try {
    await adminDb.from('api_error_logs').insert({ route, error, payload: payload?.slice(0, 1000) ?? null })
  } catch (_) {}
}

export async function POST(req: NextRequest) {
  let payload: any = {}
  try {
    payload = await req.json()
    const adminDb = getAdminDb()

    // ── Signature check via service-role client (anon client masks secrets) ──
    const signature = req.headers.get('verif-hash') ?? ''
    const { data: hashRow } = await adminDb
      .from('app_settings').select('value').eq('key', 'flw_webhook_hash').maybeSingle()
    const webhookHash = hashRow?.value ?? ''

    if (webhookHash && signature !== webhookHash) {
      await safeLog(adminDb,
        '/api/webhook/flutterwave',
        `Signature mismatch — received: "${signature}", expected starts: "${webhookHash.slice(0,8)}…"`,
        JSON.stringify(payload),
      )
      return ok()
    }

    const { event, data } = payload

    // ── Debug log every incoming webhook ──
    await safeLog(adminDb,
      '/api/webhook/flutterwave [debug]',
      `event=${event} status=${data?.status} acct=${data?.account_number ?? data?.virtual_account_number ?? 'none'} amount=${data?.amount}`,
      JSON.stringify(payload),
    )

    if (event !== 'charge.completed' || data?.status !== 'successful') return ok()

    // FLW virtual account bank transfer — try all known field names
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
      .from('wallets').select('student_id, balance')
      .eq('account_number', accountNumber).maybeSingle()

    if (!wallet) {
      await safeLog(adminDb,
        '/api/webhook/flutterwave [no-wallet]',
        `No wallet for account_number="${accountNumber}"`,
        JSON.stringify(payload),
      )
      return ok()
    }

    // Prevent double-crediting
    if (flwRef) {
      const { data: exists } = await adminDb
        .from('wallet_transactions').select('id').eq('flw_ref', flwRef).maybeSingle()
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

    // In-app notification (best-effort)
    try {
      await adminDb.from('notifications').insert({
        recipient_id: wallet.student_id,
        type:         'info',
        title:        'Wallet Funded! 💰',
        body:         `₦${amount.toLocaleString()} has been added to your wallet.`,
        post_id:      '/wallet',
        actor:        'system',
        read:         false,
      })
    } catch (_) {}

    return ok()
  } catch (e: any) {
    await logApiError({ route: '/api/webhook/flutterwave', error: e })
    return ok()
  }
}
