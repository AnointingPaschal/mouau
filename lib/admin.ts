import { createClient, SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getAdminDb(): SupabaseClient {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const anonKey    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const k = serviceKey || anonKey

  if (!serviceKey) {
    // Log once so it appears in Vercel function logs
    console.error('[adminDb] SUPABASE_SERVICE_ROLE_KEY not set — falling back to anon key. RLS will apply.')
  }

  return createClient(u || 'https://placeholder.supabase.co', k || 'placeholder', {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export const adminDb = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getAdminDb()[prop as keyof SupabaseClient]
  }
})

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function verifyAdminToken(token: string) {
  if (!token) return null
  try {
    const { data } = await getAdminDb()
      .from('admin_sessions')
      .select('admin_id, expires_at, admins(id, email, name, is_super, active)')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()
    if (!data) return null
    const adminData = data.admins as unknown as { id: string; email: string; name: string; is_super: boolean; active: boolean }
    if (!adminData?.active) return null
    return adminData
  } catch {
    return null
  }
}

export async function getAdminFromRequest(req: Request) {
  const auth = req.headers.get('Authorization') || ''
  const token = auth.replace('Bearer ', '')
  return verifyAdminToken(token)
}
