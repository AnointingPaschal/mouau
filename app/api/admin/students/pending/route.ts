import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all verification_codes entries — both used and unused
  const { data: codes } = await adminDb
    .from('verification_codes')
    .select('id, email, id_number, name, created_at, expires_at, used')
    .order('created_at', { ascending: false })

  // Get all registered student emails/id_numbers for cross-referencing
  const { data: students } = await adminDb
    .from('students')
    .select('email, id_number')

  const registeredEmails   = new Set((students || []).map((s: any) => s.email?.toLowerCase()))
  const registeredIdNums   = new Set((students || []).map((s: any) => s.id_number?.toLowerCase()))

  // Tag each code entry
  const tagged = (codes || []).map((c: any) => ({
    ...c,
    registered: registeredEmails.has(c.email?.toLowerCase()) || registeredIdNums.has(c.id_number?.toLowerCase()),
    expired:    !c.used && new Date(c.expires_at) < new Date(),
  }))

  // Unverified = requested a code but never completed registration
  const unverified = tagged.filter((c: any) => !c.registered)
  const verified   = tagged.filter((c: any) => c.registered)

  return NextResponse.json({ unverified, verified, total: tagged.length })
}
