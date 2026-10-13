import { NextRequest, NextResponse } from 'next/server'
import { bigi, BIGI_ENDPOINTS } from '@/lib/bigisub'

// GET /api/admin/bigisub/cable-plans?cablename=dstv
// v2 returns ALL plans in one call; we filter by cable_name client-side
// cable_name values in the API: dstv/DSTV, gotv/GOTV, startimes/STARTIMES, showmax/SHOWMAX
export async function GET(req: NextRequest) {
  try {
    const cablename = (req.nextUrl.searchParams.get('cablename') || 'dstv').toLowerCase()
    const data = await bigi.get(BIGI_ENDPOINTS.cablePlans)
    const all: any[] = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
    // Filter case-insensitively
    const plans = all.filter(p => (p.cable_name || '').toLowerCase() === cablename)
    return NextResponse.json({ plans })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
