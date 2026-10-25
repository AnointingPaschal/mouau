import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminFromRequest } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const keyUsed     = serviceKey || anonKey

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() || ''
  const limit  = parseInt(searchParams.get('limit') || '0')

  // Search mode
  if (search) {
    const db = createClient(supabaseUrl, keyUsed, { auth: { persistSession: false } })
    const q = search.toLowerCase()
    let query = db.from('students')
      .select('id_number,name,email,department,level')
      .or(`name.ilike.%${q}%,id_number.ilike.%${q}%,email.ilike.%${q}%`)
      .order('name')
    if (limit > 0) query = query.limit(limit)
    const { data } = await query
    return NextResponse.json({ data: data || [] })
  }

  // ── PRIMARY: raw REST fetch bypasses JS client row limit ──────────────────
  let students: any[] | null = null
  let fetchMethod = 'rest'

  try {
    const restUrl = `${supabaseUrl}/rest/v1/students?select=*&order=created_at.desc`
    const res = await fetch(restUrl, {
      headers: {
        'apikey':        keyUsed,
        'Authorization': `Bearer ${keyUsed}`,
        'Range':         '0-9999',          // request up to 10 000 rows
        'Prefer':        'count=none',
      },
    })
    if (res.ok) {
      students = await res.json()
      console.log(`[students] REST returned ${students?.length} rows, serviceKey=${!!serviceKey}`)
    } else {
      const errText = await res.text()
      console.error(`[students] REST failed ${res.status}: ${errText}`)
    }
  } catch (e) {
    console.error('[students] REST exception:', e)
  }

  // ── FALLBACK: JS client ───────────────────────────────────────────────────
  if (!students) {
    fetchMethod = 'jsclient'
    const db = createClient(supabaseUrl, keyUsed, { auth: { persistSession: false } })
    const { data, error } = await db
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, 9999)
    students = data || []
    console.log(`[students] JS-client returned ${students.length} rows, error=${error?.message || 'none'}, serviceKey=${!!serviceKey}`)
  }

  // ── PWA cross-reference ───────────────────────────────────────────────────
  const db2 = createClient(supabaseUrl, keyUsed, { auth: { persistSession: false } })
  const { data: subs } = await db2.from('push_subscriptions').select('student_id')

  const pwaSet = new Set<string>()
  for (const s of subs || []) {
    const raw = String(s.student_id || '').trim().toLowerCase()
    if (raw) pwaSet.add(raw)
  }

  const tagged = (students || []).map((s: any) => ({
    ...s,
    pwa_installed: pwaSet.has(String(s.id_number || '').trim().toLowerCase()),
  }))

  console.log(`[students] final: ${tagged.length} rows via ${fetchMethod}`)

  return NextResponse.json({ data: tagged })
}
