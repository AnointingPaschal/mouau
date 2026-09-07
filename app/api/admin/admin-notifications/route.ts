import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await adminDb
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, all } = await req.json()
  if (all) {
    await adminDb.from('admin_notifications').update({ read: true }).eq('read', false)
  } else if (id) {
    await adminDb.from('admin_notifications').update({ read: true }).eq('id', id)
  }
  return NextResponse.json({ success: true })
}
