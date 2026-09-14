import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAdminFromRequest } from '@/lib/admin'

// Rules matching actual app features
const DEFAULT_RULES = [
  { event_type:'announcement',        label:'New Announcement',           description:'Admin broadcasts a campus announcement to all students',        channel_push:true,  channel_email:true,  channel_inapp:true,  enabled:true  },
  { event_type:'library_approved',    label:'Library Request Approved',   description:'Student\'s material request has been approved — ready for pickup', channel_push:true,  channel_email:false, channel_inapp:true,  enabled:true  },
  { event_type:'library_available',   label:'New Study Material',         description:'New past questions, notes or project files added to library',    channel_push:true,  channel_email:false, channel_inapp:true,  enabled:true  },
  { event_type:'library_pickup',      label:'Sunday Pickup Reminder',     description:'Remind approved students to collect their materials on Sunday',   channel_push:true,  channel_email:false, channel_inapp:true,  enabled:true  },
  { event_type:'event_new',           label:'New Campus Event',           description:'New event added to the campus events calendar',                  channel_push:true,  channel_email:false, channel_inapp:true,  enabled:true  },
  { event_type:'pdm_event',           label:'PDM Program Announced',      description:'Pneuma Domain Ministry event, program or service announced',      channel_push:true,  channel_email:false, channel_inapp:true,  enabled:true  },
  { event_type:'skill_class',         label:'Skill Class Announced',      description:'A new skill acquisition class has been scheduled',               channel_push:true,  channel_email:false, channel_inapp:true,  enabled:true  },
  { event_type:'skill_approved',      label:'Skill Application Approved', description:'Student has been approved to join a skill class',                channel_push:true,  channel_email:false, channel_inapp:true,  enabled:true  },
  { event_type:'welcome',             label:'Welcome New Student',        description:'Sent when a new student creates an account',                     channel_push:false, channel_email:true,  channel_inapp:true,  enabled:true  },
  { event_type:'forum_reply',         label:'Forum Reply',                description:'Someone replied to your community forum post',                   channel_push:true,  channel_email:false, channel_inapp:true,  enabled:true  },
  { event_type:'forum_reaction',      label:'Forum Reaction',             description:'Someone reacted to your forum post',                             channel_push:false, channel_email:false, channel_inapp:true,  enabled:true  },
  { event_type:'registration_update', label:'Registration Guide Update',  description:'Registration steps or guidance has been updated',                channel_push:true,  channel_email:false, channel_inapp:false, enabled:false },
]

export async function GET() {
  let { data, error } = await supabase.from('notification_rules').select('*').order('event_type')
  if (error || !data?.length) {
    for (const rule of DEFAULT_RULES) {
      await supabase.from('notification_rules').upsert(rule, { onConflict: 'event_type' })
    }
    const refetch = await supabase.from('notification_rules').select('*').order('event_type')
    data = refetch.data
  }
  return NextResponse.json({ data: data || DEFAULT_RULES })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body
  const { data } = await supabase.from('notification_rules').update(updates).eq('id', id).select().single()
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { data, error } = await supabase.from('notification_rules').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await supabase.from('notification_rules').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
