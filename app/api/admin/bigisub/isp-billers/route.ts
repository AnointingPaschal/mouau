import { NextResponse } from 'next/server'
import { bigi, BIGI_ENDPOINTS } from '@/lib/bigisub'

// Returns Smile + Spectranet plans from separate endpoints
export async function GET() {
  try {
    const [smileData, spectranetData] = await Promise.allSettled([
      bigi.get(BIGI_ENDPOINTS.smilePlans),
      bigi.get(BIGI_ENDPOINTS.spectranetPlans),
    ])
    const smile     = smileData.status === 'fulfilled'     ? (smileData.value?.data     ?? []) : []
    const spectranet = spectranetData.status === 'fulfilled' ? (spectranetData.value?.data ?? []) : []
    return NextResponse.json({
      billers: [
        { provider: 'Smile',      id: 'smile',      plans: smile },
        { provider: 'Spectranet', id: 'spectranet', plans: spectranet },
      ]
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
