'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Student, getStudent, logout as doLogout } from '@/lib/auth'
import { useRouter, usePathname } from 'next/navigation'

type AuthContextType = {
  student: Student | null
  setStudent: (s: Student | null) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  student: null, setStudent: () => {}, logout: () => {}, loading: true
})

export function useAuth() { return useContext(AuthContext) }

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudentState] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const s = getStudent()
    setStudentState(s)
    setLoading(false)
    if (!s && pathname !== '/' && pathname !== '/login') {
      router.replace('/login')
    }
  }, [pathname, router])

  const setStudent = (s: Student | null) => setStudentState(s)

  const logout = () => {
    doLogout()
    setStudentState(null)
    router.replace('/login')
  }

  return (
    <AuthContext.Provider value={{ student, setStudent, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
