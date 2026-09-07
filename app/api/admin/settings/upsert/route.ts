import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { clearSettingsCache } from '@/lib/settings'

export async function POST(req: NextRequest) {
  const { key, value, category, label, description } = await req.json()
  await supabase.from('app_settings').upsert(
    { key, value, category: category||'general', label: label||key, description: description||'', is_secret: false, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
  clearSettingsCache()
  return NextResponse.json({ ok: true })
}
