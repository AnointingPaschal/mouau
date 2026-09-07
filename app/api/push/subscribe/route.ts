import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { subscription, studentId } = await req.json()
    if (!subscription?.endpoint || !studentId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    await supabase.from('push_subscriptions').upsert({
      student_id: studentId,
      endpoint:   subscription.endpoint,
      p256dh:     subscription.keys.p256dh,
      auth:       subscription.keys.auth,
    }, { onConflict: 'endpoint' })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json()
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  return NextResponse.json({ ok: true })
}
