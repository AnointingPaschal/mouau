import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createHash } from 'crypto'

function hashPassword(idNumber: string, password: string): string {
  return createHash('sha256').update(`${idNumber.toUpperCase()}:${password}`).digest('hex')
}

export async function PUT(req: NextRequest) {
  const { email, code, newPassword } = await req.json()
  if (!email || !code || !newPassword) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (newPassword.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

  const { data: verif } = await supabase
    .from('verification_codes').select('*').eq('email', email).eq('code', code).eq('used', false).single()

  if (!verif) return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 400 })
  if (new Date(verif.expires_at) < new Date()) return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 })

  const hash = hashPassword(verif.id_number, newPassword)
  await supabase.from('students').update({ password_hash: hash }).eq('id_number', verif.id_number)
  await supabase.from('verification_codes').update({ used: true }).eq('email', email)

  return NextResponse.json({ ok: true })
}
