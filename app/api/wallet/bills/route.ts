import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'
import { bigi, bigiRef, getBigiPin, BIGI_ENDPOINTS } from '@/lib/bigisub'
import { logApiError } from '@/lib/logError'

export async function POST(req: NextRequest) {
  try {
    const { studentId, category, customer, amount, billerCode, planCode, phone, quantity, meterType, narration } = await req.json()
    if (!studentId || !category || !customer)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const adminDb = getAdminDb()
    const sid = studentId.toLowerCase().trim()
    const amt = amount ? parseFloat(amount) : 0

    const { data: wallet } = await adminDb
      .from('wallets').select('balance').eq('student_id', sid).maybeSingle()
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    if (amt > 0 && parseFloat(wallet.balance) < amt)
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

    const reference = bigiRef('BILL')
    const pin = await getBigiPin()

    if (amt > 0) {
      await adminDb.from('wallets').update({
        balance: parseFloat(wallet.balance) - amt,
        updated_at: new Date().toISOString(),
      }).eq('student_id', sid)
    }

    let result: any
    let status: 'success' | 'failed' = 'failed'
    let finalAmt = amt

    try {
      if (category === 'cable') {
        // POST /api/v2/vtu/cabletv/purchase/
        result = await bigi.post(BIGI_ENDPOINTS.cablePurchase, {
          cablename:         billerCode,   // 1=DSTV, 2=GOTV, 3=STARTIMES
          smart_card_number: customer,
          type:              planCode,     // bouquet plan id
          pin,
        })
      } else if (category === 'electricity') {
        // POST /api/v2/vtu/electricity/purchase/
        result = await bigi.post(BIGI_ENDPOINTS.electricityBuy, {
          disco_name:   billerCode,
          meter_number: customer,
          amount:       amt,
          meter_type:   meterType || 'prepaid',
          phone:        phone || customer,
          pin,
        })
      } else if (category === 'betting') {
        // POST /api/v2/vtu/betting/fund/
        result = await bigi.post(BIGI_ENDPOINTS.bettingFund, {
          betting_name: billerCode,
          customer_id:  customer,
          amount:       amt,
          pin,
        })
      } else if (category === 'education') {
        // POST /api/v2/vtu/education/purchase/
        result = await bigi.post(BIGI_ENDPOINTS.educationBuy, {
          exam_name: billerCode,
          quantity:  quantity || 1,
          pin,
        })
        finalAmt = amt
      } else if (category === 'isp') {
        // POST /api/v2/vtu/isp/purchase/
        result = await bigi.post(BIGI_ENDPOINTS.ispBuy, {
          ServiceID: billerCode,
          plan:      planCode,
          phone:     customer,
          pin,
        })
      } else {
        return NextResponse.json({ error: `Unknown bill category: ${category}` }, { status: 400 })
      }

      const ok = result?.success === true
        || (result?.data?.status || '').toLowerCase().includes('success')
        || (result?.status || '').toLowerCase().includes('success')
      status = ok ? 'success' : 'failed'
    } catch (err: any) {
      result = { error: err.message }
      status = 'failed'
    }

    if (status === 'failed' && finalAmt > 0) {
      await adminDb.from('wallets').update({
        balance: parseFloat(wallet.balance),
        updated_at: new Date().toISOString(),
      }).eq('student_id', sid)
    }

    await adminDb.from('wallet_transactions').insert({
      student_id:        sid,
      type:              'debit',
      category,
      amount:            finalAmt,
      fee:               0,
      reference,
      flw_ref:           result?.data?.transaction_id || result?.data?.reference || null,
      status,
      narration:         narration || `${category} – ${customer}`,
      recipient_account: customer,
      metadata:          { billerCode, planCode },
    })

    if (status === 'failed') {
      const msg = result?.error || result?.message
        || (result?.errors ? JSON.stringify(result.errors) : null)
        || `${category} payment failed. Balance refunded.`
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    if (category === 'education' && result?.data?.pins) {
      return NextResponse.json({ ok: true, message: 'Education pin purchased successfully', pins: result.data.pins })
    }

    return NextResponse.json({ ok: true, message: `${category} payment successful` })
  } catch (e: any) {
    await logApiError({ route: '/api/wallet/bills', error: e })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
