import { NextRequest, NextResponse } from 'next/server'
import { flw } from '@/lib/flutterwave'

export async function POST(req: NextRequest) {
  try {
    const { accountNumber, bankCode } = await req.json()
    if (!accountNumber || !bankCode)
      return NextResponse.json({ error: 'Missing accountNumber or bankCode' }, { status: 400 })

    const result = await flw.post('/accounts/resolve', {
      account_number: accountNumber,
      account_bank:   bankCode,
    })

    if (result.status === 'success') {
      return NextResponse.json({ accountName: result.data?.account_name })
    }
    return NextResponse.json({ error: result.message || 'Account not found' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
