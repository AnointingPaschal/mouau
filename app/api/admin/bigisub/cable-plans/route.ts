import { NextRequest, NextResponse } from 'next/server'
import { bigi, BIGI_ENDPOINTS } from '@/lib/bigisub'

// GET /api/v2/vtu/cable/plans/?cable_name=dstv
export async function GET(req: NextRequest) {
  try {
    const cablename = (req.nextUrl.searchParams.get('cablename') || 'dstv').toLowerCase()
    const data = await bigi.get(`${BIGI_ENDPOINTS.cablePlans}?cable_name=${cablename}`)
    const all: any[] = data?.data ?? (Array.isArray(data) ? data : [])
    // Also filter client-side in case the API ignores the param (mixed-case cable_name field)
    const plans = all.filter(p => (p.cable_name || '').toLowerCase() === cablename)
    return NextResponse.json({ plans: plans.length ? plans : all })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
