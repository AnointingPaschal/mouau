import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  return createClient(url, key)
}

// GET /api/giveaway — get active giveaway
export async function GET() {
  const { data } = await db().from('giveaways')
    .select('id,title,description,prize_type,prize_label,prize_amount,tasks,claim_fields,entry_count,deadline,image_url,winner_id,winner_name,winner_confirmed,ended,active')
    .eq('active', true).limit(1).maybeSingle()
  return NextResponse.json({ giveaway: data || null })
}
