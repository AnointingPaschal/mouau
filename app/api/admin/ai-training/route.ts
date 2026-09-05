import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await adminDb.from('ai_training').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ data })
}
export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { question, answer, category } = await req.json()
  if (!question || !answer) return NextResponse.json({ error: 'Question and answer required' }, { status: 400 })
  const { error } = await adminDb.from('ai_training').insert({ question, answer, category: category||'general', active: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await req.json()
  await adminDb.from('ai_training').update(updates).eq('id', id)
  return NextResponse.json({ success: true })
}
export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await adminDb.from('ai_training').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
