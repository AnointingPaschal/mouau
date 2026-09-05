'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

type AdminUser = { id: string; email: string; name: string; is_super: boolean }
type AdminCtx = { admin: AdminUser|null; token: string|null; setAuth:(admin:AdminUser,token:string)=>void; logout:()=>void; loading:boolean }

const Ctx = createContext<AdminCtx>({ admin:null, token:null, setAuth:()=>{}, logout:()=>{}, loading:true })
export const useAdmin = () => useContext(Ctx)

export default function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser|null>(null)
  const [token, setToken] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const t = localStorage.getItem('admin_token')
    if (!t) { setLoading(false); if (pathname !== '/admin') router.replace('/admin'); return }
    fetch('/api/admin/me', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => {
        if (d.admin) { setAdmin(d.admin); setToken(t) }
        else { localStorage.removeItem('admin_token'); if (pathname !== '/admin') router.replace('/admin') }
        setLoading(false)
      })
      .catch(() => { setLoading(false); if (pathname !== '/admin') router.replace('/admin') })
  }, [pathname, router])

  const setAuth = (a: AdminUser, t: string) => {
    localStorage.setItem('admin_token', t)
    setAdmin(a); setToken(t)
  }
  const logout = () => {
    localStorage.removeItem('admin_token')
    setAdmin(null); setToken(null)
    router.replace('/admin')
  }

  return <Ctx.Provider value={{ admin, token, setAuth, logout, loading }}>{children}</Ctx.Provider>
}
