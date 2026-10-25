import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  return createClient(url, key, { auth: { persistSession: false } })
}

// POST /api/giveaway/claim — winner submits claim details
export async function POST(req: Request) {
  const { giveawayId, studentId, claimData } = await req.json()
  if (!giveawayId || !studentId) return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })

  const client = db()
  const { data: gw } = await client.from('giveaways').select('winner_id, winner_confirmed').eq('id', giveawayId).single()
  if (!gw || gw.winner_id !== studentId) return NextResponse.json({ ok: false, error: 'Not the winner' }, { status: 403 })

  await client.from('giveaway_entries').update({ claim_data: claimData, claim_submitted: true })
    .eq('giveaway_id', giveawayId).eq('student_id', studentId)

  return NextResponse.json({ ok: true })
}
