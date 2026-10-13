import { NextRequest, NextResponse } from 'next/server'
import { bigi, BIGI_ENDPOINTS } from '@/lib/bigisub'

// GET /api/admin/bigisub/cable-plans?cablename=1
// 1=DSTV, 2=GOTV, 3=STARTIMES
export async function GET(req: NextRequest) {
  try {
    const cablename = req.nextUrl.searchParams.get('cablename') || '1'
    const data = await bigi.get(`${BIGI_ENDPOINTS.cablePlans}?cablename=${cablename}`)
    const plans = Array.isArray(data) ? data : (data?.data ?? [])
    return NextResponse.json({ plans })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
