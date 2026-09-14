import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
