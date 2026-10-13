import { NextRequest, NextResponse } from 'next/server'
import { bigi, BIGI_ENDPOINTS } from '@/lib/bigisub'

// GET /api/admin/bigisub/cable-plans?cablename=DSTV
export async function GET(req: NextRequest) {
  try {
    const cablename = req.nextUrl.searchParams.get('cablename') || 'DSTV'
    const data = await bigi.get(`${BIGI_ENDPOINTS.cablePlans}?cablename=${cablename}`)
    const plans = Array.isArray(data) ? data : (data?.data ?? data?.plans ?? [])
    return NextResponse.json({ plans })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
