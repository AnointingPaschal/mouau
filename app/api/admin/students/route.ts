import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminFromRequest } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const usingService = !!serviceKey

  // Always create a fresh client — never use a cached singleton
  const db = createClient(supabaseUrl, serviceKey || anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: serviceKey
        ? { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }
        : {},
    },
  })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() || ''
  const limitParam = parseInt(searchParams.get('limit') || '0')

  // Search mode
  if (search) {
    const q = search.toLowerCase()
    let query = db.from('students')
      .select('id_number,name,email,department,level')
      .or(`name.ilike.%${q}%,id_number.ilike.%${q}%,email.ilike.%${q}%`)
      .order('name')
    if (limitParam > 0) query = query.limit(limitParam)
    const { data, error } = await query
    console.log(`[students/search] q="${q}" returned ${data?.length ?? 0}, serviceKey=${usingService}, error=${error?.message}`)
    return NextResponse.json({ data: data || [] })
  }

  // Full fetch — explicitly request up to 1000 rows with range header
  const { data: students, error: studErr } = await db
    .from('students')
    .select('*')
    .order('created_at', { ascending: false })
    .range(0, 999)

  console.log(`[students] returned ${students?.length ?? 0} rows, serviceKey=${usingService}, error=${studErr?.message ?? 'none'}`)

  if (studErr) {
    // Fallback: try direct REST call
    console.error('[students] Supabase JS error, trying direct REST fetch')
    try {
      const restUrl = `${supabaseUrl}/rest/v1/students?select=*&order=created_at.desc&limit=1000`
      const key = serviceKey || anonKey
      const res = await fetch(restUrl, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'count=none',
        },
      })
      const fallbackData = await res.json()
      console.log(`[students/rest-fallback] returned ${Array.isArray(fallbackData) ? fallbackData.length : 'non-array'}`)
      const rows = Array.isArray(fallbackData) ? fallbackData : []
      return NextResponse.json({ data: rows, pwaInstalled: [] })
    } catch (fe) {
      console.error('[students/rest-fallback] failed:', fe)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }
  }

  // Tag PWA installs
  const { data: subs } = await db
    .from('push_subscriptions')
    .select('student_id')

  const pwaSet = new Set(
    (subs || []).map((s: any) => String(s.student_id || '').trim().toLowerCase())
  )

  const tagged = (students || []).map((s: any) => ({
    ...s,
    pwa_installed: pwaSet.has(String(s.id_number || '').trim().toLowerCase()),
  }))

  return NextResponse.json({
    data: tagged,
    pwaInstalled: tagged.filter((s: any) => s.pwa_installed).map((s: any) => s.id_number),
  })
}
