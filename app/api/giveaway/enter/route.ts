import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  return createClient(url, key, { auth: { persistSession: false } })
}

// POST /api/giveaway/enter
export async function POST(req: Request) {
  const { giveawayId, studentId, studentName, studentEmail } = await req.json()
  if (!giveawayId || !studentId) return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })

  const client = db()

  // Verify giveaway is active
  const { data: gw } = await client.from('giveaways').select('active,ended').eq('id', giveawayId).single()
  if (!gw?.active || gw?.ended) return NextResponse.json({ ok: false, error: 'Giveaway is not active' }, { status: 400 })

  // Insert entry (ignore duplicate)
  const { error } = await client.from('giveaway_entries').insert({
    giveaway_id: giveawayId, student_id: studentId,
    student_name: studentName || '', student_email: studentEmail || '',
    entries: 1, tasks_done: [],
  })
  if (error && !error.message.includes('unique')) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  // Increment entry_count
  await client.rpc('increment_giveaway_entries', { gid: giveawayId }).catch(() =>
    client.from('giveaways').select('entry_count').eq('id', giveawayId).single().then(({ data }) =>
      client.from('giveaways').update({ entry_count: (data?.entry_count || 0) + 1 }).eq('id', giveawayId)
    )
  )

  return NextResponse.json({ ok: true })
}
