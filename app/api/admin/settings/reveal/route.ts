import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  const { data } = await supabase.from('app_settings').select('value').eq('key', key).single()
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ value: data.value })
}
