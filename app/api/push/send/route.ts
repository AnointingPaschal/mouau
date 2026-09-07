import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Lazy-init firebase-admin to avoid SSR issues
let messaging: any = null

async function getMessaging() {
  if (messaging) return messaging
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const admin = require('firebase-admin')
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey:  (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    })
  }
  messaging = admin.messaging()
  return messaging
}

export async function POST(req: NextRequest) {
  try {
    const { studentId, title, body, url } = await req.json()
    if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('fcm_token')
      .eq('student_id', studentId)

    if (!subs?.length) return NextResponse.json({ sent: 0 })

    const msg = await getMessaging()
    const tokens: string[] = subs.map((s: any) => s.fcm_token)

    const result = await msg.sendEachForMulticast({
      notification: { title: title || 'MOUAU FreshStart', body: body || '' },
      data:         { url: url || '/dashboard' },
      android: {
        priority: 'high',
        notification: { color: '#1a6b3a', sound: 'default', channelId: 'freshstart_default' },
      },
      webpush: {
        fcmOptions:   { link: `https://mouau-rose.vercel.app${url || '/dashboard'}` },
        notification: { icon: '/icon-192.png', badge: '/icon-192.png' },
      },
      tokens,
    })

    // Remove invalid/expired tokens
    const bad: string[] = []
    result.responses.forEach((r: any, i: number) => {
      const code = r.error?.code || ''
      if (!r.success && (code.includes('invalid-registration') || code.includes('not-registered'))) {
        bad.push(tokens[i])
      }
    })
    if (bad.length) await supabase.from('push_subscriptions').delete().in('fcm_token', bad)

    return NextResponse.json({ sent: result.successCount, failed: result.failureCount })
  } catch (e: any) {
    console.error('FCM send error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
