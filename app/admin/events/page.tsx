'use client'
import { useState, useEffect } from 'react'
import AdminShell from '@/components/AdminShell'
import { useAdmin } from '@/components/AdminProvider'
import {
  Plus, Loader2, Calendar, MapPin, Clock, Tag,
  Edit2, Trash2, Star, X, CheckCircle2, ChevronDown, AlertTriangle
} from 'lucide-react'
import { format, isPast } from 'date-fns'

type Event = {
  id: string; title: string; description: string; location: string;
  event_date: string; category: string; organizer: string;
  important: boolean; active: boolean; created_at: string
}

const CATS = ['academic', 'ceremony', 'social', 'sports', 'general', 'religious']
const CAT_COLORS: Record<string, string> = {
  academic: '#1a6b3a', ceremony: '#d97706', social: '#7c3aed',
  sports: '#2563eb', general: '#6b6b6b', religious: '#e11d48'
}

const blank = (): Partial<Event> => ({
  title: '', description: '', location: '', event_date: '', category: 'academic',
  organizer: '', important: false, active: true
})

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0a0a0a] text-white text-xs px-4 py-2.5 rounded-full flex items-center gap-2 z-50 shadow-xl">
      <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]" /> {msg}
    </div>
  )
}

function EventForm({ initial, token, onSave, onCancel }: {
  initial: Partial<Event>; token: string; onSave: () => void; onCancel: () => void
}) {
  const [form, setForm] = useState<Partial<Event>>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof Event, v: any) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.title?.trim()) { setError('Title is required'); return }
    if (!form.event_date) { setError('Date & time is required'); return }
    setSaving(true); setError('')
    const method = form.id ? 'PATCH' : 'POST'
    const body = form.id ? form : { ...form }
    const res = await fetch('/api/admin/events', {
      method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setSaving(false); return }
    setSaving(false); onSave()
  }

  const inputCls = "w-full border border-[#e8e8e8] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a6b3a] transition-colors bg-white"

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 p-4 border-b border-[#e8e8e8]">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">{form.id ? 'EDIT' : 'NEW'} EVENT</p>
            <h2 className="font-black text-[#0a0a0a]">{form.id ? 'Edit Event' : 'Create Event'}</h2>
          </div>
          <button onClick={onCancel}><X className="w-5 h-5 text-[#6b6b6b]" /></button>
        </div>
        <div className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5">Title *</label>
            <input value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="Event title" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5">Category</label>
              <select value={form.category || 'academic'} onChange={e => set('category', e.target.value)} className={inputCls}>
                {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5">Date & Time *</label>
              <input type="datetime-local" value={form.event_date ? form.event_date.slice(0, 16) : ''}
                onChange={e => set('event_date', new Date(e.target.value).toISOString())} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5">Location</label>
            <input value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="Where will it take place?" className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5">Organizer</label>
            <input value={form.organizer || ''} onChange={e => set('organizer', e.target.value)} placeholder="e.g. Academic Affairs" className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5">Description</label>
            <textarea value={form.description || ''} onChange={e => set('description', e.target.value)}
              placeholder="Event details..." rows={3} className={`${inputCls} resize-none`} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0a0a0a]">Mark as Important</p>
              <p className="text-[10px] text-[#aaa]">Shows star icon — for deadlines</p>
            </div>
            <button onClick={() => set('important', !form.important)}
              className={`w-11 h-6 rounded-full transition-all relative ${form.important ? 'bg-amber-400' : 'bg-[#e8e8e8]'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${form.important ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0a0a0a]">Active</p>
              <p className="text-[10px] text-[#aaa]">Visible to students</p>
            </div>
            <button onClick={() => set('active', !form.active)}
              className={`w-11 h-6 rounded-full transition-all relative ${form.active ? 'bg-[#1a6b3a]' : 'bg-[#e8e8e8]'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${form.active ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onCancel} className="flex-1 py-3 border border-[#e8e8e8] rounded-xl text-sm font-bold text-[#6b6b6b]">Cancel</button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-3 bg-[#1a6b3a] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {form.id ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminEventsPage() {
  const { token } = useAdmin()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Partial<Event> | null>(null)
  const [cat, setCat] = useState('all')
  const [toast, setToast] = useState('')

  const showToast = (m: string) => setToast(m)

  const load = async () => {
    if (!token) return
    const { data } = await fetch('/api/admin/events', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [token])

  const del = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await fetch('/api/admin/events', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id })
    })
    showToast('Event deleted')
    load()
  }

  const filtered = cat === 'all' ? events : events.filter(e => e.category === cat)
  const upcoming = filtered.filter(e => !isPast(new Date(e.event_date)))
  const past = filtered.filter(e => isPast(new Date(e.event_date)))

  return (
    <AdminShell>
      <div className="p-5 lg:p-8 max-w-3xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1">ADMIN</p>
            <h1 className="text-xl font-black text-[#0a0a0a]">Events Management</h1>
            <p className="text-[#6b6b6b] text-sm mt-1">{events.length} total events</p>
          </div>
          <button onClick={() => setForm(blank())}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1a6b3a] text-white rounded-xl font-bold text-sm">
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
          {['all', ...CATS].map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold capitalize transition-all ${cat === c ? 'bg-[#0a0a0a] text-white' : 'bg-white border border-[#e8e8e8] text-[#6b6b6b]'}`}>
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-3">UPCOMING ({upcoming.length})</p>
                <div className="space-y-2">
                  {upcoming.map(ev => <EventCard key={ev.id} ev={ev} onEdit={() => setForm(ev)} onDelete={() => del(ev.id)} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-3">PAST ({past.length})</p>
                <div className="space-y-2 opacity-60">
                  {past.slice(0, 5).map(ev => <EventCard key={ev.id} ev={ev} onEdit={() => setForm(ev)} onDelete={() => del(ev.id)} />)}
                </div>
              </div>
            )}
            {filtered.length === 0 && (
              <div className="bg-white border border-[#e8e8e8] rounded-2xl p-10 text-center">
                <Calendar className="w-8 h-8 text-[#e8e8e8] mx-auto mb-3" />
                <p className="font-bold text-[#0a0a0a] text-sm">No events</p>
                <p className="text-[#aaa] text-xs mt-1">Add your first event using the button above</p>
              </div>
            )}
          </div>
        )}
      </div>

      {form && (
        <EventForm initial={form} token={token || ''} onSave={() => { setForm(null); showToast(form.id ? 'Event updated!' : 'Event created!'); load() }} onCancel={() => setForm(null)} />
      )}
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
    </AdminShell>
  )
}

function EventCard({ ev, onEdit, onDelete }: { ev: Event; onEdit: () => void; onDelete: () => void }) {
  const color = CAT_COLORS[ev.category] || '#6b6b6b'
  return (
    <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden">
      <div className="flex items-stretch">
        <div className="w-12 flex flex-col items-center justify-center py-3 flex-shrink-0" style={{ background: color + '15' }}>
          <span className="text-[8px] font-bold uppercase" style={{ color }}>{format(new Date(ev.event_date), 'MMM')}</span>
          <span className="text-lg font-black text-[#0a0a0a] leading-tight">{format(new Date(ev.event_date), 'd')}</span>
        </div>
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            {ev.important && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0 mt-0.5" />}
            <p className="font-bold text-[#0a0a0a] text-sm leading-tight flex-1">{ev.title}</p>
            {!ev.active && <span className="text-[9px] bg-[#f0f0f0] text-[#aaa] px-2 py-0.5 rounded-full flex-shrink-0">Hidden</span>}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            <span className="text-[10px]" style={{ color }}>{ev.category}</span>
            {ev.location && <span className="flex items-center gap-1 text-[10px] text-[#aaa]"><MapPin className="w-2.5 h-2.5" />{ev.location}</span>}
            <span className="flex items-center gap-1 text-[10px] text-[#aaa]"><Clock className="w-2.5 h-2.5" />{format(new Date(ev.event_date), 'h:mm a')}</span>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-1 px-2 flex-shrink-0">
          <button onClick={onEdit} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f0f0f0]">
            <Edit2 className="w-3.5 h-3.5 text-[#6b6b6b]" />
          </button>
          <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  )
}
