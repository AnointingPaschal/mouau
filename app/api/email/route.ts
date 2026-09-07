import { NextRequest, NextResponse } from 'next/server'

const RESEND_KEY = process.env.RESEND_API_KEY

export async function POST(req: NextRequest) {
  if (!RESEND_KEY) return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
  try {
    const { to, subject, html } = await req.json()
    if (!to || !subject) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'MOUAU FreshStart <notifications@mouaufreshstart.com>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || `<p>${subject}</p>`,
      })
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
