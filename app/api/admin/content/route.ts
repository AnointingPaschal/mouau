import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await adminDb.from('site_content').select('*').order('label')
  return NextResponse.json({ data })
}
export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key, value } = await req.json()
  await adminDb.from('site_content').update({ value, updated_at: new Date().toISOString() }).eq('key', key)
  return NextResponse.json({ success: true })
}
