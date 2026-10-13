import { NextRequest, NextResponse } from 'next/server'
import { bigi, NETWORK_IDS, BIGI_ENDPOINTS } from '@/lib/bigisub'

// GET /api/admin/bigisub/data-plans?network=MTN
export async function GET(req: NextRequest) {
  try {
    const network = req.nextUrl.searchParams.get('network') || 'MTN'
    const networkId = NETWORK_IDS[network.toUpperCase()] ?? 1
    // GET /api/v2/vtu/data/plans/?network=1
    const data = await bigi.get(`${BIGI_ENDPOINTS.dataBundles}?network=${networkId}`)
    // Response: array of plans or { data: [...] }
    const plans = Array.isArray(data) ? data : (data?.data ?? [])
    return NextResponse.json({ plans })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
