import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { skill_id, student_id, student_name, student_phone, matric_number, motivation } = await req.json()
  if (!skill_id || !student_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Check existing application
  const { data: existing } = await supabase
    .from('skill_applications')
    .select('id,status')
    .eq('skill_id', skill_id)
    .eq('student_id', student_id)
    .single()
  if (existing) return NextResponse.json({ error: 'Already applied', status: existing.status }, { status: 409 })

  const { data, error } = await supabase.from('skill_applications').insert({
    skill_id, student_id, student_name, student_phone, matric_number, motivation, status: 'pending'
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get('student_id')
  if (!studentId) return NextResponse.json({ data: [] })
  const { data } = await supabase
    .from('skill_applications')
    .select('skill_id,status,created_at')
    .eq('student_id', studentId)
  return NextResponse.json({ data: data || [] })
}
