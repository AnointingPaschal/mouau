import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { clearSettingsCache } from '@/lib/settings'

export async function GET() {
  const { data } = await supabase.from('app_settings').select('*').order('category').order('key')
  // Mask secret values in GET response
  const masked = (data || []).map((r: any) => ({
    ...r,
    value: r.is_secret && r.value ? '••••••••' : r.value,
    has_value: !!r.value,
  }))
  return NextResponse.json({ data: masked })
}

export async function PUT(req: NextRequest) {
  const { key, value } = await req.json()
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  // Don't overwrite if sending masked value
  if (value === '••••••••') return NextResponse.json({ ok: true })
  await supabase.from('app_settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)
  clearSettingsCache()
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  // Bulk update
  const { settings } = await req.json()
  for (const [key, value] of Object.entries(settings as Record<string,string>)) {
    if (value === '••••••••') continue
    await supabase.from('app_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)
  }
  clearSettingsCache()
  return NextResponse.json({ ok: true })
}
