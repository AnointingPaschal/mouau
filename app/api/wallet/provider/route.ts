import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  return createClient(url, key, { auth: { persistSession: false } })
}

const SERVICE_KEYS = [
  'service_airtime', 'service_data', 'service_cable', 'service_electricity',
  'service_betting', 'service_education', 'service_isp', 'service_recharge_pin',
  'service_sms', 'service_transfer', 'service_fund',
]

export async function GET() {
  const client = db()
  const { data } = await client.from('app_settings')
    .select('key,value')
    .in('key', ['payment_provider', ...SERVICE_KEYS])

  const map: Record<string, string> = {}
  for (const row of (data || [])) map[row.key] = row.value

  const provider = map['payment_provider'] === 'paystack' ? 'paystack' : 'flutterwave'
  const services: Record<string, boolean> = {}
  for (const k of SERVICE_KEYS) {
    services[k] = map[k] === undefined ? true : map[k] !== 'false'
  }

  return NextResponse.json({ provider, services })
}
