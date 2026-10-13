import { getAdminDb } from './adminDb'

// ── Bigisub API helper ────────────────────────────────────────
// Base: https://api.bigisub.ng
// Auth: Authorization: Token <your_token>
// All transaction endpoints also require "pin": "<4-digit PIN>"
//
// IMPORTANT: both token & pin are stored as is_secret=true in app_settings.
// Must use the service-role client (adminDb) to read unmasked values.

export const BIGISUB_BASE = 'https://api.bigisub.ng'

// ── Correct v2 endpoint paths (from API docs) ─────────────────
export const BIGI_ENDPOINTS = {
  // Auth
  wallet:          '/api/v2/user/wallet/',           // GET — balance
  // Airtime
  airtime:         '/api/v2/vtu/airtime/purchase/',  // POST
  // Data
  dataBundles:     '/api/v2/vtu/data/plans/',        // GET ?network=1
  dataPurchase:    '/api/v2/vtu/data/purchase/',     // POST
  // Cable TV
  cablePlans:      '/api/v2/vtu/cabletv/plans/',     // GET ?cablename=1
  cablePurchase:   '/api/v2/vtu/cabletv/purchase/',  // POST
  cableVerify:     '/api/v2/vtu/cabletv/verify/',    // POST
  // Electricity
  electricityList: '/api/v2/vtu/electricity/',       // GET
  electricityBuy:  '/api/v2/vtu/electricity/purchase/', // POST
  // Education
  educationList:   '/api/v2/vtu/education/',         // GET
  educationBuy:    '/api/v2/vtu/education/purchase/',// POST
  // Betting
  bettingList:     '/api/v2/vtu/betting/',           // GET
  bettingFund:     '/api/v2/vtu/betting/fund/',      // POST
  // ISP
  ispList:         '/api/v2/vtu/isp/',               // GET
  ispBuy:          '/api/v2/vtu/isp/purchase/',      // POST
}

async function getSecretSetting(key: string): Promise<string> {
  const adminDb = getAdminDb()
  const { data } = await adminDb
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()
  return (data?.value || '').trim()
}

export async function getBigiToken(): Promise<string> {
  const token = await getSecretSetting('bigisub_api_token')
  if (!token) throw new Error('Bigisub API token not configured. Go to Admin → Bigisub Settings.')
  return token
}

export async function getBigiPin(): Promise<string> {
  const pin = await getSecretSetting('bigisub_pin')
  if (!pin) throw new Error('Bigisub transaction PIN not configured. Go to Admin → Bigisub Settings.')
  return pin
}

async function bigiRequest(path: string, method = 'GET', body?: object) {
  const token = await getBigiToken()
  const res = await fetch(`${BIGISUB_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  // Bigisub returns non-2xx for some errors but also returns JSON body with success:false
  const json = await res.json().catch(() => ({ error: res.statusText }))
  if (!res.ok) {
    const msg = json?.message || json?.detail || json?.error || `HTTP ${res.status}`
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

// ── Network ID mapping ────────────────────────────────────────
export const NETWORK_IDS: Record<string, number> = {
  MTN: 1, GLO: 2, AIRTEL: 3, '9MOBILE': 4,
}
