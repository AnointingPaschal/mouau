import { NextRequest, NextResponse } from 'next/server'
import { bigi, BIGI_ENDPOINTS, NETWORK_IDS } from '@/lib/bigisub'

// GET /api/admin/bigisub/data-plans?network=MTN
// Bigisub v2 requires numeric network ID: 1=MTN 2=GLO 3=AIRTEL 4=9MOBILE
export async function GET(req: NextRequest) {
  try {
    const net = (req.nextUrl.searchParams.get('network') || 'MTN').toUpperCase()
    const networkId = NETWORK_IDS[net] ?? 1
    const data = await bigi.get(`${BIGI_ENDPOINTS.dataPlans}?network=${networkId}`)
    const plans = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
    return NextResponse.json({ plans })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
