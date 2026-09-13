import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'
import { supabase } from '@/lib/supabase'
import { getSettings } from '@/lib/settings'
import { emailTemplate } from '@/lib/emailTemplate'
import nodemailer from 'nodemailer'

/* ─── Audience resolver ───────────────────────────────────────────────────── */
async function resolveRecipients(audience: string): Promise<string[]> {
  // Returns array of id_numbers

  if (audience === 'all') {
    const { data } = await supabase.from('students').select('id_number')
    return (data || []).map((s: any) => s.id_number)
  }

  if (audience === 'pwa_installed') {
    const { data } = await supabase
      .from('push_subscriptions').select('student_id')
    const seen = new Set<string>()
    return (data || []).map((s: any) => s.student_id).filter((id: string) => { if (seen.has(id)) return false; seen.add(id); return true })
  }

  if (audience.startsWith('material_')) {
    const status = audience.replace('material_', '')
    const { data } = await supabase
      .from('material_requests').select('student_id').eq('status', status)
    const seen = new Set<string>()
    return (data || []).map((s: any) => s.student_id).filter((id: string) => { if (seen.has(id)) return false; seen.add(id); return true })
  }

  if (audience.startsWith('level_')) {
    const level = audience.replace('level_', '') // 100 | 200 | 300 | 400 | 500
    const { data } = await supabase
      .from('students').select('id_number').eq('level', level)
    return (data || []).map((s: any) => s.id_number)
  }

  if (audience.startsWith('dept_')) {
    const dept = audience.replace('dept_', '')
    const { data } = await supabase
      .from('students').select('id_number').ilike('department', `%${dept}%`)
    return (data || []).map((s: any) => s.id_number)
  }

  return []
}

/* ─── FCM multicast helper ────────────────────────────────────────────────── */
async function sendPush(recipientIds: string[], title: string, body: string, url: string, s: any) {
  const appUrl  = 'https://mouau-rose.vercel.app'
  const appIcon = s.logo_url?.startsWith('http') ? s.logo_url : `${appUrl}/icon-192.png`

  // Get all FCM tokens for these recipients
  let query = supabase.from('push_subscriptions').select('fcm_token, student_id')
  if (recipientIds.length > 0) query = query.in('student_id', recipientIds)
  const { data: subs } = await query
  if (!subs?.length) return { sent: 0, failed: 0 }

  const projectId   = (s.firebase_admin_project_id   || '').trim()
  const clientEmail = (s.firebase_admin_client_email  || '').trim()
  const privateKey  = (s.firebase_admin_private_key   || '').trim().replace(/\\n/g, '\n')
  if (!projectId || !clientEmail || !privateKey) return { sent: 0, failed: 0, error: 'Firebase not configured' }

  const { initializeApp, getApps, cert } = await import('firebase-admin/app')
  const { getMessaging }                  = await import('firebase-admin/messaging')
  if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  const messaging = getMessaging()

  const tokens = subs.map((sub: any) => sub.fcm_token)
  let totalSent = 0, totalFailed = 0
  const badTokens: string[] = []

  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500)
    const result = await messaging.sendEachForMulticast({
      notification: { title, body },
      data: { url: url || '/dashboard' },
      android: {
        priority: 'high',
        notification: { color: '#1a6b3a', sound: 'default', channelId: 'freshstart_default' },
      },
      webpush: {
        notification: { icon: appIcon, badge: `${appUrl}/icon-192.png`, vibrate: [200, 100, 200] },
        fcmOptions: { link: `${appUrl}${url || '/dashboard'}` },
      },
      tokens: batch,
    })
    totalSent   += result.successCount
    totalFailed += result.failureCount
    result.responses.forEach((r: any, idx: number) => {
      if (!r.success && (r.error?.code || '').match(/invalid-registration|not-registered/)) {
        badTokens.push(batch[idx])
      }
    })
  }
  if (badTokens.length) await supabase.from('push_subscriptions').delete().in('fcm_token', badTokens)
  return { sent: totalSent, failed: totalFailed }
}

/* ─── In-app notifications ────────────────────────────────────────────────── */
async function sendInApp(recipientIds: string[], title: string, body: string, url: string) {
  const rows = recipientIds.map(id => ({
    recipient_id: id,
    type: 'announcement',
    title,
    body: body || '',
    post_id: '',
    actor: 'Admin',
    read: false,
  }))
  for (let i = 0; i < rows.length; i += 50) {
    await supabase.from('notifications').insert(rows.slice(i, i + 50))
  }
  return { sent: rows.length }
}

/* ─── Email ───────────────────────────────────────────────────────────────── */
async function sendEmail(recipientIds: string[], title: string, body: string, url: string, s: any) {
  const gmailUser = (s.gmail_user || s.gmail_email || '').trim()
  const gmailPass = (s.gmail_password || s.gmail_app_password || '').trim()
  if (!gmailUser || !gmailPass) return { sent: 0, error: 'Gmail not configured' }

  const { data: students } = await supabase
    .from('students').select('id_number, name, email').in('id_number', recipientIds)
  if (!students?.length) return { sent: 0 }

  const transporter = nodemailer.createTransport({
    service: 'gmail', auth: { user: gmailUser, pass: gmailPass },
  })

  const appName = s.site_name || 'MOUAU FreshStart'
  const appUrl  = 'https://mouau-rose.vercel.app'
  let sent = 0

  for (const st of students) {
    if (!st.email) continue
    try {
      await transporter.sendMail({
        from: `"${appName}" <${gmailUser}>`,
        to: st.email,
        subject: title,
        html: emailTemplate({
          title,
          body,
          recipientName: st.name,
          type: 'announcement',
          cta: url ? { text: 'Open App', url: `${appUrl}${url}` } : undefined,
        }),
      })
      sent++
    } catch { /* individual failure — continue */ }
  }
  return { sent }
}

/* ─── Preview endpoint: count audience ───────────────────────────────────── */
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const audience = req.nextUrl.searchParams.get('audience') || 'all'
  const ids = await resolveRecipients(audience)

  // Also count how many have push tokens
  const { data: pushSubs } = await supabase
    .from('push_subscriptions').select('student_id').in('student_id', ids)
  const pushCount = new Set((pushSubs || []).map((s: any) => s.student_id)).size

  return NextResponse.json({ total: ids.length, pushEnabled: pushCount })
}

/* ─── Send endpoint ────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    audience = 'all',
    title,
    body,
    url = '/dashboard',
    channels = { push: true, inapp: true, email: false },
  } = await req.json()

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const recipientIds = await resolveRecipients(audience)
  if (!recipientIds.length) return NextResponse.json({ error: 'No recipients found for this audience' }, { status: 400 })

  const s = await getSettings()
  const results: Record<string, any> = { recipients: recipientIds.length }

  // Fire channels in parallel
  const tasks: Promise<void>[] = []

  if (channels.push) {
    tasks.push(
      sendPush(recipientIds, title, body || '', url, s)
        .then(r => { results.push = r })
        .catch(e => { results.push = { error: e.message } })
    )
  }

  if (channels.inapp) {
    tasks.push(
      sendInApp(recipientIds, title, body || '', url)
        .then(r => { results.inapp = r })
        .catch(e => { results.inapp = { error: e.message } })
    )
  }

  if (channels.email) {
    tasks.push(
      sendEmail(recipientIds, title, body || '', url, s)
        .then(r => { results.email = r })
        .catch(e => { results.email = { error: e.message } })
    )
  }

  await Promise.all(tasks)
  return NextResponse.json({ ok: true, results })
}
