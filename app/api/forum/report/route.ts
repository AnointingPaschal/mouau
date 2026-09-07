import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { post_id, reporter_id, reason, details } = body
  if (!post_id || !reporter_id || !reason) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const { error } = await supabase.from('forum_reports').insert({
    post_id, reporter_id, reason, details: details || '', status: 'pending'
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
