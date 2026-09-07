import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY  || 'BHCnIlIks2ps2aMp_ufHTOjkZrwiRd9hL6u23Z1jAnFcClD-wy-vXCgQxHnQDfxohnQyZVfRadvJL4mRkYVezgo'
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'ze6wll79-XpBHxXKNwmG5eRqCUCJ9J8qxszHIYt2GP4'
const VAPID_EMAIL   = process.env.VAPID_EMAIL || 'mailto:onespiritgate@gmail.com'

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)

export async function POST(req: NextRequest) {
  try {
    const { studentId, title, body, url } = await req.json()
    if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('student_id', studentId)

    if (!subs?.length) return NextResponse.json({ sent: 0 })

    const payload = JSON.stringify({ title, body, url: url || '/forum', tag: 'freshstart-' + Date.now() })
    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        }, payload)
      )
    )

    // Remove expired/invalid subscriptions
    const failed = results.map((r, i) => r.status === 'rejected' ? subs[i].endpoint : null).filter(Boolean)
    if (failed.length) {
      await supabase.from('push_subscriptions').delete().in('endpoint', failed as string[])
    }

    return NextResponse.json({ sent: results.filter(r => r.status === 'fulfilled').length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
