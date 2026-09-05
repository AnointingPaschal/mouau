import { createClient, SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let _adminDb: SupabaseClient | null = null

function getAdminDb(): SupabaseClient {
  if (!_adminDb) {
    const u = url || 'https://placeholder.supabase.co'
    const k = serviceKey || 'placeholder'
    _adminDb = createClient(u, k)
  }
  return _adminDb
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
