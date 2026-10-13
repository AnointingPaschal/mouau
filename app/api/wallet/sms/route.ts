import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'
import { bigi, bigiRef, bigiSuccess, BIGI_ENDPOINTS } from '@/lib/bigisub'
import { logApiError } from '@/lib/logError'

// POST /api/wallet/sms
// Body: { studentId, message, recipients (comma-separated or array), sender_id, amount }
export async function POST(req: NextRequest) {
  try {
    const { studentId, message, recipients, senderId, amount } = await req.json()
    if (!studentId || !message || !recipients)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const adminDb = getAdminDb()
    const sid = studentId.toLowerCase().trim()
    const amt = parseFloat(amount || '0')

    // Normalise recipients
    const recipientList = Array.isArray(recipients)
      ? recipients
      : recipients.split(/[\n,;]+/).map((r: string) => r.trim()).filter(Boolean)

    if (recipientList.length === 0)
      return NextResponse.json({ error: 'No valid recipients' }, { status: 400 })
    if (recipientList.length > 500)
      return NextResponse.json({ error: 'Maximum 500 recipients per send' }, { status: 400 })

    const { data: wallet } = await adminDb
      .from('wallets').select('balance').eq('student_id', sid).maybeSingle()
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    if (amt > 0 && parseFloat(wallet.balance) < amt)
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

    const reference = bigiRef('SMS')

    if (amt > 0) {
      await adminDb.from('wallets').update({
        balance: parseFloat(wallet.balance) - amt,
        updated_at: new Date().toISOString(),
      }).eq('student_id', sid)
    }

    // POST /api/v2/communications/sms/send/
    let result: any
    let status: 'success' | 'failed' = 'failed'
    try {
      result = await bigi.post(BIGI_ENDPOINTS.smsSend, {
        message,
        recipients: recipientList,
        sender_id:  senderId || 'PDM MOUAU',
      })
      status = bigiSuccess(result) ? 'success' : 'failed'
    } catch (err: any) {
      result = { error: err.message }
      status = 'failed'
    }

    if (status === 'failed' && amt > 0) {
      await adminDb.from('wallets').update({
        balance: parseFloat(wallet.balance),
        updated_at: new Date().toISOString(),
      }).eq('student_id', sid)
    }

    await adminDb.from('wallet_transactions').insert({
      student_id: sid,
      type:       'debit',
      category:   'sms',
      amount:     amt,
      fee:        0,
      reference,
      flw_ref:    result?.data?.job_id || null,
      status,
      narration:  `Bulk SMS – ${recipientList.length} recipients`,
      metadata:   { recipients: recipientList.length, senderId },
    })

    if (status === 'failed') {
      const msg = result?.error || result?.message
        || (result?.errors ? JSON.stringify(result.errors) : null)
        || 'SMS send failed. Balance refunded.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      message: `SMS sent to ${recipientList.length} recipient${recipientList.length > 1 ? 's' : ''}`,
      job_id: result?.data?.job_id ?? null,
    })
  } catch (e: any) {
    await logApiError({ route: '/api/wallet/sms', error: e })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
