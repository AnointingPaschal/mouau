import { getSettings } from './settings'

export async function getFlwKeys() {
  const s = await getSettings()
  const secretKey = (s.flw_secret_key || '').trim()
  const publicKey = (s.flw_public_key || '').trim()
  if (!secretKey) throw new Error('Flutterwave secret key not configured. Go to Admin → Flutterwave Settings.')
  return { secretKey, publicKey }
}

async function flwRequest(path: string, method = 'GET', body?: object) {
  const { secretKey } = await getFlwKeys()
  const res = await fetch(`https://api.flutterwave.com/v3${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return res.json()
}

export const flw = {
  get:  (path: string)                  => flwRequest(path, 'GET'),
  post: (path: string, body: object)    => flwRequest(path, 'POST', body),
}

// Unique reference generator
export function flwRef(prefix = 'PDM') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}
