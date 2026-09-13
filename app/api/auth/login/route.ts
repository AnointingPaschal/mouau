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

  const { data: student, error } = await supabase
    .from('students')
    .select('*')
    .eq('id_number', id)
    .single()

  if (error || !student) {
    return NextResponse.json({ error: 'No account found with this ID. Please register first.' }, { status: 404 })
  }

  if (!student.password_hash) {
    return NextResponse.json({ error: 'Account setup incomplete. Please register again or contact admin.' }, { status: 403 })
  }

  const hash = hashPassword(id, password)
  if (hash !== student.password_hash) {
    return NextResponse.json({ error: 'Incorrect password. Try again or use Forgot Password.' }, { status: 401 })
  }

  // Return safe student data
  return NextResponse.json({
    ok: true,
    student: {
      id:         student.id,
      idNumber:   student.id_number,
      name:       student.name,
      email:      student.email || '',
      whatsapp:   student.whatsapp || '',
      department: student.department || '',
      level:      student.level || '100',
      avatar:     student.avatar_url || '',
      points:     student.points || 0,
      downloads:  student.downloads || 0,
    }
  })
}
