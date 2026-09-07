import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const DEFAULT_RULES = [
  { event_type:'comment',      label:'New Comment',        description:'Someone comments on your post',         channel_push:true,  channel_email:false, channel_inapp:true,  enabled:true  },
  { event_type:'reply',        label:'Comment Reply',       description:'Someone replies to your comment',        channel_push:true,  channel_email:false, channel_inapp:true,  enabled:true  },
  { event_type:'reaction',     label:'Post Reaction',       description:'Someone reacts to your post',            channel_push:false, channel_email:false, channel_inapp:true,  enabled:true  },
  { event_type:'announcement', label:'Announcement',        description:'Admin posts a new announcement',         channel_push:true,  channel_email:true,  channel_inapp:true,  enabled:true  },
  { event_type:'new_post',     label:'New Community Post',  description:'New post in community',                  channel_push:false, channel_email:false, channel_inapp:true,  enabled:false },
  { event_type:'library',      label:'New Library Upload',  description:'New study material uploaded',            channel_push:false, channel_email:false, channel_inapp:true,  enabled:false },
  { event_type:'event',        label:'Campus Event',        description:'New campus event or deadline added',     channel_push:true,  channel_email:false, channel_inapp:true,  enabled:true  },
  { event_type:'welcome',      label:'Welcome Message',     description:'Sent when a new student registers',      channel_push:false, channel_email:true,  channel_inapp:true,  enabled:true  },
]

export async function GET() {
  let { data, error } = await supabase.from('notification_rules').select('*').order('event_type')

  // Auto-seed if empty or table doesn't exist yet
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
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await supabase.from('notification_rules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  return NextResponse.json({ ok: true })
}
