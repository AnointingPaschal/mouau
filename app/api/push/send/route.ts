import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSettings } from '@/lib/settings'

declare global { var __fbMessaging: any; var __fbProjectId: string }

async function getMessaging() {
  const s = await getSettings()
  const projectId   = (s.firebase_admin_project_id  || '').trim()
  const clientEmail = (s.firebase_admin_client_email || '').trim()
  const privateKey  = (s.firebase_admin_private_key  || '').trim().replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials not configured. Go to Admin → Notification Settings.')
  }

  if (global.__fbMessaging && global.__fbProjectId === projectId) return global.__fbMessaging

  const { initializeApp, getApps, cert } = await import('firebase-admin/app')
  const { getMessaging }                  = await import('firebase-admin/messaging')
  if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })

  global.__fbMessaging  = getMessaging()
  global.__fbProjectId  = projectId
  return global.__fbMessaging
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { studentId, title, body: msgBody, url, testMode, icon } = body

    const s = await getSettings()
    const appName = s.site_name || 'MOUAU FreshStart'
    const appIcon = s.logo_url  || '/icon-192.png'
    const appUrl  = 'https://mouau-rose.vercel.app'

    if (testMode) {
      await getMessaging()
      return NextResponse.json({ ok: true, message: 'Firebase Admin SDK initialized successfully!' })
    }

    if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

    const { data: subs } = await supabase
      .from('push_subscriptions').select('fcm_token').eq('student_id', studentId)
    if (!subs?.length) return NextResponse.json({ sent: 0, message: 'No devices registered for this student' })

    const messaging = await getMessaging()
    const tokens: string[] = subs.map((s: any) => s.fcm_token)

    const result = await messaging.sendEachForMulticast({
      notification: {
        title: title || appName,
        body:  msgBody || '',
        imageUrl: icon || (appIcon.startsWith('http') ? appIcon : `${appUrl}${appIcon}`),
      },
      data: { url: url || '/dashboard' },
      android: {
        priority: 'high',
        notification: {
          color: '#1a6b3a',
          sound: 'default',
          channelId: 'freshstart_default',
          icon: 'ic_notification',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      webpush: {
        fcmOptions:   { link: `${appUrl}${url || '/dashboard'}` },
        notification: {
          icon:  appIcon.startsWith('http') ? appIcon : `${appUrl}${appIcon}`,
          badge: `${appUrl}/icon-192.png`,
          vibrate: [200, 100, 200],
        },
      },
      tokens,
    })

    const bad = result.responses
      .map((r: any, i: number) => ({ r, t: tokens[i] }))
      .filter(({ r }: any) => !r.success && (r.error?.code || '').match(/invalid-registration|not-registered/))
      .map(({ t }: any) => t)
    if (bad.length) await supabase.from('push_subscriptions').delete().in('fcm_token', bad)

    return NextResponse.json({ sent: result.successCount, failed: result.failureCount })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
