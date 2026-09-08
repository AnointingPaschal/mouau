import { redirect } from 'next/navigation'

// /admin → redirect to /admin/auth (the actual login page)
export default function AdminRootPage() {
  redirect('/admin/auth')
}
