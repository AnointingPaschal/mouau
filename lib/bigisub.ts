import { getAdminDb } from './adminDb'

// ── Bigisub API helper ────────────────────────────────────────
// Base: https://api.bigisub.ng
// Auth: Authorization: Token <your_token>
//
// IMPORTANT: token is stored as is_secret=true in app_settings.
// We must use the service-role client (adminDb) to read the real
// unmasked value — the anon client only returns '••••••••'.

export const BIGISUB_BASE = 'https://api.bigisub.ng'

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
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Bigisub API error ${res.status}: ${text}`)
  }
  return res.json()
}

export const bigi = {
  get:  (path: string)                => bigiRequest(path, 'GET'),
  post: (path: string, body: object)  => bigiRequest(path, 'POST', body),
}

// Unique reference generator
export function bigiRef(prefix = 'PDM') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

// ── Network ID mapping ────────────────────────────────────────
// Bigisub uses numeric network IDs: MTN=1, GLO=2, AIRTEL=3, 9MOBILE=4
export const NETWORK_IDS: Record<string, number> = {
  MTN: 1,
  GLO: 2,
  AIRTEL: 3,
  '9MOBILE': 4,
}

// ── Endpoints ─────────────────────────────────────────────────
// GET  /api/airtime/               – buy airtime (POST)
// GET  /api/data/                  – buy data
// GET  /api/databundles/?network=1 – list data bundles for a network
// GET  /api/cabletv/               – cable TV billers
// POST /api/cabletv/               – pay cable TV
// GET  /api/electricity/           – electricity billers
// POST /api/electricity/           – pay electricity
// GET  /api/education/             – education billers (WAEC, NECO)
// POST /api/education/             – buy result pin
// GET  /api/betting/               – betting platforms
// POST /api/betting/               – fund betting wallet
// GET  /api/internetservice/       – ISP billers
// POST /api/internetservice/       – buy ISP plan
