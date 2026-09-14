import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: students }, { data: subs }] = await Promise.all([
    adminDb.from('students').select('*').order('created_at', { ascending: false }),
    supabase.from('push_subscriptions').select('student_id'),
  ])

  // Students with at least one FCM token have the PWA installed
  const pwaSet = new Set<string>((subs || []).map((s: any) => String(s.student_id)))

  return NextResponse.json({
    data: students || [],
    pwaInstalled: Array.from(pwaSet),
  })
}
