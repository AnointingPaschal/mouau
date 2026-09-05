import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await adminDb.from('announcements').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ data })
}
export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { title, body, type, pinned } = await req.json()
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  await adminDb.from('announcements').insert({ title, body, type: type||'info', pinned: !!pinned })
  return NextResponse.json({ success: true })
}
export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await req.json()
  await adminDb.from('announcements').update(updates).eq('id', id)
  return NextResponse.json({ success: true })
}
export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await adminDb.from('announcements').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
