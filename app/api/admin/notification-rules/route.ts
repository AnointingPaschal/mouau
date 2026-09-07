import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase.from('notification_rules').select('*').order('event_type')
  return NextResponse.json({ data })
}

export async function PUT(req: NextRequest) {
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await supabase.from('notification_rules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  return NextResponse.json({ ok: true })
}
