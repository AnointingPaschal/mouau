import { createClient } from '@supabase/supabase-js'

function adminDb() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  return createClient(url, key, { auth: { persistSession: false } })
}

async function getSecretKey(): Promise<string> {
  const { data } = await adminDb()
    .from('app_settings')
    .select('value')
    .eq('key', 'paystack_secret_key')
    .maybeSingle()
  return (data?.value || '').trim()
}

export async function paystackRequest(path: string, method = 'GET', body?: object) {
  const key = await getSecretKey()
  if (!key) throw new Error('Paystack secret key not configured')
  const res = await fetch(`https://api.paystack.co${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export function paystackRef(prefix = 'MOUAU') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export async function getActiveProvider(): Promise<'flutterwave' | 'paystack'> {
  const { data } = await adminDb()
    .from('app_settings')
    .select('value')
    .eq('key', 'payment_provider')
    .maybeSingle()
  return (data?.value === 'paystack') ? 'paystack' : 'flutterwave'
}

export async function isServiceEnabled(serviceKey: string): Promise<boolean> {
  const { data } = await adminDb()
    .from('app_settings')
    .select('value')
    .eq('key', serviceKey)
    .maybeSingle()
  if (!data) return true // default enabled if not set
  return data.value !== 'false'
}
