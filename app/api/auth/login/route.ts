import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createHash } from 'crypto'

function hashPassword(idNumber: string, password: string): string {
  return createHash('sha256').update(`${idNumber.toUpperCase()}:${password}`).digest('hex')
}

export async function POST(req: NextRequest) {
  const { idNumber, password } = await req.json()
  if (!idNumber || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const id = idNumber.trim().toUpperCase()

  // Try primary id_number first, then matric_number (for freshers who added matric later)
  let student: any = null
  const { data: byId, error: e1 } = await supabase
    .from('students').select('*').eq('id_number', id).single()

  if (byId) {
    student = byId
  } else {
    // Try matric_number field (fresher who now has matric, or typo in format)
    const { data: byMatric } = await supabase
      .from('students').select('*').eq('matric_number', id).single()
    if (byMatric) student = byMatric
    else {
      // Try jamb_number (returning student who also stored JAMB)
      const { data: byJamb } = await supabase
        .from('students').select('*').eq('jamb_number', id).single()
      if (byJamb) student = byJamb
    }
  }

  if (!student) {
    return NextResponse.json({ error: 'No account found with this ID. Please register first.' }, { status: 404 })
  }

  if (!student.password_hash) {
    return NextResponse.json({ error: 'Account setup incomplete. Please register again or contact admin.' }, { status: 403 })
  }

  // Check if banned
  const { data: ban } = await supabase.from('banned_users')
    .select('reason').eq('student_id', student.id_number).eq('active', true).single()
  if (ban) {
    return NextResponse.json({ error: `Your account has been suspended. Reason: ${ban.reason}. Contact admin.` }, { status: 403 })
  }

  // Password check against primary id_number (registration key)
  const hash = hashPassword(student.id_number, password)
  if (hash !== student.password_hash) {
    return NextResponse.json({ error: 'Incorrect password. Try again or use Forgot Password.' }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    student: {
      id:           student.id,
      idNumber:     student.id_number,
      name:         student.name,
      email:        student.email || '',
      whatsapp:     student.whatsapp || '',
      department:   student.department || '',
      college:      student.college || '',
      level:        student.level || '100',
      avatar:       student.avatar_url || '',
      points:       student.points || 0,
      downloads:    student.downloads || 0,
      studentType:  student.student_type || 'fresher',
      jambNumber:   student.jamb_number || '',
      matricNumber: student.matric_number || '',
    }
  })
}
