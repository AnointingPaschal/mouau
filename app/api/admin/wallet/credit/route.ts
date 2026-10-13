import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'

// POST /api/admin/wallet/credit
// Body: { studentId, amount, narration }
// Admin-only manual credit (no auth check needed beyond being in the admin UI)
export async function POST(req: NextRequest) {
  try {
    const { studentId, amount, narration } = await req.json()
    if (!studentId || !amount) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

    const adminDb = getAdminDb()
    const sid = studentId.toString().toLowerCase().trim()

    const { data: wallet } = await adminDb
      .from('wallets').select('student_id, balance').eq('student_id', sid).maybeSingle()
    if (!wallet) return NextResponse.json({ error: 'Wallet not found for this student' }, { status: 404 })

    const newBalance = parseFloat(wallet.balance) + amt
    await adminDb.from('wallets').update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('student_id', sid)

    await adminDb.from('wallet_transactions').insert({
      student_id: sid,
      type:       'credit',
      category:   'deposit',
      amount:     amt,
      fee:        0,
      reference:  `MANUAL_${Date.now()}`,
      flw_ref:    null,
      status:     'success',
      narration:  narration || 'Manual credit by admin',
    })

    await adminDb.from('notifications').insert({
      recipient_id: sid,
      type:         'info',
      title:        'Wallet Credited 💰',
      body:         `₦${amt.toLocaleString()} has been added to your wallet by admin.`,
      post_id:      '/wallet',
      actor:        'system',
      read:         false,
    }).catch(() => {})

    return NextResponse.json({ ok: true, newBalance })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
