import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Records that a student has the PWA installed.
 * Uses a sentinel token 'pwa:{studentId}' in push_subscriptions so we
 * can track installs without requiring notification permission.
 *
 * Real FCM tokens are stored separately and handled by /api/push/subscribe.
 * Sentinel tokens are filtered out before any FCM multicast send.
 */
export async function POST(req: NextRequest) {
  try {
    const { studentId } = await req.json()
    if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

    const sentinel = `pwa:${String(studentId).trim()}`

    await supabase.from('push_subscriptions').upsert(
      {
        student_id: String(studentId).trim(),
        fcm_token:  sentinel,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'fcm_token' }
    )

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
