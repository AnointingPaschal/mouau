import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSettings } from '@/lib/settings'

// Global singleton to survive warm lambda reuse
declare global { var _fbAdmin: any }

async function getMessaging() {
  const s = await getSettings()
  const projectId   = s.firebase_admin_project_id   || process.env.FIREBASE_ADMIN_PROJECT_ID || ''
  const clientEmail = s.firebase_admin_client_email  || process.env.FIREBASE_ADMIN_CLIENT_EMAIL || ''
  const privateKey  = (s.firebase_admin_private_key  || process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g,'\n')

  if (!projectId || !clientEmail || !privateKey) throw new Error('Firebase Admin credentials not configured in App Settings')

  if (!global._fbAdmin) {
    const admin = require('firebase-admin')
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) })
    }
    global._fbAdmin = admin
  }
  return global._fbAdmin.messaging()
}

export async function POST(req: NextRequest) {
  try {
    const { studentId, title, body, url, testMode } = await req.json()

    // Test mode — just verify SDK init works
    if (testMode) {
      const msg = await getMessaging()
      return NextResponse.json({ ok: true, message: 'Firebase Admin SDK initialized successfully' })
    }

    if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

    const { data: subs } = await supabase.from('push_subscriptions').select('fcm_token').eq('student_id', studentId)
    if (!subs?.length) return NextResponse.json({ sent: 0, message: 'No devices registered for this student' })

    const msg = await getMessaging()
    const tokens: string[] = subs.map((s: any) => s.fcm_token)
    const result = await msg.sendEachForMulticast({
      notification: { title: title || 'MOUAU FreshStart', body: body || '' },
      data: { url: url || '/dashboard' },
      android: { priority: 'high', notification: { color: '#1a6b3a', sound: 'default' } },
      webpush: { fcmOptions: { link: `https://mouau-rose.vercel.app${url || '/dashboard'}` }, notification: { icon: '/icon-192.png' } },
      tokens,
    })
    const bad: string[] = []
    result.responses.forEach((r: any, i: number) => {
      const code = r.error?.code || ''
      if (!r.success && (code.includes('invalid-registration') || code.includes('not-registered'))) bad.push(tokens[i])
    })
    if (bad.length) await supabase.from('push_subscriptions').delete().in('fcm_token', bad)
    return NextResponse.json({ sent: result.successCount, failed: result.failureCount })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
