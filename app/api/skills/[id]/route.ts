import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/admin'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const [{ data: skill }, { data: nuggets }, { data: classes }] = await Promise.all([
    adminDb.from('skills').select('*').eq('id', params.id).single(),
    adminDb.from('skill_nuggets').select('*').eq('skill_id', params.id).order('sort_order'),
    adminDb.from('skill_classes').select('*').eq('skill_id', params.id).eq('active', true).order('date'),
  ])
  if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ skill, nuggets: nuggets || [], classes: classes || [] })
}
