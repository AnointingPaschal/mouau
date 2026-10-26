import { NextResponse } from 'next/server'
import { paystackRequest } from '@/lib/paystack'

export async function GET() {
  try {
    const res = await paystackRequest('/balance')
    if (!res.status) return NextResponse.json({ ok: false, error: res.message || 'Invalid key' })
    return NextResponse.json({ ok: true, business: res.data?.[0]?.currency || 'Connected' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}
