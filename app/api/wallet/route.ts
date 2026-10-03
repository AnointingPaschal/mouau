import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get('studentId')
  if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

  const { data: wallet } = await adminDb
    .from('wallets')
    .select('*')
    .eq('student_id', studentId.toLowerCase().trim())
    .maybeSingle()

  return NextResponse.json({ wallet: wallet || null })
}
