import { NextResponse } from 'next/server'
import { bigi } from '@/lib/bigisub'

// GET /api/admin/bigisub/balance — check Bigisub wallet balance
export async function GET() {
  try {
    const data = await bigi.get('/api/wallet/')
    return NextResponse.json({ balance: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
