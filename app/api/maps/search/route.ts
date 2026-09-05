import { NextRequest, NextResponse } from 'next/server'

const KEY = process.env.SERPAPI_KEY || '849f0a81ddc2448e69ca10bb4d72bd0e067c94d127bcf168780a94cfaacaade9'

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')
  if (!q) return NextResponse.json({ local_results: [] })
  try {
    const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(q + ' MOUAU Umudike')}&ll=@5.4800,7.5455,15z&api_key=${KEY}`
    const res = await fetch(url)
    const data = await res.json()
    return NextResponse.json({ local_results: data.local_results || [] })
  } catch {
    return NextResponse.json({ local_results: [] })
  }
}
