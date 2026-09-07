import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSettings } from '@/lib/settings'

let messaging: any = null
let lastProjectId = ''

async function getMessaging() {
  const s = await getSettings()
  const projectId   = s.firebase_admin_project_id   || process.env.FIREBASE_ADMIN_PROJECT_ID || ''
  const clientEmail = s.firebase_admin_client_email  || process.env.FIREBASE_ADMIN_CLIENT_EMAIL || ''
  const privateKey  = (s.firebase_admin_private_key  || process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n')

  // Re-init if credentials changed
  if (messaging && lastProjectId === projectId) return messaging

  const admin = require('firebase-admin')
  if (admin.apps.length) { try { admin.apps[0].delete() } catch {} }
  admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) })
  messaging = admin.messaging()
  lastProjectId = projectId
  return messaging
}

export async function POST(req: NextRequest) {
  try {
    const { studentId, title, body, url } = await req.json()
    if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

    // Check notification rules
    const { data: rules } = await supabase.from('notification_rules').select('*')
    const pushEnabled = rules?.every((r: any) => r.enabled && r.channel_push) ?? true

    const { data: subs } = await supabase.from('push_subscriptions')
      .select('fcm_token').eq('student_id', studentId)
    if (!subs?.length) return NextResponse.json({ sent: 0 })

    const msg = await getMessaging()
    const tokens: string[] = subs.map((s: any) => s.fcm_token)

    const result = await msg.sendEachForMulticast({
      notification: { title: title || 'MOUAU FreshStart', body: body || '' },
      data:         { url: url || '/dashboard' },
      android:      { priority: 'high', notification: { color: '#1a6b3a', sound: 'default' } },
      webpush:      { fcmOptions: { link: `https://mouau-rose.vercel.app${url || '/dashboard'}` }, notification: { icon: '/icon-192.png' } },
      tokens,
    })

    const bad: string[] = []
    result.responses.forEach((r: any, i: number) => {
      const code = r.error?.code || ''
      if (!r.success && (code.includes('invalid-registration') || code.includes('not-registered'))) bad.push(tokens[i])
    })
    if (bad.length) await supabase.from('push_subscriptions').delete().in('fcm_token', bad)

    return NextResponse.json({ sent: result.successCount })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
