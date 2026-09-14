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

  // Strip fields that must NOT be in an UPDATE (primary key, timestamps set by DB)
  const { id: _id, created_at: _ca, ...updateFields } = body

  const { error } = await adminDb
    .from('skills')
    .update({ ...updateFields, updated_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) {
    console.error('Skills update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Re-fetch the updated row to return fresh data
  const { data } = await adminDb.from('skills').select('*').eq('id', params.id).single()
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await adminDb.from('skills').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
