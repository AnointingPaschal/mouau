import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/adminDb'

export async function GET() {
  try {
    const { data, error } = await getAdminDb()
      .from('api_errors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ errors: [] })
    return NextResponse.json({ errors: data || [] })
  } catch {
    return NextResponse.json({ errors: [] })
  }
}

export async function DELETE() {
  try {
    await getAdminDb()
      .from('api_errors')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // delete all rows
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
