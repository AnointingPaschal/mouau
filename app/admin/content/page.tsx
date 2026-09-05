'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import { Save, Loader2, CheckCircle2 } from 'lucide-react'

type Item = { id: string; key: string; value: string; label: string }

export default function ContentPage() {
  const { token } = useAdmin()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!token) return
    fetch('/api/admin/content', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        setItems(d.data || [])
        const e: Record<string, string> = {}
        d.data?.forEach((i: Item) => { e[i.key] = i.value })
        setEdits(e)
        setLoading(false)
      })
  }, [token])

  const save = async (key: string) => {
    setSaving(key)
    await fetch('/api/admin/content', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key, value: edits[key] })
    })
    setSaving(null); setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <AdminShell>
      <div className="p-5 lg:p-8 max-w-2xl">
        <div className="mb-6">
          <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest mb-1">ADMIN</p>
          <h1 className="text-xl font-black text-[#0a0a0a]">Site Content</h1>
          <p className="text-[#6b6b6b] text-sm mt-1">Edit all text displayed on the website. Changes are live immediately.</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.key} className="bg-white border border-[#e8e8e8] rounded-xl p-4">
                <label className="text-[10px] font-semibold text-[#aaa] uppercase tracking-widest block mb-2">{item.label}</label>
                {(edits[item.key] || '').length > 80 ? (
                  <textarea rows={3} value={edits[item.key] || ''} onChange={e => setEdits({ ...edits, [item.key]: e.target.value })}
                    className="w-full text-sm text-[#0a0a0a] border border-[#e8e8e8] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1a6b3a] resize-none transition-colors"/>
                ) : (
                  <input value={edits[item.key] || ''} onChange={e => setEdits({ ...edits, [item.key]: e.target.value })}
                    className="w-full text-sm text-[#0a0a0a] border border-[#e8e8e8] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1a6b3a] transition-colors"/>
                )}
                <div className="flex justify-end mt-2">
                  <button onClick={() => save(item.key)} disabled={saving === item.key}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${saved === item.key ? 'bg-[#1a6b3a]/10 text-[#1a6b3a]' : 'bg-[#0a0a0a] text-white hover:bg-[#1a6b3a]'}`}>
                    {saving === item.key ? <Loader2 className="w-3 h-3 animate-spin"/>
                     : saved === item.key ? <><CheckCircle2 className="w-3 h-3"/>Saved</>
                     : <><Save className="w-3 h-3"/>Save</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
