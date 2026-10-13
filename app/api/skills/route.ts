import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/admin'

export async function GET() {
  // First try with new columns (after schema-v5.sql has been run)
  const { data, error } = await adminDb
    .from('skills')
    .select('id,title,tagline,category,level,image_url,delivery_mode,is_free,price_note,active,sort_order')
    .eq('active', true)
    .order('sort_order')

  if (error) {
    // New columns not yet in DB — fall back to base columns so skills still show
    const { data: fallback, error: fallbackError } = await adminDb
      .from('skills')
      .select('id,title,tagline,category,level,image_url,active,sort_order')
      .eq('active', true)
      .order('sort_order')

    if (fallbackError) {
      return NextResponse.json({ data: [], error: fallbackError.message })
    }
    // Patch missing fields with safe defaults
    const patched = (fallback || []).map((s: any) => ({
      ...s,
      delivery_mode: s.delivery_mode ?? 'physical',
      is_free: s.is_free ?? true,
      price_note: s.price_note ?? '',
    }))
    return NextResponse.json({ data: patched })
  }

  return NextResponse.json({ data: data || [] })
}
