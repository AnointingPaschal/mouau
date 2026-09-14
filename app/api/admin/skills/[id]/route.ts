import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAdminFromRequest } from '@/lib/admin'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const [{ data: skill }, { data: nuggets }, { data: classes }, { data: apps }] = await Promise.all([
    supabase.from('skills').select('*').eq('id', params.id).single(),
    supabase.from('skill_nuggets').select('*').eq('skill_id', params.id).order('sort_order'),
    supabase.from('skill_classes').select('*').eq('skill_id', params.id).order('created_at', { ascending: false }),
    supabase.from('skill_applications').select('*,students(name,email,department,level)').eq('skill_id', params.id).order('created_at', { ascending: false }),
  ])
  return NextResponse.json({ skill, nuggets: nuggets || [], classes: classes || [], applications: apps || [] })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { data } = await supabase.from('skills').update({ ...body, updated_at: new Date().toISOString() }).eq('id', params.id).select().single()
  return NextResponse.json({ data })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await supabase.from('skills').delete().eq('id', params.id)
  return NextResponse.json({ ok: true })
}
