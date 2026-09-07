import { NextRequest, NextResponse } from 'next/server'
import { adminDb, getAdminFromRequest } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const view = url.searchParams.get('view') || 'posts'

  if (view === 'reports') {
    const { data } = await adminDb
      .from('forum_reports')
      .select('*, forum_posts(title, author, author_id, body)')
      .order('created_at', { ascending: false })
    return NextResponse.json({ data })
  }

  if (view === 'banned') {
    const { data } = await adminDb.from('banned_users').select('*').order('banned_at', { ascending: false })
    return NextResponse.json({ data })
  }

  // Default: all posts
  const { data } = await adminDb.from('forum_posts').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, type } = await req.json()

  if (type === 'post') {
    await adminDb.from('forum_comments').delete().eq('post_id', id)
    await adminDb.from('forum_reports').update({ status: 'reviewed' }).eq('post_id', id)
    await adminDb.from('forum_posts').delete().eq('id', id)
  } else if (type === 'comment') {
    await adminDb.from('forum_comment_replies').delete().eq('comment_id', id)
    await adminDb.from('forum_comments').delete().eq('id', id)
  }
  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  if (body.action === 'ban') {
    const { student_id, student_name, reason } = body
    await adminDb.from('banned_users').upsert({ student_id, student_name, reason, banned_by: admin.name, active: true })
    // Notify user
    await adminDb.from('notifications').insert({
      recipient_id: student_id, type: 'ban',
      title: 'Your account has been suspended',
      body: `Reason: ${reason}. Contact admin if you believe this is an error.`,
      post_id: '', actor: 'Admin', read: false
    })
    return NextResponse.json({ success: true })
  }

  if (body.action === 'unban') {
    await adminDb.from('banned_users').update({ active: false }).eq('student_id', body.student_id)
    await adminDb.from('notifications').insert({
      recipient_id: body.student_id, type: 'info',
      title: 'Your account has been reinstated',
      body: 'Your forum access has been restored.',
      post_id: '', actor: 'Admin', read: false
    })
    return NextResponse.json({ success: true })
  }

  if (body.action === 'warn') {
    const { student_id, student_name, message } = body
    await adminDb.from('notifications').insert({
      recipient_id: student_id, type: 'warning',
      title: `⚠️ Warning from Admin`,
      body: message || 'Please review our community guidelines.',
      post_id: '', actor: 'Admin', read: false
    })
    return NextResponse.json({ success: true })
  }

  if (body.action === 'dismiss_report') {
    await adminDb.from('forum_reports').update({ status: 'dismissed' }).eq('id', body.report_id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
