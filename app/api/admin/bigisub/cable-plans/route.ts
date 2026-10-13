import { NextRequest, NextResponse } from 'next/server'
import { bigi } from '@/lib/bigisub'

// GET /api/admin/bigisub/cable-plans?cablename=1
// Lists bouquets for a cable provider (1=DSTV, 2=GOTV, 3=STARTIMES)
export async function GET(req: NextRequest) {
  try {
    const cablename = req.nextUrl.searchParams.get('cablename') || '1'
    // GET /api/cabletv/?cablename=1  → list plans
    const data = await bigi.get(`/api/cabletv/?cablename=${cablename}`)
    return NextResponse.json({ plans: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
