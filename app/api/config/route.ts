import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/settings'

export async function GET() {
  const s = await getSettings()
  return NextResponse.json({
    firebase: {
      apiKey:            s.firebase_api_key             || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain:        s.firebase_auth_domain         || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId:         s.firebase_project_id          || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket:     s.firebase_storage_bucket      || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: s.firebase_messaging_sender_id || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId:             s.firebase_app_id              || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    vapidKey: s.firebase_vapid_key || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    siteName: s.site_name || 'MOUAU FreshStart',
    logoUrl:  s.logo_url  || '/icon-192.png',
  })
}
