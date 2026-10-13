import { getAdminDb } from './adminDb'

// ── Bigisub API v2.0.0 ───────────────────────────────────────
// Base URL : https://api.bigisub.ng
// Auth     : Authorization: Token <your_token>
// All paths confirmed from official API documentation.

export const BIGISUB_BASE = 'https://api.bigisub.ng'

export const BIGI_ENDPOINTS = {
  // ── Wallet ────────────────────────────────────────────────
  wallet:               '/api/v2/financial/wallet/balance/',       // GET (confirmed working)

  // ── Airtime ───────────────────────────────────────────────
  airtime:              '/api/v2/vtu/airtime/purchase/',            // POST

  // ── Data ──────────────────────────────────────────────────
  dataPlans:            '/api/v2/vtu/data/plans/',                  // GET ?network=<1-4>
  dataPurchase:         '/api/v2/vtu/data/purchase/',               // POST

  // ── Cable TV ──────────────────────────────────────────────
  cablePlans:           '/api/v2/vtu/cable/plans/',                 // GET ?cable_name=dstv
  cableVerify:          '/api/v2/vtu/cable/verify/',                // POST
  cablePurchase:        '/api/v2/vtu/cable/purchase/',              // POST

  // ── Recharge Pin ──────────────────────────────────────────
  rechargePinPlans:     '/api/v2/vtu/recharge-pin/plans/',          // GET
  rechargePinBuy:       '/api/v2/vtu/recharge-pin/purchase/',       // POST

  // ── Electricity ───────────────────────────────────────────
  electricityProviders: '/api/v2/bills/electricity/providers/',     // GET
  electricityVerify:    '/api/v2/bills/electricity/verify/',        // POST
  electricityBuy:       '/api/v2/bills/electricity/pay/',           // POST

  // ── Education / Result Checker ────────────────────────────
  educationPrices:      '/api/v2/bills/result-checker/prices/',     // GET
  educationBuy:         '/api/v2/bills/result-checker/purchase/',   // POST

  // ── ISP ───────────────────────────────────────────────────
  smilePlans:           '/api/v2/isp/smile/plans/',                 // GET
  smileVerify:          '/api/v2/isp/smile/verify/',                // POST
  smileTopup:           '/api/v2/isp/smile/topup/',                 // POST
  spectranetPlans:      '/api/v2/isp/spectranet/plans/',            // GET
  spectranetTopup:      '/api/v2/isp/spectranet/topup/',            // POST

  // ── Betting ───────────────────────────────────────────────
  bettingBillers:       '/api/v2/betting/billers/',                 // GET
  bettingProducts:      '/api/v2/betting/products/',                // GET ?biller_code=BET9JA
  bettingValidate:      '/api/v2/betting/validate/',                // POST
  bettingFund:          '/api/v2/betting/fund/',                    // POST

  // ── SMS ───────────────────────────────────────────────────
  smsPricing:           '/api/v2/communications/sms/pricing/',      // GET
  smsSend:              '/api/v2/communications/sms/send/',         // POST
}

// ── Network IDs (numeric, as required by v2 data/airtime endpoints) ──
export const NETWORK_IDS: Record<string, number> = {
  MTN: 1, GLO: 2, AIRTEL: 3, '9MOBILE': 4,
}

export async function getBigiToken(): Promise<string> {
  const adminDb = getAdminDb()
  const { data } = await adminDb
    .from('app_settings')
    .select('value')
    .eq('key', 'bigisub_api_token')
    .maybeSingle()
  const token = (data?.value || '').trim()
  if (!token) throw new Error('Bigisub API token not configured. Go to Admin → Bigisub Settings.')
  return token
}

async function bigiRequest(path: string, method = 'GET', body?: object) {
  const token = await getBigiToken()
  const res = await fetch(`${BIGISUB_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type':  'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const json = await res.json().catch(() => ({ error: res.statusText }))
  if (!res.ok) {
    const msg = json?.message || json?.detail || json?.error
      || (json?.errors ? JSON.stringify(json.errors) : null)
      || `HTTP ${res.status}`
    throw new Error(`Bigisub API error ${res.status}: ${msg}`)
  }
  return json
}

export const bigi = {
  get:  (path: string)               => bigiRequest(path, 'GET'),
  post: (path: string, body: object) => bigiRequest(path, 'POST', body),
}

export function bigiRef(prefix = 'PDM') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export function bigiSuccess(result: any): boolean {
  if (result?.success === true) return true
  const s = (result?.status || result?.data?.status || result?.Status || '').toLowerCase()
  return s.includes('success') || s.includes('successful')
}
