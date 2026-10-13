import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/admin'   // service role — bypasses RLS

export async function GET() {
  const { data, error } = await adminDb
    .from('skills')
    .select('id,title,tagline,category,level,image_url,delivery_mode,is_free,price_note,active,sort_order')
    .eq('active', true)
    .order('sort_order')
  if (error) return NextResponse.json({ data: [], error: error.message })
  return NextResponse.json({ data: data || [] })
}
