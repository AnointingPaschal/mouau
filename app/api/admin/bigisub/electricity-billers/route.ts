import { NextResponse } from 'next/server'
import { bigi, BIGI_ENDPOINTS } from '@/lib/bigisub'

// GET /api/v2/bills/electricity/providers/
// Response: { success, data: { providers: [...] } }
export async function GET() {
  try {
    const data = await bigi.get(BIGI_ENDPOINTS.electricityProviders)
    // data.data.providers is the array
    const billers = data?.data?.providers ?? data?.data ?? (Array.isArray(data) ? data : [])
    return NextResponse.json({ billers })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
