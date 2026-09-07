import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSettings } from '@/lib/settings'
import { emailTemplate } from '@/lib/emailTemplate'
import nodemailer from 'nodemailer'

function code6() { return Math.floor(100000 + Math.random() * 900000).toString() }

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Enter your email address' }, { status: 400 })

  const { data: student } = await supabase
    .from('students').select('name,id_number').eq('email', email.trim().toLowerCase()).single()

  // Always respond OK to prevent email enumeration
  if (!student) return NextResponse.json({ ok: true })

  const c = code6()
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  await supabase.from('verification_codes').upsert({
    email: email.trim().toLowerCase(), id_number: student.id_number,
    name: student.name, code: c, expires_at: expires, used: false
  }, { onConflict: 'email' })

  const s = await getSettings()
  const gmailUser = s.gmail_user || ''
  const gmailPass = s.gmail_app_password || ''

  if (gmailUser && gmailPass) {
    const html = emailTemplate({
      title: 'Reset your password',
      recipientName: student.name,
      type: 'warning',
      body: `<p>You requested a password reset for your MOUAU FreshStart account.</p>
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:#0a0a0a;border-radius:16px;padding:24px 48px;">
          <p style="color:#aaa;font-size:11px;margin:0 0 8px;letter-spacing:3px;text-transform:uppercase;">Reset Code</p>
          <p style="color:#fbbf24;font-size:44px;font-weight:900;letter-spacing:14px;margin:0;font-family:monospace;">${c}</p>
        </div>
      </div>
      <p style="color:#aaa;font-size:13px;text-align:center;">Expires in <strong>15 minutes</strong>. If you didn't request this, ignore this email.</p>`,
    })
    const t = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailPass } })
    await t.sendMail({ from: `"MOUAU FreshStart" <${gmailUser}>`, to: email, subject: `${c} — Password reset code`, html }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
