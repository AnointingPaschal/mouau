import { NextResponse } from 'next/server'
import { bigi, BIGI_ENDPOINTS } from '@/lib/bigisub'

export async function GET() {
  try {
    const data = await bigi.get(BIGI_ENDPOINTS.electricityList)
    const billers = Array.isArray(data) ? data : (data?.data ?? [])
    return NextResponse.json({ billers })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
