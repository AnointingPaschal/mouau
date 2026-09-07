import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSettings } from '@/lib/settings'

// Persistent across warm lambda invocations
declare global { var __fbMessaging: any; var __fbProjectId: string }

async function getMessaging() {
  const s = await getSettings()
  const projectId   = (s.firebase_admin_project_id   || '').trim()
  const clientEmail = (s.firebase_admin_client_email  || '').trim()
  const privateKey  = (s.firebase_admin_private_key   || '').trim().replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials not set. Go to Admin → Notification Settings and save your Firebase Admin SDK credentials.')
  }

  // Only re-init when project changes
  if (global.__fbMessaging && global.__fbProjectId === projectId) {
    return global.__fbMessaging
  }

  // Dynamically import firebase-admin (avoids Edge Runtime issues)
  const { initializeApp, getApps, cert } = await import('firebase-admin/app')
  const { getMessaging }                  = await import('firebase-admin/messaging')

  if (!getApps().length) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  }

  global.__fbMessaging = getMessaging()
  global.__fbProjectId = projectId
  return global.__fbMessaging
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { studentId, title, body: msgBody, url, testMode } = body

    if (testMode) {
      // Just verify credentials are present and SDK loads
      await getMessaging()
      return NextResponse.json({ ok: true, message: 'Firebase Admin SDK initialized successfully!' })
    }

    if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

    const { data: subs } = await supabase
      .from('push_subscriptions').select('fcm_token').eq('student_id', studentId)

    if (!subs?.length) return NextResponse.json({ sent: 0, message: 'No devices registered' })

    const messaging = await getMessaging()
    const tokens: string[] = subs.map((s: any) => s.fcm_token)

    const result = await messaging.sendEachForMulticast({
      notification: { title: title || 'MOUAU FreshStart', body: msgBody || '' },
      data:         { url: url || '/dashboard' },
      android:      { priority: 'high', notification: { color: '#1a6b3a', sound: 'default' } },
      webpush:      {
        fcmOptions:   { link: `https://mouau-rose.vercel.app${url || '/dashboard'}` },
        notification: { icon: '/icon-192.png' },
      },
      tokens,
    })

    // Clean up invalid tokens
    const bad = result.responses
      .map((r: any, i: number) => ({ r, token: tokens[i] }))
      .filter(({ r }: any) => !r.success && (r.error?.code || '').match(/invalid-registration|not-registered/))
      .map(({ token }: any) => token)

    if (bad.length) await supabase.from('push_subscriptions').delete().in('fcm_token', bad)

    return NextResponse.json({ sent: result.successCount, failed: result.failureCount })
  } catch (e: any) {
    console.error('FCM error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
