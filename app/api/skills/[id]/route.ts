import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/admin'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const [{ data: skill }, { data: nuggets }, { data: classes }] = await Promise.all([
    adminDb.from('skills').select('*').eq('id', params.id).single(),
    adminDb.from('skill_nuggets').select('*').eq('skill_id', params.id).order('sort_order'),
    adminDb.from('skill_classes').select('*').eq('skill_id', params.id).eq('active', true).order('date'),
  ])

  if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // skill_resources table may not exist yet — fetch separately and swallow the error
  const { data: resources } = await adminDb
    .from('skill_resources')
    .select('*')
    .eq('skill_id', params.id)
    .eq('active', true)
    .order('sort_order')

  // Patch new fields with safe defaults if schema-v5.sql hasn't run yet
  const patchedSkill = {
    ...skill,
    delivery_mode: skill.delivery_mode ?? 'physical',
    is_free:       skill.is_free       ?? true,
    price_note:    skill.price_note    ?? '',
  }

  return NextResponse.json({
    skill: patchedSkill,
    nuggets:   nuggets   || [],
    classes:   classes   || [],
    resources: resources || [],
  })
}
