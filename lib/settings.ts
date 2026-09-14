import { supabase } from './supabase'

type Settings = Record<string, string>
let cache: Settings | null = null
let cacheTime = 0
const TTL = 5_000 // 5 s — short enough to see updates right away

export async function getSettings(): Promise<Settings> {
  if (cache && Date.now() - cacheTime < TTL) return cache
  const { data } = await supabase.from('app_settings').select('key,value')
  const s: Settings = {}
  for (const row of (data || [])) s[row.key] = row.value
  cache = s
  cacheTime = Date.now()
  return s
}

export function clearSettingsCache() { cache = null; cacheTime = 0 }

export async function getSetting(key: string, fallback = ''): Promise<string> {
  const s = await getSettings()
  return s[key] ?? fallback
}
