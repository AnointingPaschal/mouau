import { NextResponse } from 'next/server'
import { bigi, BIGI_ENDPOINTS } from '@/lib/bigisub'

// GET /api/v2/communications/sms/pricing/
// Response: { success, data: { cost_per_page, normal_chars_per_page, unicode_chars_per_page } }
export async function GET() {
  try {
    const data = await bigi.get(BIGI_ENDPOINTS.smsPricing)
    return NextResponse.json({ pricing: data?.data ?? data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
