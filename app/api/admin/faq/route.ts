import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/supabase'

export async function GET() {
  const db = getAdminDb()
  const { data } = await db.from('app_settings').select('key,value').in('key', ['faqs', 'whatsapp_group_link'])
  const faqs = data?.find((r: any) => r.key === 'faqs')
  const wa   = data?.find((r: any) => r.key === 'whatsapp_group_link')
  let parsedFaqs = []
  try { parsedFaqs = JSON.parse(faqs?.value || '[]') } catch {}
  return NextResponse.json({ faqs: parsedFaqs, waLink: wa?.value || '' })
}

export async function POST(req: Request) {
  const db = getAdminDb()
  const { faqs, waLink } = await req.json()
  const ops = [
    db.from('app_settings').upsert({ key: 'faqs', value: JSON.stringify(faqs), category: 'community', label: 'FAQ Questions', description: 'JSON array of {q,a} objects shown on student dashboard', is_secret: false }, { onConflict: 'key' }),
    db.from('app_settings').upsert({ key: 'whatsapp_group_link', value: waLink || '', category: 'community', label: 'WhatsApp Group Link', description: 'Join link shown as banner on student dashboard', is_secret: false }, { onConflict: 'key' }),
  ]
  const results = await Promise.all(ops)
  const err = results.find(r => r.error)
  if (err?.error) return NextResponse.json({ ok: false, error: err.error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
