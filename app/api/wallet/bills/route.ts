import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'
import { bigi, bigiRef } from '@/lib/bigisub'
import { logApiError } from '@/lib/logError'

// category → Bigisub endpoint mapping
// cable: /api/cabletv/   { cablename, smart_card_number, type }
// electricity: /api/electricity/  { disco_name, meter_number, amount, meter_type, phone }
// betting: /api/betting/  { betting_name, customer_id, amount }
// education: /api/education/  { exam_name, quantity }
// isp: /api/internetservice/  { ServiceID, plan, phone }

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

    // Only deduct if there's an amount (education uses quantity * unit price, handled server-side by Bigisub)
    if (amt > 0) {
      await adminDb.from('wallets').update({
        balance:    parseFloat(wallet.balance) - amt,
        updated_at: new Date().toISOString(),
      }).eq('student_id', sid)
    }

    let result: any
    let status: 'success' | 'failed' = 'failed'
    let finalAmt = amt

    try {
      if (category === 'cable') {
        // POST /api/cabletv/ { cablename, smart_card_number, type }
        result = await bigi.post('/api/cabletv/', {
          cablename:          billerCode,      // e.g. 1=DSTV, 2=GOTV, 3=STARTIMES
          smart_card_number:  customer,
          type:               planCode,        // bouquet/plan id
        })
      } else if (category === 'electricity') {
        // POST /api/electricity/ { disco_name, meter_number, amount, meter_type, phone }
        result = await bigi.post('/api/electricity/', {
          disco_name:    billerCode,       // e.g. 1=IKEDC, 2=AEDC...
          meter_number:  customer,
          amount:        amt,
          meter_type:    meterType || 'prepaid',
          phone:         phone || customer,
        })
      } else if (category === 'betting') {
        // POST /api/betting/ { betting_name, customer_id, amount }
        result = await bigi.post('/api/betting/', {
          betting_name: billerCode,       // e.g. 1=Bet9ja
          customer_id:  customer,
          amount:       amt,
        })
      } else if (category === 'education') {
        // POST /api/education/ { exam_name, quantity }
        // Price is per-pin, deduct based on unit price * quantity
        result = await bigi.post('/api/education/', {
          exam_name: billerCode,           // e.g. 1=WAEC, 2=NECO
          quantity:  quantity || 1,
        })
        finalAmt = amt   // passed from frontend after confirming unit price
      } else if (category === 'isp') {
        // POST /api/internetservice/ { ServiceID, plan, phone }
        result = await bigi.post('/api/internetservice/', {
          ServiceID: billerCode,
          plan:      planCode,
          phone:     customer,
        })
      } else {
        return NextResponse.json({ error: `Unknown bill category: ${category}` }, { status: 400 })
      }

      const s = (result?.Status || result?.status || '').toLowerCase()
      status = s.includes('success') || s.includes('successful') ? 'success' : 'failed'
    } catch (err: any) {
      result = { error: err.message }
      status = 'failed'
    }

    // Refund on failure
    if (status === 'failed' && finalAmt > 0) {
      await adminDb.from('wallets').update({
        balance:    parseFloat(wallet.balance),
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
      flw_ref:           result?.id?.toString() || result?.transaction_id?.toString() || null,
      status,
      narration:         narration || `${category} – ${customer}`,
      recipient_account: customer,
      metadata:          { billerCode, planCode },
    })

    if (status === 'failed') {
      const msg = result?.error || result?.message || result?.errors || `${category} payment failed. Balance refunded.`
      return NextResponse.json({ error: typeof msg === 'string' ? msg : JSON.stringify(msg) }, { status: 400 })
    }

    // For education, return the pins if available
    if (category === 'education' && result?.pins) {
      return NextResponse.json({ ok: true, message: `${category} payment successful`, pins: result.pins })
    }

    return NextResponse.json({ ok: true, message: `${category} payment successful` })
  } catch (e: any) {
    await logApiError({ route: '/api/wallet/bills', error: e })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
