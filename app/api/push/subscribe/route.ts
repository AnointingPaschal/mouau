import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { token, studentId } = await req.json()
    if (!token || !studentId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    await supabase.from('push_subscriptions').upsert(
      { student_id: studentId, fcm_token: token, updated_at: new Date().toISOString() },
      { onConflict: 'fcm_token' }
    )
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { token } = await req.json()
  await supabase.from('push_subscriptions').delete().eq('fcm_token', token)
  return NextResponse.json({ ok: true })
}
