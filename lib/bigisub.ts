import { getAdminDb } from './adminDb'

// ── Bigisub API v2 ───────────────────────────────────────────
// Base URL : https://api.bigisub.ng
// Auth     : Authorization: Token <your_token>
//
// CONFIRMED WORKING ENDPOINTS (probed live):
//   GET  /api/v2/financial/wallet/balance/         → balance
//   GET  /api/v2/vtu/data/plans/?network=<1-4>     → data plans (numeric network ID)
//   GET  /api/v2/vtu/cable/plans/                  → all 93 cable plans (filter client-side)
//   POST /api/v2/vtu/airtime/purchase/             → airtime
//   POST /api/v2/vtu/data/purchase/               → data
//
// NO v2 list endpoints exist for: electricity discos, betting, education, ISP
// Those are hardcoded below as static constants.

export const BIGISUB_BASE = 'https://api.bigisub.ng'

export const BIGI_ENDPOINTS = {
  wallet:        '/api/v2/financial/wallet/balance/',  // GET
  dataPlans:     '/api/v2/vtu/data/plans/',            // GET ?network=1|2|3|4
  cablePlans:    '/api/v2/vtu/cable/plans/',           // GET (all, filter client-side)
  airtime:       '/api/v2/vtu/airtime/purchase/',      // POST
  dataPurchase:  '/api/v2/vtu/data/purchase/',         // POST
  // Purchase endpoints (exact paths to be verified; use legacy-compatible fields)
  cablePurchase:    '/api/v2/vtu/cabletv/subscribe/',
  electricityBuy:   '/api/v2/vtu/electricity/purchase/',
  educationBuy:     '/api/v2/vtu/education/purchase/',
  bettingFund:      '/api/v2/vtu/betting/fund/',
  ispBuy:           '/api/v2/vtu/isp/purchase/',
}

// ── Network IDs (numeric, as required by v2 API) ─────────────
export const NETWORK_IDS: Record<string, number> = {
  MTN: 1, GLO: 2, AIRTEL: 3, '9MOBILE': 4,
}

// ── Static provider lists (no v2 list endpoints available) ───
export const ELECTRICITY_DISCOS = [
  { id: 'ikeja-electric',    name: 'Ikeja Electric (IKEDC)',       state: 'Lagos' },
  { id: 'eko-electric',      name: 'Eko Electric (EKEDC)',         state: 'Lagos' },
  { id: 'abuja-electric',    name: 'Abuja Electric (AEDC)',        state: 'Abuja/North' },
  { id: 'kano-electric',     name: 'Kano Electric (KEDCO)',        state: 'Kano' },
  { id: 'ibadan-electric',   name: 'Ibadan Electric (IBEDC)',      state: 'Ibadan' },
  { id: 'enugu-electric',    name: 'Enugu Electric (EEDC)',        state: 'Enugu/Southeast' },
  { id: 'ph-electric',       name: 'Port Harcourt Electric (PHED)', state: 'Rivers' },
  { id: 'jos-electric',      name: 'Jos Electric (JED)',           state: 'Plateau/North' },
  { id: 'kaduna-electric',   name: 'Kaduna Electric (KAEDCO)',     state: 'Kaduna' },
  { id: 'benin-electric',    name: 'Benin Electric (BEDC)',        state: 'Edo/Delta' },
  { id: 'yola-electric',     name: 'Yola Electric (YEDC)',         state: 'Adamawa' },
]

export const BETTING_PLATFORMS = [
  { id: 'bet9ja',     name: 'Bet9ja' },
  { id: 'sportybet',  name: 'SportyBet' },
  { id: 'betway',     name: 'Betway' },
  { id: 'bangbet',    name: 'BangBet' },
  { id: '1xbet',      name: '1xBet' },
  { id: 'nairabet',   name: 'NairaBet' },
  { id: 'betking',    name: 'BetKing' },
  { id: 'msport',     name: 'MSport' },
  { id: 'paripesa',   name: 'PariPesa' },
  { id: 'cloudbet',   name: 'CloudBet' },
]

export const EDUCATION_EXAMS = [
  { id: 'WAEC',    name: 'WAEC Result Checker',      price: 1000 },
  { id: 'NECO',    name: 'NECO Result Checker',      price: 1000 },
  { id: 'NABTEB',  name: 'NABTEB Result Checker',    price: 1000 },
  { id: 'NBAIS',   name: 'NBAIS Result Checker',     price: 1000 },
]

export const ISP_PROVIDERS = [
  { id: 'smile',      name: 'Smile',       plans: ['1GB-30days', '2GB-30days', '5GB-30days'] },
  { id: 'spectranet', name: 'Spectranet',  plans: ['5GB-30days', '10GB-30days'] },
  { id: 'swift',      name: 'Swift',       plans: ['5GB-30days', '10GB-30days'] },
]

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
