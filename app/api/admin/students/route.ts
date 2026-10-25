import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/admin'

// Direct REST fetch — bypasses Supabase JS client and any URL encoding issues
async function fetchAllStudents() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\s+/g, '')
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

  const res = await fetch(
    `${url}/rest/v1/students?select=*&order=created_at.desc`,
    {
      headers: {
        apikey:          key,
        Authorization:   `Bearer ${key}`,
        'Range':         '0-9999',
        'Range-Unit':    'items',
      },
      cache: 'no-store',
    }
  )
  if (!res.ok) throw new Error(`Supabase REST error ${res.status}: ${await res.text()}`)
  return res.json() as Promise<any[]>
}

async function fetchPwaStudentIds() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\s+/g, '')
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  try {
    const res = await fetch(`${url}/rest/v1/push_subscriptions?select=student_id`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    })
    if (!res.ok) return new Set<string>()
    const data: any[] = await res.json()
    return new Set(data.map(r => String(r.student_id || '').trim().toLowerCase()).filter(Boolean))
  } catch { return new Set<string>() }
}

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() || ''
  const limit  = parseInt(searchParams.get('limit') || '0')

  try {
    const students = await fetchAllStudents()
    console.log(`[students] REST returned ${students.length} rows`)

    // Search mode
    if (search) {
      const q = search.toLowerCase()
      let results = students.filter((s: any) =>
        s.name?.toLowerCase().includes(q) ||
        s.id_number?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q)
      )
      if (limit > 0) results = results.slice(0, limit)
      return NextResponse.json({ data: results })
    }

    // Tag PWA
    const pwaSet = await fetchPwaStudentIds()
    const tagged = students.map((s: any) => ({
      ...s,
      pwa_installed: pwaSet.has(String(s.id_number || '').trim().toLowerCase()),
    }))

    return NextResponse.json({ data: tagged })
  } catch (e: any) {
    console.error('[students] fetch error:', e.message)
    return NextResponse.json({ error: e.message, data: [] }, { status: 500 })
  }
}
