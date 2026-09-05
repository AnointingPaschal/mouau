import { NextRequest, NextResponse } from 'next/server'

const KEY = process.env.SERPAPI_KEY || '849f0a81ddc2448e69ca10bb4d72bd0e067c94d127bcf168780a94cfaacaade9'

export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams
  const origin = p.get('origin')
  const destination = p.get('destination')
  const originId = p.get('origin_place_id')
  const destId = p.get('destination_place_id')
  if (!origin || !destination) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  try {
    let url = `https://serpapi.com/search.json?engine=google_maps_directions&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&api_key=${KEY}`
    if (originId) url += `&origin_place_id=${originId}`
    if (destId) url += `&destination_place_id=${destId}`
    const res = await fetch(url)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Directions unavailable' }, { status: 500 })
  }
}
