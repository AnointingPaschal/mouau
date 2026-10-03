import { NextResponse } from 'next/server'
import { flw } from '@/lib/flutterwave'

let banksCache: any[] | null = null
let banksCacheTime = 0

export async function GET() {
  try {
    // Cache banks for 1 hour
    if (banksCache && Date.now() - banksCacheTime < 3_600_000) {
      return NextResponse.json({ banks: banksCache })
    }
    const result = await flw.get('/banks/NG')
    if (result.status === 'success') {
      banksCache = result.data || []
      banksCacheTime = Date.now()
      return NextResponse.json({ banks: banksCache })
    }
    return NextResponse.json({ error: result.message || 'Failed to fetch banks' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
