import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'

// GET /api/admin/check-student?email=xxx&idNumber=yyy&name=zzz
// Checks if a student is also an admin by email OR idNumber OR name (any match)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email    = (searchParams.get('email') || '').toLowerCase().trim()
  const idNumber = (searchParams.get('idNumber') || '').toLowerCase().trim()
  const name     = (searchParams.get('name') || '').toLowerCase().trim()

  if (!email && !idNumber && !name) return NextResponse.json({ isAdmin: false })

  const adminDb = getAdminDb()

  // Fetch ALL active admins and match client-side (admins table is tiny)
  const { data: admins } = await adminDb
    .from('admins')
    .select('id,name,email,is_super,active,student_id')
    .eq('active', true)

  if (!admins || admins.length === 0) return NextResponse.json({ isAdmin: false })

  const match = admins.find((a: any) => {
    const aEmail    = (a.email      || '').toLowerCase().trim()
    const aName     = (a.name       || '').toLowerCase().trim()
    const aStuId    = (a.student_id || '').toLowerCase().trim()

    if (email    && aEmail  === email)    return true
    if (idNumber && aStuId  === idNumber) return true
    if (name     && aName   === name)     return true
    return false
  })

  if (!match) return NextResponse.json({ isAdmin: false })

  return NextResponse.json({
    isAdmin:  true,
    adminId:  match.id,
    name:     match.name,
    is_super: match.is_super,
  })
}
