import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get('studentId')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
  if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

  const { data, error } = await adminDb
    .from('wallet_transactions')
    .select('*')
    .eq('student_id', studentId.toLowerCase().trim())
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ transactions: data || [] })
}
