import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'
import { supabase } from '@/lib/supabase'
import { getSettings } from '@/lib/settings'
import { emailTemplate } from '@/lib/emailTemplate'
import nodemailer from 'nodemailer'

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await adminDb.from('announcements').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, body, type, pinned } = await req.json()
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  await adminDb.from('announcements').insert({ title, body, type: type || 'info', pinned: !!pinned })

  // Fire-and-forget: broadcast notifications to all students
  broadcastAnnouncement({ title, body }).catch(e => console.error('Broadcast error:', e))

  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await req.json()
  await adminDb.from('announcements').update(updates).eq('id', id)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await adminDb.from('announcements').delete().eq('id', id)
  return NextResponse.json({ success: true })
}

// ─── Broadcast to all students ──────────────────────────────────────────────
async function broadcastAnnouncement({ title, body }: { title: string; body: string }) {
  const s = await getSettings()

  // Check notification rules for 'announcement'
  const { data: rule } = await supabase
    .from('notification_rules')
    .select('*')
    .eq('event_type', 'announcement')
    .eq('enabled', true)
    .single()

  const pushEnabled  = rule ? rule.channel_push  : true
  const emailEnabled = rule ? rule.channel_email : false
  const inappEnabled = rule ? rule.channel_inapp : true

  // 1. In-app: insert notification for every student
  if (inappEnabled) {
    const { data: students } = await supabase.from('students').select('id_number')
    if (students?.length) {
      const rows = students.map((st: any) => ({
        recipient_id: st.id_number,
        type:         'announcement',
        title,
        body:         body || '',
        post_id:      '',
        actor:        'Admin',
        read:         false,
      }))
      // Insert in batches of 50 to avoid payload limits
      for (let i = 0; i < rows.length; i += 50) {
        await supabase.from('notifications').insert(rows.slice(i, i + 50))
      }
    }
  }

  // 2. Push: send FCM to all registered devices
  if (pushEnabled) {
    const { data: subs } = await supabase.from('push_subscriptions').select('fcm_token')
    if (subs?.length) {
      try {
        const { initializeApp, getApps, cert } = await import('firebase-admin/app')
        const { getMessaging }                  = await import('firebase-admin/messaging')

        const projectId   = (s.firebase_admin_project_id   || '').trim()
        const clientEmail = (s.firebase_admin_client_email  || '').trim()
        const privateKey  = (s.firebase_admin_private_key   || '').trim().replace(/\\n/g, '\n')

        if (projectId && clientEmail && privateKey) {
          if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
          const messaging = getMessaging()
          const appName   = s.site_name || 'MOUAU FreshStart'
          const appIcon   = s.logo_url  || '/icon-192.png'
          const tokens    = subs.map((sub: any) => sub.fcm_token)

          // FCM max 500 tokens per multicast
          for (let i = 0; i < tokens.length; i += 500) {
            const batch = tokens.slice(i, i + 500)
            const result = await messaging.sendEachForMulticast({
              notification: {
                title: `📢 ${appName}`,
                body:  title,
              },
              data: { url: '/dashboard', type: 'announcement' },
              android: {
                priority: 'high',
                notification: { color: '#1a6b3a', sound: 'default', channelId: 'freshstart_default' },
              },
              webpush: {
                notification: { icon: appIcon.startsWith('http') ? appIcon : `https://mouau-rose.vercel.app${appIcon}` },
                fcmOptions:   { link: 'https://mouau-rose.vercel.app/dashboard' },
              },
              tokens: batch,
            })
            // Remove bad tokens
            const bad = result.responses
              .map((r: any, idx: number) => ({ r, t: batch[idx] }))
              .filter(({ r }: any) => !r.success && (r.error?.code || '').match(/invalid-registration|not-registered/))
              .map(({ t }: any) => t)
            if (bad.length) await supabase.from('push_subscriptions').delete().in('fcm_token', bad)
          }
        }
      } catch (e) { console.error('Push broadcast error:', e) }
    }
  }

  // 3. Email: send to all students with an email address
  if (emailEnabled) {
    const gmailUser = s.gmail_user || ''
    const gmailPass = s.gmail_app_password || ''
    if (gmailUser && gmailPass) {
      const { data: students } = await supabase
        .from('students')
        .select('name, email')
        .not('email', 'is', null)
        .neq('email', '')
        .neq('email', 'N/A')

      if (students?.length) {
        const html = emailTemplate({
          title,
          body:  body || title,
          type:  'announcement',
          cta:   { text: 'Open FreshStart', url: 'https://mouau-rose.vercel.app/dashboard' },
        })
        const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailPass } })
        // Send in sequence to respect Gmail rate limits
        for (const st of students as any[]) {
          if (!st.email) continue
          await transporter.sendMail({
            from:    `"${s.site_name || 'MOUAU FreshStart'}" <${gmailUser}>`,
            to:      st.email,
            subject: `📢 ${title}`,
            html,
          }).catch(() => {}) // continue on individual failure
        }
      }
    }
  }
}
