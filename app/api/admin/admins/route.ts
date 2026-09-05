import { NextRequest, NextResponse } from 'next/server'
import { adminDb, hashPassword, getAdminFromRequest } from '@/lib/admin'
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin || !admin.is_super) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await adminDb.from('admins').select('id,email,name,is_super,active,created_at').order('created_at')
  return NextResponse.json({ data })
}
export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin || !admin.is_super) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { email, name, password, is_super } = await req.json()
  if (!email || !name || !password) return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  const { error } = await adminDb.from('admins').insert({ email: email.toLowerCase(), name, password_hash: hashPassword(password), is_super: !!is_super, active: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin || !admin.is_super) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, active, name } = await req.json()
  const updates: Record<string,unknown> = {}
  if (typeof active === 'boolean') updates.active = active
  if (name) updates.name = name
  await adminDb.from('admins').update(updates).eq('id', id)
  return NextResponse.json({ success: true })
}
export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin || !admin.is_super) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (id === admin.id) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  await adminDb.from('admins').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
