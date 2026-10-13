import { NextRequest, NextResponse } from 'next/server'
import { bigi, NETWORK_IDS } from '@/lib/bigisub'

// GET /api/admin/bigisub/data-plans?network=MTN
export async function GET(req: NextRequest) {
  try {
    const network = req.nextUrl.searchParams.get('network') || 'MTN'
    const networkId = NETWORK_IDS[network.toUpperCase()] ?? 1
    // GET /api/databundles/?network=<id>
    const data = await bigi.get(`/api/databundles/?network=${networkId}`)
    return NextResponse.json({ plans: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
