'use client'
import { useState, useEffect } from 'react'

interface AppConfig {
  siteName: string
  logoUrl: string | null
}

// Module-level cache so the fetch only runs once per page load
let _cache: AppConfig | null = null
let _promise: Promise<AppConfig> | null = null

async function fetchConfig(): Promise<AppConfig> {
  if (_cache) return _cache
  if (!_promise) {
    _promise = fetch('/api/config')
      .then(r => r.json())
      .then(d => {
        const cfg: AppConfig = {
          siteName: d.siteName || 'Pneuma Domain MOUAU',
          logoUrl:  d.logoUrl && !d.logoUrl.includes('/icon-192.png') ? d.logoUrl : null,
        }
        _cache = cfg
        return cfg
      })
      .catch(() => ({
        siteName: 'Pneuma Domain MOUAU',
        logoUrl:  null,
      }))
  }
  return _promise
}

const DEFAULT: AppConfig = { siteName: 'Pneuma Domain MOUAU', logoUrl: null }

export function useAppConfig(): AppConfig {
  const [config, setConfig] = useState<AppConfig>(_cache || DEFAULT)

  useEffect(() => {
    if (_cache) { setConfig(_cache); return }
    fetchConfig().then(setConfig)
  }, [])

  return config
}

/** Call this after admin saves a new logo to bust the module cache */
export function clearAppConfigCache() {
  _cache   = null
  _promise = null
}
