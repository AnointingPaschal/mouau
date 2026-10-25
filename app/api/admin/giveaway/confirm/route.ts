import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  return createClient(url, key, { auth: { persistSession: false } })
}

// POST /api/admin/giveaway/confirm — confirm winner and optionally credit wallet
export async function POST(req: Request) {
  const { giveawayId } = await req.json()
  if (!giveawayId) return NextResponse.json({ ok: false, error: 'Missing giveawayId' }, { status: 400 })

  const client = db()

  // Fetch giveaway
  const { data: giveaway, error: gErr } = await client.from('giveaways').select('*').eq('id', giveawayId).single()
  if (gErr || !giveaway) return NextResponse.json({ ok: false, error: 'Giveaway not found' }, { status: 404 })
  if (!giveaway.winner_id) return NextResponse.json({ ok: false, error: 'No winner drawn yet' }, { status: 400 })

  // Credit wallet if prize_type is 'wallet'
  if (giveaway.prize_type === 'wallet' && giveaway.prize_amount > 0) {
    const { data: wallet } = await client.from('wallets').select('id, balance').eq('student_id', giveaway.winner_id).single()
    if (wallet) {
      const newBal = Number(wallet.balance || 0) + Number(giveaway.prize_amount)
      await client.from('wallets').update({ balance: newBal }).eq('id', wallet.id)
      await client.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        student_id: giveaway.winner_id,
        type: 'credit',
        amount: Number(giveaway.prize_amount),
        description: `Giveaway prize: ${giveaway.title}`,
        status: 'success',
        reference: `GW-${giveawayId}-${Date.now()}`,
      })
    }
  }

  // Mark confirmed + ended + inactive
  const { error: upErr } = await client.from('giveaways').update({
    winner_confirmed: true,
    ended: true,
    active: false,
    updated_at: new Date().toISOString(),
  }).eq('id', giveawayId)
  if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
