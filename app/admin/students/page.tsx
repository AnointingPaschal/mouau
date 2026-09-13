'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Loader2, User, Search } from 'lucide-react'

type Student = { id:string; id_number:string; name:string; email:string; whatsapp:string; department:string; college:string; level:string; downloads:number; created_at:string }

export default function StudentsPage() {
  const { token } = useAdmin()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!token) return
    fetch('/api/admin/students', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setStudents(d.data||[]); setLoading(false) })
  }, [token])

  const filtered = students.filter(s =>
    !query || s.name?.toLowerCase().includes(query.toLowerCase()) ||
    s.id_number?.toLowerCase().includes(query.toLowerCase()) ||
    s.email?.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <AdminShell>
      <div className="p-5 lg:p-8 max-w-3xl">
        <div className="mb-6">
          <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest mb-1">ADMIN</p>
          <h1 className="text-xl font-black text-[#0a0a0a]">Registered Students</h1>
          <p className="text-[#6b6b6b] text-sm mt-1">{students.length} students registered on FreshStart.</p>
        </div>
        <div className="flex items-center border border-[#e8e8e8] rounded-lg px-3 py-2 bg-white mb-4">
          <Search className="w-3.5 h-3.5 text-[#aaa] mr-2"/>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, ID, or email..." className="flex-1 text-xs outline-none bg-transparent"/>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : (
          <div className="space-y-2">
            {filtered.length === 0 && <div className="card p-8 text-center"><p className="text-[#aaa] text-sm">No students found.</p></div>}
            {filtered.map(s => (
              <div key={s.id} className="bg-white border border-[#e8e8e8] rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 bg-[#f9f9f7] border border-[#e8e8e8] rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-[#aaa]"/>
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-4">
                  <div>
                    <p className="font-bold text-[#0a0a0a] text-sm truncate">{s.name || 'No name'}</p>
                    <p className="text-[#aaa] text-[10px] font-mono">{s.id_number}</p>
                  </div>
                  <div>
                    {s.email && <p className="text-[#6b6b6b] text-[10px] truncate">{s.email}</p>}
                    {s.whatsapp && <p className="text-[#6b6b6b] text-[10px]">{s.whatsapp}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
