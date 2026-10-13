import { NextResponse } from 'next/server'
import { bigi, BIGI_ENDPOINTS } from '@/lib/bigisub'

// GET /api/admin/bigisub/balance — returns Bigisub wallet balance
export async function GET() {
  try {
    // GET /api/v2/user/wallet/
    const data = await bigi.get(BIGI_ENDPOINTS.wallet)
    // Response shape: { balance: "20.00", ... } or { data: { balance: "20.00" } }
    const balance = data?.balance ?? data?.data?.balance ?? data?.wallet_balance ?? data
    return NextResponse.json({ balance })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
