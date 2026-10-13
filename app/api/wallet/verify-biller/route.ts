import { NextRequest, NextResponse } from 'next/server'
import { bigi, BIGI_ENDPOINTS } from '@/lib/bigisub'

// POST /api/wallet/verify-biller
// category: 'cable' | 'electricity' | 'betting'
// Returns customer name / account info before purchase
export async function POST(req: NextRequest) {
  try {
    const { category, billerCode, customer, meterType } = await req.json()
    if (!category || !customer || !billerCode)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    let result: any

    if (category === 'cable') {
      // POST /api/v2/vtu/cable/verify/
      // Fields confirmed by live API: card_no, cable_name
      result = await bigi.post(BIGI_ENDPOINTS.cableVerify, {
        card_no:    customer,
        cable_name: billerCode,   // e.g. "dstv", "gotv", "startimes"
      })
    } else if (category === 'electricity') {
      // POST /api/v2/bills/electricity/verify/
      // Fields confirmed by live API: company, meter_no, meter_type
      result = await bigi.post(BIGI_ENDPOINTS.electricityVerify, {
        company:    billerCode,   // e.g. "eko-electric"
        meter_no:   customer,
        meter_type: meterType || 'prepaid',
      })
    } else if (category === 'betting') {
      // POST /api/v2/betting/validate/
      result = await bigi.post(BIGI_ENDPOINTS.bettingValidate, {
        biller_code: billerCode,  // e.g. "biller-bet9ja"
        customer_id: customer,
      })
    } else {
      return NextResponse.json({ error: `No verification for ${category}` }, { status: 400 })
    }

    // Extract customer name from various response shapes
    const data = result?.data ?? result
    const customerName =
      data?.Customer_Name ?? data?.customer_name ?? data?.name ??
      data?.full_name ?? data?.account_name ?? data?.customer ?? null

    const extra: any = {}
    if (data?.Current_Bouquet) extra.currentBouquet = data.Current_Bouquet
    if (data?.address)         extra.address = data.address
    if (data?.valid !== undefined) extra.valid = data.valid

    if (!customerName && !extra.valid) {
      return NextResponse.json({ error: result?.message || 'Verification failed' }, { status: 400 })
    }

    return NextResponse.json({ customerName, ...extra, raw: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
