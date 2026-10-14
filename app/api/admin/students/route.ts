import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() || ''
  const limit  = parseInt(searchParams.get('limit') || '0')

  // Search mode — lightweight, returns minimal fields
  if (search) {
    const q = search.toLowerCase()
    let query = adminDb.from('students')
      .select('id_number,name,email,department,level')
      .or(`name.ilike.%${q}%,id_number.ilike.%${q}%,email.ilike.%${q}%`)
      .order('name')
    if (limit > 0) query = query.limit(limit)
    const { data } = await query
    return NextResponse.json({ data: data || [] })
  }

  // Fetch students and push subscriptions in parallel
  const [{ data: students }, { data: subs }] = await Promise.all([
    adminDb.from('students').select('*').order('created_at', { ascending: false }),
    supabase.from('push_subscriptions').select('student_id'),
  ])

  // Build a normalised set of student_ids that have FCM tokens
  // Normalise to lowercase+trimmed to avoid case mismatches
  const pwaSet = new Map<string, string>() // normalised → original
  for (const s of subs || []) {
    const raw = String(s.student_id || '').trim()
    if (raw) pwaSet.set(raw.toLowerCase(), raw)
  }

  // Cross-reference with the students list and tag each student
  const tagged = (students || []).map((s: any) => ({
    ...s,
    pwa_installed: pwaSet.has(String(s.id_number || '').trim().toLowerCase()),
  }))

  const pwaInstalled = tagged
    .filter((s: any) => s.pwa_installed)
    .map((s: any) => s.id_number)

  return NextResponse.json({ data: tagged, pwaInstalled })
}
