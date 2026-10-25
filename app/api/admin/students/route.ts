import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminFromRequest } from '@/lib/admin'

// Build a fresh service-role client directly — bypasses any Proxy issues
function makeAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = makeAdminClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() || ''
  const limit  = parseInt(searchParams.get('limit') || '0')

  // Search mode
  if (search) {
    const q = search.toLowerCase()
    let query = db.from('students')
      .select('id_number,name,email,department,level')
      .or(`name.ilike.%${q}%,id_number.ilike.%${q}%,email.ilike.%${q}%`)
      .order('name')
    if (limit > 0) query = query.limit(limit)
    const { data, error } = await query
    if (error) console.error('[students search]', error.message)
    return NextResponse.json({ data: data || [] })
  }

  // Full fetch — no limit, no RLS (service-role bypasses it)
  const { data: students, error: studErr } = await db
    .from('students')
    .select('*')
    .order('created_at', { ascending: false })

  if (studErr) console.error('[students fetch]', studErr.message)

  const { data: subs } = await db
    .from('push_subscriptions')
    .select('student_id')

  // Tag PWA installs
  const pwaSet = new Set(
    (subs || []).map((s: any) => String(s.student_id || '').trim().toLowerCase())
  )

  const tagged = (students || []).map((s: any) => ({
    ...s,
    pwa_installed: pwaSet.has(String(s.id_number || '').trim().toLowerCase()),
  }))

  console.log(`[students] returned ${tagged.length} rows, serviceKey=${!!(process.env.SUPABASE_SERVICE_ROLE_KEY)}`)

  return NextResponse.json({ data: tagged })
}
