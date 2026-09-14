import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const form    = await req.formData()
  const file    = form.get('image') as File | null
  const skillId = form.get('skill_id') as string | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext  = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `skills/${skillId || 'new'}-${Date.now()}.${ext}`
  const buf  = Buffer.from(await file.arrayBuffer())

  // Storage upload (public bucket, anon key is fine)
  const { error } = await supabase.storage.from('materials').upload(path, buf, { contentType: file.type, upsert: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path)

  // DB update uses adminDb (service role bypasses RLS)
  if (skillId) {
    const { error: dbErr } = await adminDb.from('skills')
      .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', skillId)
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, url: publicUrl })
}
