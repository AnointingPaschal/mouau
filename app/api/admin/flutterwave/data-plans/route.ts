import { NextRequest, NextResponse } from 'next/server'
import { flw } from '@/lib/flutterwave'

export async function GET(req: NextRequest) {
  try {
    const network = req.nextUrl.searchParams.get('network') || 'MTN'

    // Map network names to FLW biller codes
    const NETWORK_MAP: Record<string, string> = {
      MTN:     'MTN-DATABUNDLE',
      GLO:     'GLO-DATABUNDLE',
      AIRTEL:  'AIRTEL-DATABUNDLE',
      '9MOBILE': '9MOBILE-DATABUNDLE',
    }

    const billerCode = NETWORK_MAP[network.toUpperCase()] || `${network.toUpperCase()}-DATABUNDLE`
    const result = await flw.get(`/bill-categories?billing_type=data&biller_code=${billerCode}`)

    if (result.status !== 'success')
      return NextResponse.json({ error: result.message }, { status: 400 })

    return NextResponse.json({ plans: result.data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
