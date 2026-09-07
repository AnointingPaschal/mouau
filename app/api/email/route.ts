import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,  // Gmail App Password (not your login password)
  },
})

export async function POST(req: NextRequest) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
  }
  try {
    const { to, subject, html } = await req.json()
    if (!to || !subject) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    await transporter.sendMail({
      from: `"MOUAU FreshStart" <${process.env.GMAIL_USER}>`,
      to:   Array.isArray(to) ? to.join(',') : to,
      subject,
      html: html || `<p>${subject}</p>`,
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Email error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
