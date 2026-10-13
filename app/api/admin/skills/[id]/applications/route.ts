import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'
import { supabase } from '@/lib/supabase'
import { getSettings } from '@/lib/settings'
import { emailTemplate } from '@/lib/emailTemplate'
import nodemailer from 'nodemailer'

const APP_URL = 'https://mouau-rose.vercel.app'

/* ─── Send transactional email to one student ───────────────────────────── */
async function sendTransactionalEmail(opts: {
  studentId:   string
  subject:     string
  title:       string
  body:        string
  type:        'success' | 'warning' | 'info' | 'announcement'
  ctaText:     string
  ctaUrl:      string
  s:           any
}) {
  const { studentId, subject, title, body, type, ctaText, ctaUrl, s } = opts
  const gmailUser = (s.gmail_user || s.gmail_email || '').trim()
  const gmailPass = (s.gmail_password || s.gmail_app_password || '').trim()
  if (!gmailUser || !gmailPass) return  // Gmail not configured — skip silently

  const { data: student } = await supabase
    .from('students').select('name, email').eq('id_number', studentId).single()
  if (!student?.email) return

  const siteName = s.site_name || 'PDM MOUAU'
  const logoUrl  = s.logo_url?.startsWith('http') ? s.logo_url : undefined
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailPass } })

  try {
    await transporter.sendMail({
      from:    `"${siteName}" <${gmailUser}>`,
      to:      student.email,
      subject,
      html: emailTemplate({
        title, body,
        recipientName: student.name,
        type,
        siteName,
        logoUrl,
        cta: { text: ctaText, url: ctaUrl },
      }),
    })
  } catch { /* don't fail the status update if email fails */ }
}

/* ─── Send FCM push to one student ─────────────────────────────────────── */
async function sendTransactionalPush(opts: {
  studentId: string
  title:     string
  body:      string
  url:       string
  s:         any
}) {
  const { studentId, title, body, url, s } = opts
  const projectId   = (s.firebase_admin_project_id  || '').trim()
  const clientEmail = (s.firebase_admin_client_email || '').trim()
  const privateKey  = (s.firebase_admin_private_key  || '').trim().replace(/\\n/g, '\n')
  if (!projectId || !clientEmail || !privateKey) return

  const { data: subs } = await supabase
    .from('push_subscriptions').select('fcm_token').eq('student_id', studentId)
  const tokens = (subs || []).map((s: any) => s.fcm_token).filter((t: string) => t && !t.startsWith('pwa:'))
  if (!tokens.length) return

  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    const { getMessaging }                  = await import('firebase-admin/messaging')
    if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
    const messaging = getMessaging()

    const logoUrl   = s.logo_url?.startsWith('http') ? s.logo_url : null
    const notifIcon = logoUrl || `${APP_URL}/notification-icon.png`
    const destUrl   = `${APP_URL}${url}`

    await messaging.sendEachForMulticast({
      notification: { title, body },
      data:         { title, body, url, icon: notifIcon },
      android: {
        priority: 'high',
        notification: { title, body, color: '#1a6b3a', sound: 'default', channelId: 'freshstart_default' },
      },
      webpush: {
        notification: { title, body, icon: notifIcon, badge: `${APP_URL}/badge-icon.png`, vibrate: [200, 100, 200] },
        fcmOptions: { link: destUrl },
      },
      tokens,
    })
  } catch { /* don't fail the status update if push fails */ }
}

/* ─── Main PUT handler ───────────────────────────────────────────────────── */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { application_id, status, student_id, skill_title } = await req.json()

  // Update status in DB
  await adminDb.from('skill_applications').update({ status }).eq('id', application_id)

  if (status === 'approved' || status === 'rejected') {
    const s = await getSettings()
    const skillUrl = `/skills/${params.id}`

    // ── In-app notification (always) ──────────────────────────────────────
    await adminDb.from('notifications').insert({
      recipient_id: student_id,
      type:         status === 'approved' ? 'skill_approved' : 'skill_class',
      title:        status === 'approved'
        ? `🎉 Application Approved — ${skill_title}`
        : `Application Update — ${skill_title}`,
      body: status === 'approved'
        ? `Congratulations! Your application for "${skill_title}" has been approved. Watch out for class announcements.`
        : `We regret to inform you that your application for "${skill_title}" was not successful this time. Keep an eye out for future openings.`,
      post_id: skillUrl,
      actor:   s.site_name || 'PDM MOUAU',
      read:    false,
    })

    // ── Email + Push (fire-and-forget) ────────────────────────────────────
    const notifTitle = status === 'approved'
      ? `🎉 Your application for "${skill_title}" is approved!`
      : `Application update for "${skill_title}"`

    const notifBody = status === 'approved'
      ? `Congratulations! Your application for the "${skill_title}" skill acquisition programme has been approved. Stay tuned for class schedules and further instructions.`
      : `Thank you for your interest in "${skill_title}". Unfortunately, your application was not successful at this time. New openings may be announced — keep checking the Skills page!`

    await Promise.allSettled([
      sendTransactionalEmail({
        studentId: student_id,
        subject:   notifTitle,
        title:     notifTitle,
        body:      notifBody,
        type:      status === 'approved' ? 'success' : 'warning',
        ctaText:   'View Skill',
        ctaUrl:    `${APP_URL}${skillUrl}`,
        s,
      }),
      sendTransactionalPush({
        studentId: student_id,
        title:     notifTitle,
        body:      notifBody,
        url:       skillUrl,
        s,
      }),
    ])
  }

  return NextResponse.json({ ok: true })
}
