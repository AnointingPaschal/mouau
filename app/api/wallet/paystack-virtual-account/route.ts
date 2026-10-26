import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { paystackRequest, paystackRef } from '@/lib/paystack'
import { logApiError } from '@/lib/logError'

function db() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const { studentId, studentName, email, phone } = await req.json()
    if (!studentId || !studentName || !email)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const client = db()
    const sid = studentId.toLowerCase().trim()

    // Return existing account if already created
    const { data: existing } = await client.from('wallets').select('*').eq('student_id', sid).maybeSingle()
    if (existing?.account_number) return NextResponse.json({ wallet: existing })

    // Step 1: create/get customer on Paystack
    const custRes = await paystackRequest('/customer', 'POST', {
      email,
      first_name: studentName.split(' ')[0],
      last_name:  studentName.split(' ').slice(1).join(' ') || 'Student',
      phone:      phone || '+234800000000',
    })

    const customerCode = custRes.data?.customer_code
    if (!customerCode) {
      await logApiError({ route: '/api/wallet/paystack-virtual-account', error: custRes, studentId })
      return NextResponse.json({ error: custRes.message || 'Failed to create Paystack customer' }, { status: 400 })
    }

    // Step 2: create dedicated virtual account (DVA)
    const dvaRes = await paystackRequest('/dedicated_account', 'POST', {
      customer:         customerCode,
      preferred_bank:   'wema-bank',   // Paystack DVA bank — change to 'test-bank' on test mode
    })

    if (!dvaRes.status || !dvaRes.data?.account_number) {
      // fallback: fetch existing DVA if already assigned
      const fetchRes = await paystackRequest(`/dedicated_account?customer=${customerCode}`)
      const dva = fetchRes.data?.[0]
      if (!dva?.account_number) {
        await logApiError({ route: '/api/wallet/paystack-virtual-account', error: dvaRes, studentId })
        return NextResponse.json({ error: dvaRes.message || 'Failed to create virtual account' }, { status: 400 })
      }
      dvaRes.data = dva
    }

    const acct = dvaRes.data

    const { data: wallet, error } = await client.from('wallets').upsert({
      student_id:        sid,
      account_number:    acct.account_number,
      bank_name:         acct.bank?.name || 'Wema Bank',
      account_name:      acct.account_name || studentName,
      paystack_customer: customerCode,
      provider:          'paystack',
      updated_at:        new Date().toISOString(),
    }, { onConflict: 'student_id' }).select().single()

    if (error) {
      await logApiError({ route: '/api/wallet/paystack-virtual-account', error, studentId })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ wallet })
  } catch (e: any) {
    await logApiError({ route: '/api/wallet/paystack-virtual-account', error: e })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
