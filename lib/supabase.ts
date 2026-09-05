import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabaseConfigured = Boolean(url && key)
export const supabase = supabaseConfigured
  ? createClient(url, key)
  : createClient('https://placeholder.supabase.co', 'placeholder', { auth: { persistSession: false } })
