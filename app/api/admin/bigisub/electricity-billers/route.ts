import { NextResponse } from 'next/server'
import { bigi } from '@/lib/bigisub'

// GET /api/admin/bigisub/electricity-billers
export async function GET() {
  try {
    const data = await bigi.get('/api/electricity/')
    return NextResponse.json({ billers: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
