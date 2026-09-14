import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAdminFromRequest } from '@/lib/admin'
import { getSettings } from '@/lib/settings'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { application_id, status, student_id, skill_title } = await req.json()
  await supabase.from('skill_applications').update({ status }).eq('id', application_id)

  // Notify student of status change
  if (status === 'approved' || status === 'rejected') {
    const s = await getSettings()
    await supabase.from('notifications').insert({
      recipient_id: student_id,
      type: status === 'approved' ? 'skill_approved' : 'skill_class',
      title: status === 'approved' ? `You're in! Skill application approved` : 'Skill application update',
      body: status === 'approved'
        ? `Your application for "${skill_title}" has been approved. Watch for class announcements.`
        : `Your application for "${skill_title}" was not successful this time.`,
      post_id: `/skills/${params.id}`,
      actor: s.site_name || 'PDM MOUAU',
      read: false,
    })
  }
  return NextResponse.json({ ok: true })
}
