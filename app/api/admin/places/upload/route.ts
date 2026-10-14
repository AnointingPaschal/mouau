import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/admin/places/upload
// FormData: files[] (images) or video (video file)
// Returns: { urls: string[] }
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const urls: string[] = []

    // Handle multiple image files
    const files = form.getAll('files') as File[]
    for (const file of files) {
      if (!file || !file.size) continue
      const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `places/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const buf  = Buffer.from(await file.arrayBuffer())

      const { error } = await supabase.storage
        .from('materials')
        .upload(path, buf, { contentType: file.type, upsert: false })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path)
      urls.push(publicUrl)
    }

    // Handle single video file
    const video = form.get('video') as File | null
    if (video && video.size) {
      const ext  = video.name.split('.').pop()?.toLowerCase() || 'mp4'
      const path = `places/videos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const buf  = Buffer.from(await video.arrayBuffer())

      const { error } = await supabase.storage
        .from('materials')
        .upload(path, buf, { contentType: video.type, upsert: false })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path)
      urls.push(publicUrl)
    }

    return NextResponse.json({ ok: true, urls })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 })
  }
}
