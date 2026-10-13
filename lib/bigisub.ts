import { getAdminDb } from './adminDb'

// ── Bigisub API v2 helper ─────────────────────────────────────
// Base URL : https://api.bigisub.ng
// Auth     : Authorization: Token <your_token>   (permanent, never expires)
// No PIN required for v2 endpoints — PIN was legacy v1 only.
//
// Token is stored as is_secret=true in app_settings.
// Must use the service-role client (adminDb) to read the unmasked value.

export const BIGISUB_BASE = 'https://api.bigisub.ng'

export const BIGI_ENDPOINTS = {
  // Wallet
  wallet:           '/api/v2/financial/wallet/balance/',   // GET
  // Airtime
  airtime:          '/api/v2/vtu/airtime/purchase/',        // POST
  // Data
  dataBundles:      '/api/v2/vtu/data/plans/',              // GET ?network=MTN
  dataPurchase:     '/api/v2/vtu/data/purchase/',           // POST
  // Cable TV
  cableVerify:      '/api/v2/vtu/cabletv/verify/',          // POST
  cablePurchase:    '/api/v2/vtu/cabletv/subscribe/',       // POST
  cablePlans:       '/api/v2/vtu/cabletv/plans/',           // GET ?cablename=DSTV
  // Electricity
  electricityList:  '/api/v2/vtu/electricity/',             // GET
  meterValidate:    '/api/v2/vtu/electricity/validate/',    // POST
  electricityBuy:   '/api/v2/electricity/purchase',         // POST
  // Education
  educationList:    '/api/v2/vtu/education/',               // GET
  educationBuy:     '/api/v2/education/purchase',           // POST
  // Betting
  bettingList:      '/api/v2/vtu/betting/',                 // GET
  bettingFund:      '/api/v2/betting/fund',                 // POST
  // ISP
  ispList:          '/api/v2/vtu/isp/',                     // GET
  ispBuy:           '/api/v2/vtu/isp/purchase/',            // POST
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

// Unique reference generator
export function bigiRef(prefix = 'PDM') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

// Network name mapping — v2 uses string names, not numeric IDs
export const NETWORK_NAMES: Record<string, string> = {
  MTN: 'MTN', GLO: 'GLO', AIRTEL: 'Airtel', '9MOBILE': '9mobile',
}

// Helper: extract success status from various Bigisub response shapes
export function bigiSuccess(result: any): boolean {
  if (result?.success === true) return true
  const s = (result?.status || result?.data?.status || result?.Status || '').toLowerCase()
  return s.includes('success') || s.includes('successful')
}
