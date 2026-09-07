import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getSettings } from '@/lib/settings'
import { emailTemplate } from '@/lib/emailTemplate'

export async function POST(req: NextRequest) {
  const s = await getSettings()
  const gmailUser = s.gmail_user || process.env.GMAIL_USER || ''
  const gmailPass = s.gmail_app_password || process.env.GMAIL_APP_PASSWORD || ''
  if (!gmailUser || !gmailPass) return NextResponse.json({ error: 'Gmail not configured' }, { status: 503 })

  try {
    const { to, subject, html, body, cta, recipientName, type } = await req.json()
    if (!to || !subject) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const finalHtml = html || emailTemplate({
      title: subject,
      body: body || subject,
      cta,
      recipientName,
      type: type || 'info',
    })

    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailPass } })
    await transporter.sendMail({
      from: `"${s.site_name || 'MOUAU FreshStart'}" <${gmailUser}>`,
      to:   Array.isArray(to) ? to.join(',') : to,
      subject,
      html: finalHtml,
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
