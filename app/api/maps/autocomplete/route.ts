import { NextRequest, NextResponse } from 'next/server'

const KEY = process.env.SERPAPI_KEY || '849f0a81ddc2448e69ca10bb4d72bd0e067c94d127bcf168780a94cfaacaade9'

export async function GET(req: NextRequest) {
  const input = new URL(req.url).searchParams.get('input')
  if (!input || input.length < 2) return NextResponse.json({ predictions: [] })
  try {
    // Bias results to MOUAU campus area (lat 5.48, lng 7.546, zoom 15)
    const url = `https://serpapi.com/search.json?engine=google_maps_autocomplete&input=${encodeURIComponent(input)}&ll=@5.4800,7.5455,15z&api_key=${KEY}`
    const res = await fetch(url, { next: { revalidate: 60 } })
    const data = await res.json()
    return NextResponse.json({ predictions: data.predictions || [] })
  } catch {
    return NextResponse.json({ predictions: [] })
  }
}
