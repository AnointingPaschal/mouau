import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'

// GET /api/admin/check-student?email=xxx&idNumber=yyy
// Returns { isAdmin, adminId, name, is_super } — public enough to call from student profile
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email    = (searchParams.get('email') || '').toLowerCase().trim()
  const idNumber = (searchParams.get('idNumber') || '').toLowerCase().trim()

  if (!email && !idNumber) return NextResponse.json({ isAdmin: false })

  const adminDb = getAdminDb()

  // Check by email first, then by id_number stored in name field (some admins promoted from students)
  let query = adminDb.from('admins').select('id,name,email,is_super,active')
  if (email) {
    query = query.eq('email', email)
  }

  const { data } = await query.maybeSingle()

  if (!data || !data.active) return NextResponse.json({ isAdmin: false })

  return NextResponse.json({
    isAdmin:  true,
    adminId:  data.id,
    name:     data.name,
    is_super: data.is_super,
  })
}
