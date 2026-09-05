import { NextRequest, NextResponse } from 'next/server'
import { adminDb, hashPassword, generateToken } from '@/lib/admin'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    const { data: admin } = await adminDb.from('admins').select('*').eq('email', email.toLowerCase()).eq('active', true).single()
    if (!admin) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    if (admin.password_hash !== hashPassword(password)) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    await adminDb.from('admin_sessions').delete().lt('expires_at', new Date().toISOString())
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await adminDb.from('admin_sessions').insert({ admin_id: admin.id, token, expires_at: expiresAt })
    return NextResponse.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name, is_super: admin.is_super } })
  } catch { return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}
