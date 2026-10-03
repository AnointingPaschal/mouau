import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'
import { getSettings } from '@/lib/settings'

export async function POST(req: NextRequest) {
  try {
    const s = await getSettings()
    const webhookHash = s.flw_webhook_hash || ''

    // Verify webhook signature
    const signature = req.headers.get('verif-hash')
    if (webhookHash && signature !== webhookHash) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = await req.json()
    const { event, data } = payload

    // Only handle successful charges (virtual account deposits)
    if (event === 'charge.completed' && data?.status === 'successful') {
      const accountNumber = data?.virtual_account_number || data?.meta?.virtual_account_number
      const amount        = parseFloat(data?.amount || 0)
      const flwRef        = data?.flw_ref || data?.id?.toString()

      if (!accountNumber || !amount) return NextResponse.json({ ok: true })

      const adminDb = getAdminDb()

      // Find wallet by account number
      const { data: wallet } = await adminDb
        .from('wallets')
        .select('student_id, balance')
        .eq('account_number', accountNumber)
        .maybeSingle()

      if (!wallet) return NextResponse.json({ ok: true })

      // Prevent double-crediting
      const { data: exists } = await adminDb
        .from('wallet_transactions')
        .select('id')
        .eq('flw_ref', flwRef)
        .maybeSingle()
      if (exists) return NextResponse.json({ ok: true })

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
        reference:  `DEP_${flwRef}`,
        flw_ref:    flwRef,
        status:     'success',
        narration:  data?.narration || 'Wallet deposit',
      })

      // Send in-app notification
      await adminDb.from('notifications').insert({
        recipient_id: wallet.student_id,
        type:         'info',
        title:        'Wallet Funded! 💰',
        body:         `₦${amount.toLocaleString()} has been added to your wallet.`,
        post_id:      '/wallet',
        actor:        'system',
        read:         false,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('FLW webhook error:', e)
    return NextResponse.json({ ok: true }) // Always return 200 to FLW
  }
}
