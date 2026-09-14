import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [{ data: skill }, { data: nuggets }, { data: classes }, { data: apps }] = await Promise.all([
    adminDb.from('skills').select('*').eq('id', params.id).single(),
    adminDb.from('skill_nuggets').select('*').eq('skill_id', params.id).order('sort_order'),
    adminDb.from('skill_classes').select('*').eq('skill_id', params.id).order('created_at', { ascending: false }),
    adminDb.from('skill_applications').select('*').eq('skill_id', params.id).order('created_at', { ascending: false }),
  ])
  return NextResponse.json({ skill, nuggets: nuggets || [], classes: classes || [], applications: apps || [] })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { data, error } = await adminDb.from('skills')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await adminDb.from('skills').delete().eq('id', params.id)
  return NextResponse.json({ ok: true })
}
