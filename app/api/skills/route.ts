import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase
    .from('skills')
    .select('id,title,tagline,category,level,duration,instructor,image_url,active,sort_order')
    .eq('active', true)
    .order('sort_order')
  return NextResponse.json({ data: data || [] })
}
