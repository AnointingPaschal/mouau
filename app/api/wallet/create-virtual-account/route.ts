import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'
import { flw, flwRef } from '@/lib/flutterwave'

export async function POST(req: NextRequest) {
  try {
    const { studentId, email, studentName } = await req.json()
    if (!studentId || !email || !studentName)
      return NextResponse.json({ error: 'Missing studentId, email or studentName' }, { status: 400 })

    const adminDb = getAdminDb()
    const sid = studentId.toLowerCase().trim()

    // Check if already exists
    const { data: existing } = await adminDb
      .from('wallets')
      .select('*')
      .eq('student_id', sid)
      .maybeSingle()

    if (existing?.account_number)
      return NextResponse.json({ wallet: existing })

    // Create virtual account via Flutterwave
    const orderRef = flwRef('MOUAU')
    const nameParts = studentName.trim().split(' ')
    const payload = {
      email,
      is_permanent:  true,
      bvn:           '22222222222', // test BVN — production needs real BVN
      tx_ref:        orderRef,
      amount:        100,
      currency:      'NGN',
      narration:     `MOUAU PDM – ${studentName}`,
      firstname:     nameParts[0] || studentName,
      lastname:      nameParts.slice(1).join(' ') || 'Student',
      phonenumber:   '08000000000',
    }

    const result = await flw.post('/virtual-account-numbers', payload)

    if (result.status !== 'success') {
      return NextResponse.json({ error: result.message || 'Failed to create virtual account' }, { status: 400 })
    }

    const acct = result.data

    const { data: wallet, error } = await adminDb
      .from('wallets')
      .upsert({
        student_id:     sid,
        account_number: acct.account_number,
        bank_name:      acct.bank_name,
        account_name:   acct.account_name,
        flw_ref:        acct.flw_ref,
        order_ref:      orderRef,
        updated_at:     new Date().toISOString(),
      }, { onConflict: 'student_id' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ wallet })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
