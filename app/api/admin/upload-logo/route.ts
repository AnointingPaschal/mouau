import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { clearSettingsCache } from '@/lib/settings'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('logo') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext  = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `logos/app-logo-${Date.now()}.${ext}`
    const buf  = Buffer.from(await file.arrayBuffer())

    // Delete old logo files first (best-effort)
    const { data: existing } = await supabase.storage.from('materials').list('logos')
    if (existing?.length) {
      await supabase.storage.from('materials').remove(existing.map(f => `logos/${f.name}`))
    }

    // Upload new logo
    const { error: uploadErr } = await supabase.storage
      .from('materials')
      .upload(path, buf, { contentType: file.type, upsert: true })

    if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path)

    // Save to app_settings
    await supabase.from('app_settings').upsert(
      {
        key: 'logo_url',
        value: publicUrl,
        category: 'branding',
        label: 'Logo URL',
        description: 'Uploaded app logo',
        is_secret: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )
    clearSettingsCache()

    return NextResponse.json({ ok: true, url: publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 })
  }
}
