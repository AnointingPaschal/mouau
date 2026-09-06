import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = new URL(req.url).searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'No URL' }, { status: 400 })

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) return NextResponse.json({ error: 'Fetch failed' }, { status: 400 })

    const type = res.headers.get('content-type') || 'application/octet-stream'
    const raw  = url.split('/').pop()?.split('?')[0] || 'download'
    const name = decodeURIComponent(raw)
    const ext  = name.includes('.') ? '' : '.pdf'

    return new NextResponse(res.body, {
      headers: {
        'Content-Type': type,
        'Content-Disposition': `attachment; filename="${name}${ext}"`,
        'Cache-Control': 'no-cache',
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}
