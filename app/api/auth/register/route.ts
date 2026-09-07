import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createHash } from 'crypto'

function hashPassword(idNumber: string, password: string): string {
  return createHash('sha256').update(`${idNumber.toUpperCase()}:${password}`).digest('hex')
}

export async function POST(req: NextRequest) {
  const { idNumber, name, email, password, code } = await req.json()
  if (!idNumber || !name || !password || !code) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const id = idNumber.trim().toUpperCase()

  // Verify the email code is valid
  const { data: verif } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .eq('used', false)
    .single()

  if (!verif) return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 })
  if (new Date(verif.expires_at) < new Date()) return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 })

  // Final duplicate check
  const { data: dup } = await supabase.from('students')
    .select('id').or(`id_number.eq.${id},email.eq.${email}`).limit(1)
  if (dup?.length) return NextResponse.json({ error: 'Account already exists. Sign in instead.' }, { status: 409 })

  const hash = hashPassword(id, password)

  // Create account
  const { error } = await supabase.from('students').insert({
    id_number:     id,
    name:          name.trim(),
    email:         email,
    password_hash: hash,
    level:         '100',
    department:    '',
    whatsapp:      '',
    points:        0,
    downloads:     0,
    verified:      true,
  })

  if (error) return NextResponse.json({ error: 'Failed to create account: ' + error.message }, { status: 500 })

  // Mark code used
  await supabase.from('verification_codes').update({ used: true }).eq('email', email)

  return NextResponse.json({
    ok: true,
    student: { idNumber: id, name: name.trim(), email, department: '', level: '100', whatsapp: '', avatar: '', points: 0, downloads: 0 }
  })
}
