import { NextRequest, NextResponse } from 'next/server'

const KEY = process.env.SERPAPI_KEY || '849f0a81ddc2448e69ca10bb4d72bd0e067c94d127bcf168780a94cfaacaade9'

export async function GET(req: NextRequest) {
  const input = new URL(req.url).searchParams.get('input') || ''
  if (input.length < 2) return NextResponse.json({ predictions: [] })

  try {
    // SerpAPI Google Maps Autocomplete endpoint
    const url = `https://serpapi.com/search.json?engine=google_maps_autocomplete&input=${encodeURIComponent(input)}&ll=@5.4800,7.5455,15z&api_key=${KEY}`
    const res  = await fetch(url, { next: { revalidate: 0 } })
    const data = await res.json()

    // SerpAPI returns predictions with varying field names — normalise all variants
    const raw: any[] = data.predictions || data.autocomplete || data.results || []

    const predictions = raw.map((p: any) => ({
      description: p.description || p.title || p.name || '',
      place_id:    p.place_id   || p.data_id || '',
      structured_formatting: p.structured_formatting || {
        main_text:      p.title || p.name || (p.description || '').split(',')[0] || '',
        secondary_text: p.address || (p.description || '').split(',').slice(1).join(',').trim() || ''
      }
    })).filter((p: any) => p.description)

    return NextResponse.json({ predictions })
  } catch (e) {
    console.error('Autocomplete error:', e)
    return NextResponse.json({ predictions: [] })
  }
}
