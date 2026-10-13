import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'

// ── helpers ──────────────────────────────────────────────────
function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// ── GET  /api/admin/skills/resources?skill_id=xxx ─────────────
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return unauthorized()

  const skill_id = req.nextUrl.searchParams.get('skill_id')
  if (!skill_id) return NextResponse.json({ error: 'skill_id required' }, { status: 400 })

  const { data, error } = await adminDb
    .from('skill_resources')
    .select('*')
    .eq('skill_id', skill_id)
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

// ── POST /api/admin/skills/resources ─────────────────────────
export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return unauthorized()

  const body = await req.json()
  const { skill_id, title, type, content, url, thumbnail_url, description, class_id, sort_order } = body

  if (!skill_id || !title?.trim()) {
    return NextResponse.json({ error: 'skill_id and title are required' }, { status: 400 })
  }
  if (!['video', 'text', 'file', 'link'].includes(type)) {
    return NextResponse.json({ error: 'type must be video | text | file | link' }, { status: 400 })
  }

  const { data, error } = await adminDb
    .from('skill_resources')
    .insert({
      skill_id,
      title: title.trim(),
      type: type || 'text',
      content: content || '',
      url: url || '',
      thumbnail_url: thumbnail_url || '',
      description: description || '',
      class_id: class_id || null,
      sort_order: sort_order ?? 0,
      active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// ── PUT /api/admin/skills/resources ──────────────────────────
export async function PUT(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return unauthorized()

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // only allow safe fields
  const allowed = ['title','type','content','url','thumbnail_url','description','sort_order','active','class_id']
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in updates) patch[key] = updates[key]
  }

  const { data, error } = await adminDb
    .from('skill_resources')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// ── DELETE /api/admin/skills/resources ───────────────────────
export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return unauthorized()

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await adminDb.from('skill_resources').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
