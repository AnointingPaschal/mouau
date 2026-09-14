import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/admin'
import { supabase } from '@/lib/supabase'

const LANDING_KEYS = [
  'landing_badge','landing_title1','landing_title2','landing_description',
  'landing_stat1_value','landing_stat1_label',
  'landing_stat2_value','landing_stat2_label',
  'landing_stat3_value','landing_stat3_label',
  'landing_f1_title','landing_f1_desc','landing_f1_image',
  'landing_f2_title','landing_f2_desc','landing_f2_image',
  'landing_f3_title','landing_f3_desc','landing_f3_image',
  'landing_f4_title','landing_f4_desc','landing_f4_image',
  'landing_f5_title','landing_f5_desc','landing_f5_image',
  'landing_f6_title','landing_f6_desc','landing_f6_image',
]

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('app_settings').select('key,value').in('key', LANDING_KEYS)
  const settings: Record<string,string> = {}
  for (const row of data || []) settings[row.key] = row.value
  return NextResponse.json({ data: settings })
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const rows = Object.entries(body)
    .filter(([k]) => LANDING_KEYS.includes(k))
    .map(([key, value]) => ({ key, value: String(value), category: 'landing', label: key, is_secret: false }))
  if (rows.length) {
    await supabase.from('app_settings').upsert(rows, { onConflict: 'key' })
  }
  return NextResponse.json({ ok: true })
}
