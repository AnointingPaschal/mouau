import { supabase } from './supabase'

type Settings = Record<string, string>
let cache: Settings | null = null
let cacheTime = 0
const TTL = 60_000 // 1 minute

export async function getSettings(): Promise<Settings> {
  if (cache && Date.now() - cacheTime < TTL) return cache
  const { data } = await supabase.from('app_settings').select('key,value')
  const s: Settings = {}
  for (const row of (data || [])) s[row.key] = row.value
  cache = s
  cacheTime = Date.now()
  return s
}

export function clearSettingsCache() { cache = null }

export async function getSetting(key: string, fallback = ''): Promise<string> {
  const s = await getSettings()
  return s[key] || fallback
}
