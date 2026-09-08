import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createHash } from 'crypto'

function hashPassword(idNumber: string, password: string): string {
  return createHash('sha256').update(`${idNumber.toUpperCase()}:${password}`).digest('hex')
}

export async function POST(req: NextRequest) {
  const { idNumber, name, email, password, code, studentType, matricNumber, jambNumber } = await req.json()
  if (!idNumber || !name || !password || !code) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const id = idNumber.trim().toUpperCase()
  const type = studentType || (id.startsWith('MOUAU/') ? 'returning' : 'fresher')
  const matric = (matricNumber || (type === 'returning' ? id : '')).trim().toUpperCase()
  const jamb = (jambNumber || (type === 'fresher' ? id : '')).trim().toUpperCase()

  // Verify email code
  const { data: verif } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .eq('used', false)
    .single()

  if (!verif) return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 })
  if (new Date(verif.expires_at) < new Date()) return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 })

  // Duplicate check on id_number OR matric_number
  const { data: dup } = await supabase.from('students')
    .select('id').or(`id_number.eq.${id},email.eq.${email}${matric ? `,matric_number.eq.${matric}` : ''}`).limit(1)
  if (dup?.length) return NextResponse.json({ error: 'Account already exists. Sign in instead.' }, { status: 409 })

  const hash = hashPassword(id, password)
  const defaultLevel = type === 'returning' ? '200' : '100'

  const { error } = await supabase.from('students').insert({
    id_number:     id,
    name:          name.trim(),
    email:         email,
    password_hash: hash,
    level:         defaultLevel,
    department:    '',
    whatsapp:      '',
    points:        0,
    downloads:     0,
    verified:      true,
    student_type:  type,
    jamb_number:   jamb,
    matric_number: matric,
    semester:      '1st',
  })

  if (error) return NextResponse.json({ error: 'Failed to create account: ' + error.message }, { status: 500 })

  // Mark code used
  await supabase.from('verification_codes').update({ used: true }).eq('email', email)

  // Admin notification for new user
  await supabase.from('admin_notifications').insert({
    type: 'new_user',
    title: `New ${type === 'returning' ? 'Returning' : 'Fresher'} Registered`,
    body: `${name.trim()} (${id}) joined as ${type === 'returning' ? 'returning student' : 'new fresher'}`,
    data: { student_id: id, student_type: type }
  })

  return NextResponse.json({
    ok: true,
    student: {
      idNumber: id, name: name.trim(), email,
      department: '', level: defaultLevel, whatsapp: '',
      avatar: '', points: 0, downloads: 0,
      studentType: type, jambNumber: jamb, matricNumber: matric
    }
  })
}
