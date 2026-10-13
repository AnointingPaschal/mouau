import { NextResponse } from 'next/server'
import { bigi, BIGI_ENDPOINTS } from '@/lib/bigisub'

// GET /api/v2/vtu/recharge-pin/plans/
// Response: { success, data: [{id, network, network_name, size, regular_price, corporate_price, info}] }
export async function GET() {
  try {
    const data = await bigi.get(BIGI_ENDPOINTS.rechargePinPlans)
    const plans = data?.data ?? (Array.isArray(data) ? data : [])
    return NextResponse.json({ plans })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
