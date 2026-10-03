import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'

export async function GET() {
  try {
    const { data } = await getAdminDb()
      .from('app_settings')
      .select('value')
      .eq('key', 'wallet_enabled')
      .maybeSingle()
    // Default to disabled if not yet set
    const enabled = data?.value === 'true'
    return NextResponse.json({ enabled })
  } catch {
    return NextResponse.json({ enabled: false })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { enabled } = await req.json()
    await getAdminDb()
      .from('app_settings')
      .upsert({ key: 'wallet_enabled', value: String(!!enabled), category: 'wallet' }, { onConflict: 'key' })
    return NextResponse.json({ ok: true, enabled: !!enabled })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
