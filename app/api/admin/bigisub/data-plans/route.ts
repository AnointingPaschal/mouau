import { NextRequest, NextResponse } from 'next/server'
import { bigi, BIGI_ENDPOINTS } from '@/lib/bigisub'

// GET /api/admin/bigisub/data-plans?network=MTN
export async function GET(req: NextRequest) {
  try {
    const network = req.nextUrl.searchParams.get('network') || 'MTN'
    // GET /api/v2/vtu/data/plans/?network=MTN
    const data = await bigi.get(`${BIGI_ENDPOINTS.dataBundles}?network=${network}`)
    const plans = Array.isArray(data) ? data : (data?.data ?? data?.plans ?? [])
    return NextResponse.json({ plans })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
