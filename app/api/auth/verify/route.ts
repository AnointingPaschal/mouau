import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSettings } from '@/lib/settings'
import { emailTemplate } from '@/lib/emailTemplate'
import nodemailer from 'nodemailer'

function code6() { return Math.floor(100000 + Math.random() * 900000).toString() }

export async function POST(req: NextRequest) {
  const { email, name, idNumber } = await req.json()
  if (!email || !idNumber) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data: dup } = await supabase.from('students')
    .select('id,email,id_number')
    .or(`id_number.eq.${idNumber},email.eq.${email}`)
    .limit(1)

  if (dup?.length) {
    const d = dup[0] as any
    if (d.id_number === idNumber) return NextResponse.json({ error: 'This JAMB/Matric number is already registered. Sign in instead.' }, { status: 409 })
    return NextResponse.json({ error: 'This email is already registered. Sign in instead.' }, { status: 409 })
  }

  const c = code6()
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  await supabase.from('verification_codes').upsert({ email, id_number: idNumber, name, code: c, expires_at: expires, used: false }, { onConflict: 'email' })

  const s = await getSettings()
  const gmailUser = s.gmail_user || ''
  const gmailPass = s.gmail_app_password || ''

  if (gmailUser && gmailPass) {
    const html = emailTemplate({
      title: 'Your verification code',
      recipientName: name,
      type: 'success',
      body: `<p>Enter this code to verify your email and complete registration on MOUAU FreshStart.</p>
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:#0a0a0a;border-radius:16px;padding:24px 48px;">
          <p style="color:#aaa;font-size:11px;margin:0 0 8px;letter-spacing:3px;text-transform:uppercase;">Verification Code</p>
          <p style="color:#4ade80;font-size:44px;font-weight:900;letter-spacing:14px;margin:0;font-family:monospace;">${c}</p>
        </div>
      </div>
      <p style="color:#aaa;font-size:13px;text-align:center;">Expires in <strong>15 minutes</strong>. Never share this code.</p>`,
    })
    const t = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailPass } })
    await t.sendMail({ from: `"MOUAU FreshStart" <${gmailUser}>`, to: email, subject: `${c} — Verify your MOUAU FreshStart account`, html }).catch(() => {})
  }

  return NextResponse.json({ ok: true, emailSent: !!(gmailUser && gmailPass) })
}

export async function PUT(req: NextRequest) {
  const { email, code } = await req.json()
  const { data } = await supabase.from('verification_codes')
    .select('*').eq('email', email).eq('code', code).eq('used', false).single()
  if (!data) return NextResponse.json({ error: 'Invalid code. Check your email and try again.' }, { status: 400 })
  if (new Date(data.expires_at) < new Date()) return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 })
  await supabase.from('verification_codes').update({ used: true }).eq('email', email)
  return NextResponse.json({ ok: true, name: data.name, idNumber: data.id_number })
}
