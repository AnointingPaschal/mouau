import { NextResponse } from 'next/server'
import { ISP_PROVIDERS } from '@/lib/bigisub'

// No v2 list endpoint exists for ISP providers — return static list
export async function GET() {
  return NextResponse.json({ billers: ISP_PROVIDERS })
}
