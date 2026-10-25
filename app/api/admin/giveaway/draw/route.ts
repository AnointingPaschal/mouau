import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  return createClient(url, key, { auth: { persistSession: false } })
}

// POST /api/admin/giveaway/draw — weighted random draw
export async function POST(req: Request) {
  const { giveawayId } = await req.json()
  if (!giveawayId) return NextResponse.json({ ok: false, error: 'Missing giveawayId' }, { status: 400 })

  const client = db()
  const { data: entries, error } = await client
    .from('giveaway_entries').select('student_id, student_name, entries').eq('giveaway_id', giveawayId)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  if (!entries || entries.length === 0) return NextResponse.json({ ok: false, error: 'No entries yet' }, { status: 400 })

  // Build weighted pool
  const pool: { student_id: string; student_name: string }[] = []
  for (const e of entries) {
    for (let i = 0; i < (e.entries || 1); i++) pool.push({ student_id: e.student_id, student_name: e.student_name })
  }
  const winner = pool[Math.floor(Math.random() * pool.length)]

  // Save pending winner (not yet confirmed)
  const { error: upErr } = await client.from('giveaways').update({
    winner_id: winner.student_id,
    winner_name: winner.student_name,
    winner_confirmed: false,
    updated_at: new Date().toISOString(),
  }).eq('id', giveawayId)
  if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, winner })
}
