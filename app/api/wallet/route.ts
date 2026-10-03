import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'
import { logApiError } from '@/lib/logError'

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get('studentId')
  if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

  try {
    const { data: wallet } = await getAdminDb()
      .from('wallets')
      .select('*')
      .eq('student_id', studentId.toLowerCase().trim())
      .maybeSingle()

    return NextResponse.json({ wallet: wallet || null })
  } catch (e: any) {
    await logApiError({ route: '/api/wallet', method: 'GET', error: e, studentId })
    return NextResponse.json({ wallet: null })
  }
}
