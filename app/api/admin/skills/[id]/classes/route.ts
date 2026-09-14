import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'
import { getSettings } from '@/lib/settings'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { data: cls, error } = await adminDb
    .from('skill_classes').insert({ ...body, skill_id: params.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (body.notify_students) {
    const { data: approved } = await adminDb
      .from('skill_applications').select('student_id').eq('skill_id', params.id).eq('status', 'approved')
    if (approved?.length) {
      const s = await getSettings()
      await adminDb.from('notifications').insert(
        approved.map((a: any) => ({
          recipient_id: a.student_id,
          type: 'skill_class',
          title: `Class Announced: ${body.title}`,
          body: `${body.date ? new Date(body.date).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' }) : ''} · ${body.location || ''}`,
          post_id: `/skills/${params.id}`,
          actor: s.site_name || 'PDM MOUAU',
          read: false,
        }))
      )
    }
  }
  return NextResponse.json({ ok: true, data: cls })
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await req.json()
  const { data, error } = await adminDb.from('skill_classes').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await adminDb.from('skill_classes').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
