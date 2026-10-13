import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'
import { bigi, bigiRef, bigiSuccess, BIGI_ENDPOINTS } from '@/lib/bigisub'
import { logApiError } from '@/lib/logError'

export async function POST(req: NextRequest) {
  try {
    const {
      studentId, category, customer, amount,
      billerCode, planCode, phone, quantity, meterType, narration,
      customerName, customerAddress,
    } = await req.json()

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

    if (amt > 0) {
      await adminDb.from('wallets').update({
        balance: parseFloat(wallet.balance) - amt,
        updated_at: new Date().toISOString(),
      }).eq('student_id', sid)
    }

    let result: any
    let status: 'success' | 'failed' = 'failed'

    try {
      if (category === 'cable') {
        // POST /api/v2/vtu/cabletv/subscribe/
        // Fields from legacy (verified working): card_no, cable_type (dstv/gotv/startimes), amount, phone_number, Customer
        result = await bigi.post(BIGI_ENDPOINTS.cablePurchase, {
          card_no:       customer,
          cable_type:    billerCode,   // e.g. "dstv", "gotv", "startimes"
          amount:        String(amt),
          phone_number:  phone || customer,
          Customer:      customerName || 'Customer',
        })
      } else if (category === 'electricity') {
        // POST /api/v2/electricity/purchase
        // Fields: company (disco), meter_no, meter_type, phone_number, amount, Customer_name, Customer_address
        result = await bigi.post(BIGI_ENDPOINTS.electricityBuy, {
          company:          billerCode,   // e.g. "ikeja-electric"
          meter_no:         customer,
          meter_type:       meterType || 'prepaid',
          phone_number:     phone || '',
          amount:           String(amt),
          Customer_name:    customerName || 'Customer',
          Customer_address: customerAddress || '',
        })
      } else if (category === 'betting') {
        // POST /api/v2/betting/fund
        result = await bigi.post(BIGI_ENDPOINTS.bettingFund, {
          betting_name: billerCode,
          customer_id:  customer,
          amount:       amt,
        })
      } else if (category === 'education') {
        // POST /api/v2/education/purchase
        result = await bigi.post(BIGI_ENDPOINTS.educationBuy, {
          exam:     billerCode,
          quantity: quantity || 1,
        })
      } else if (category === 'isp') {
        // POST /api/v2/vtu/isp/purchase/
        result = await bigi.post(BIGI_ENDPOINTS.ispBuy, {
          ServiceID: billerCode,
          plan:      planCode,
          phone:     customer,
        })
      } else {
        return NextResponse.json({ error: `Unknown bill category: ${category}` }, { status: 400 })
      }

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
      student_id:        sid,
      type:              'debit',
      category,
      amount:            amt,
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

    // Return token/PIN for electricity and education
    const extra: any = {}
    if (category === 'electricity' && result?.data?.token) extra.token = result.data.token
    if (category === 'education' && result?.data?.pins)    extra.pins  = result.data.pins
    if (category === 'education' && result?.data?.pin)     extra.pin   = result.data.pin

    return NextResponse.json({ ok: true, message: `${category} payment successful`, ...extra })
  } catch (e: any) {
    await logApiError({ route: '/api/wallet/bills', error: e })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
