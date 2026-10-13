import { NextResponse } from 'next/server'
import { BETTING_PLATFORMS } from '@/lib/bigisub'

// No v2 list endpoint exists for betting platforms — return static list
export async function GET() {
  return NextResponse.json({ billers: BETTING_PLATFORMS })
}
