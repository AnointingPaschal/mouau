import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/admin'
import { supabase } from '@/lib/supabase'
import { clearSettingsCache } from '@/lib/settings'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('image') as File | null
  const slot = form.get('slot') as string | null
  if (!file || !slot) return NextResponse.json({ error: 'Missing file or slot' }, { status: 400 })

  const ext  = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `landing/${slot}-${Date.now()}.${ext}`
  const buf  = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from('materials').upload(path, buf, { contentType: file.type, upsert: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path)

  await supabase.from('app_settings').upsert(
    { key: slot, value: publicUrl, category: 'landing', label: slot, is_secret: false },
    { onConflict: 'key' }
  )

  clearSettingsCache()
  try { revalidatePath('/') } catch {}

  return NextResponse.json({ ok: true, url: publicUrl })
}
