import { NextResponse } from 'next/server'
import { getBigiToken, BIGISUB_BASE, BIGI_ENDPOINTS } from '@/lib/bigisub'

// GET /api/admin/bigisub/balance
// Calls GET /api/v2/financial/wallet/balance/
// Response: { success, message, data: { id, username, email, full_name, balance, pending_amount,
//   referal_balance, user_type, reserved_account_number, bank_name, account_name } }
export async function GET() {
  try {
    const token = await getBigiToken()
    const res = await fetch(`${BIGISUB_BASE}${BIGI_ENDPOINTS.wallet}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type':  'application/json',
      },
      cache: 'no-store',
    })
    const json = await res.json().catch(() => ({ error: res.statusText }))
    if (!res.ok) {
      const msg = json?.message || json?.detail || json?.error || `HTTP ${res.status}`
      return NextResponse.json({ error: `Bigisub API error ${res.status}: ${msg}` }, { status: res.status })
    }
    // Pass the full data object so the UI can display username, bank details etc.
    return NextResponse.json({ balance: json?.data ?? json })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
