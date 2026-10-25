import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'

// GET /api/admin/check-student?email=xxx&idNumber=yyy&name=zzz
// Returns { isAdmin, is_super } — used by student profile page
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email    = (searchParams.get('email')    || '').toLowerCase().trim()
  const idNumber = (searchParams.get('idNumber') || '').toLowerCase().trim()
  const name     = (searchParams.get('name')     || '').toLowerCase().trim()

  if (!email && !idNumber && !name) return NextResponse.json({ isAdmin: false })

  try {
    const adminDb = getAdminDb()

    // Select without student_id (may not exist in all deployments)
    const { data: admins, error } = await adminDb
      .from('admins')
      .select('id,name,email,is_super,active')
      .eq('active', true)

    if (error || !admins || admins.length === 0) {
      return NextResponse.json({ isAdmin: false, debug: error?.message })
    }

    const match = admins.find((a: any) => {
      const aEmail = (a.email || '').toLowerCase().trim()
      const aName  = (a.name  || '').toLowerCase().trim()

      // Match by email
      if (email && aEmail === email) return true

      // Match by idNumber stored in email field (some admins use ID as email key)
      if (idNumber && aEmail === idNumber) return true

      // Match by name (exact or contains)
      if (name && aName === name) return true
      if (name && aName.includes(name)) return true
      if (name && name.includes(aName) && aName.length > 3) return true

      return false
    })

    // Also try a student_id column if it exists
    if (!match) {
      // Try fetching with student_id column - gracefully handle if column missing
      const { data: withStudentId } = await adminDb
        .from('admins')
        .select('id,name,email,is_super,active,student_id')
        .eq('active', true)

      if (withStudentId) {
        const m2 = withStudentId.find((a: any) => {
          const aStuId = (a.student_id || '').toLowerCase().trim()
          if (idNumber && aStuId && aStuId === idNumber) return true
          if (email && aStuId && aStuId === email) return true
          return false
        })
        if (m2) {
          return NextResponse.json({ isAdmin: true, adminId: m2.id, name: m2.name, is_super: m2.is_super })
        }
      }

      return NextResponse.json({ isAdmin: false })
    }

    return NextResponse.json({
      isAdmin:  true,
      adminId:  match.id,
      name:     match.name,
      is_super: match.is_super,
    })
  } catch (e: any) {
    return NextResponse.json({ isAdmin: false, error: e.message })
  }
}
