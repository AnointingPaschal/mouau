import { NextRequest, NextResponse } from 'next/server'
import { flw } from '@/lib/flutterwave'

let cache: any = null
let cacheTime = 0

export async function GET(req: NextRequest) {
  try {
    if (cache && Date.now() - cacheTime < 3_600_000)
      return NextResponse.json(cache)

    const result = await flw.get('/bill-categories')
    if (result.status !== 'success')
      return NextResponse.json({ error: result.message || 'Failed to fetch' }, { status: 400 })

    cache = { categories: result.data || [] }
    cacheTime = Date.now()
    return NextResponse.json(cache)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
