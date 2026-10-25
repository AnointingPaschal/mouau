import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  return createClient(url, key, { auth: { persistSession: false } })
}

// POST /api/giveaway/task — mark a task done, award bonus entries
export async function POST(req: Request) {
  const { giveawayId, studentId, taskId, bonusEntries } = await req.json()
  if (!giveawayId || !studentId || !taskId) return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })

  const client = db()
  const { data: entry } = await client.from('giveaway_entries')
    .select('id, entries, tasks_done').eq('giveaway_id', giveawayId).eq('student_id', studentId).single()
  if (!entry) return NextResponse.json({ ok: false, error: 'Enter the giveaway first' }, { status: 400 })

  const done: string[] = entry.tasks_done || []
  if (done.includes(taskId)) return NextResponse.json({ ok: false, error: 'Task already completed' }, { status: 400 })

  done.push(taskId)
  const newEntries = (entry.entries || 1) + (bonusEntries || 1)
  await client.from('giveaway_entries').update({ tasks_done: done, entries: newEntries }).eq('id', entry.id)

  return NextResponse.json({ ok: true, entries: newEntries })
}
