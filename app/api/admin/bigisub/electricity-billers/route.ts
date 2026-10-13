import { NextResponse } from 'next/server'
import { ELECTRICITY_DISCOS } from '@/lib/bigisub'

// No v2 list endpoint exists for electricity discos — return static list
export async function GET() {
  return NextResponse.json({ billers: ELECTRICITY_DISCOS })
}
