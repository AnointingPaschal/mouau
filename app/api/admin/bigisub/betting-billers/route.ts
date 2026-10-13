import { NextResponse } from 'next/server'
import { bigi, BIGI_ENDPOINTS } from '@/lib/bigisub'

// GET /api/v2/betting/billers/
export async function GET() {
  try {
    const data = await bigi.get(BIGI_ENDPOINTS.bettingBillers)
    const billers = data?.data ?? (Array.isArray(data) ? data : [])
    return NextResponse.json({ billers })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
