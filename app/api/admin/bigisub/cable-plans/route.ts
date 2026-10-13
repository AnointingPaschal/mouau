import { NextRequest, NextResponse } from 'next/server'
import { getBigiToken, BIGISUB_BASE } from '@/lib/bigisub'

// GET /api/v2/vtu/cable/pricing/ — returns all providers with their plans grouped
// Response: { success, data: { providers: [{ provider, provider_code, plans: [{name, code, amount, duration, description}] }] } }
// We optionally filter by provider_code when ?cablename= is given
export async function GET(req: NextRequest) {
  try {
    const cablename = (req.nextUrl.searchParams.get('cablename') || '').toLowerCase()
    const token = await getBigiToken()
    const res = await fetch(`${BIGISUB_BASE}/api/v2/vtu/cable/pricing/`, {
      headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = json?.message || `HTTP ${res.status}`
      return NextResponse.json({ error: `Bigisub API error ${res.status}: ${msg}` }, { status: res.status })
    }
    const providers: any[] = json?.data?.providers ?? []
    if (cablename) {
      const found = providers.find(p => (p.provider_code || '').toLowerCase() === cablename)
      return NextResponse.json({ plans: found?.plans ?? [], provider: found?.provider ?? cablename })
    }
    // Return all providers with their plans
    return NextResponse.json({ providers })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
