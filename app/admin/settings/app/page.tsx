'use client'
import { useEffect, useState, useRef } from 'react'
import AdminShell from '@/components/AdminShell'
import { Save, Loader2, CheckCircle2, RefreshCw, Upload, X, ImageIcon } from 'lucide-react'
import { clearAppConfigCache } from '@/lib/useAppConfig'

const APP_KEYS = [
  { key:'site_name',        label:'Site Name',           desc:'App display name',                      icon:'📱', cat:'branding'  },
  { key:'site_tagline',     label:'Tagline',             desc:'Short description shown on login page', icon:'✏️', cat:'branding'  },
  { key:'contact_email',    label:'Contact Email',       desc:'Public support email for students',     icon:'📧', cat:'contact'   },
  { key:'contact_phone',    label:'Contact Phone',       desc:'Support phone number',                  icon:'📞', cat:'contact'   },
  { key:'contact_whatsapp', label:'WhatsApp Number',     desc:'WhatsApp number with country code',     icon:'💬', cat:'contact'   },
  { key:'university_name',  label:'University Name',     desc:'Full university name',                  icon:'🎓', cat:'contact'   },
  { key:'university_addr',  label:'University Address',  desc:'Campus address',                        icon:'📍', cat:'contact'   },
  { key:'seo_title',        label:'SEO Title',           desc:'Browser tab title for search engines',  icon:'🔍', cat:'seo'       },
  { key:'seo_description',  label:'SEO Description',     desc:'Meta description (150–160 characters)', icon:'📝', cat:'seo'       },
  { key:'seo_keywords',     label:'SEO Keywords',        desc:'Comma-separated keywords',              icon:'🏷️', cat:'seo'       },
  { key:'og_image',         label:'Social Preview Image',desc:'Image shown when sharing link (OG)',    icon:'🖼️', cat:'seo'       },
]

const CATS = [
  { id:'contact', label:'📞 Contact & Info', keys:['contact_email','contact_phone','contact_whatsapp','university_name','university_addr'] },
  { id:'seo',     label:'🔍 SEO & Social',   keys:['seo_title','seo_description','seo_keywords','og_image'] },
]

const DEFAULTS: Record<string,string> = {
  site_name:       'MOUAU FreshStart',
  site_tagline:    'Your official student companion for MOUAU',
  university_name: 'Michael Okpara University of Agriculture, Umudike',
  university_addr: 'Umudike, Abia State, Nigeria',
  seo_title:       'MOUAU FreshStart — Student Companion App',
  seo_description: 'Navigate MOUAU campus, access study materials, track your registration and connect with fellow students.',
}

/* ── Logo Upload sub-component ─────────────────────────────────────────────── */
function LogoUploader({ currentUrl, siteName, onUploaded }: {
  currentUrl: string
  siteName: string
  onUploaded: (url: string) => void
}) {
  const [preview,    setPreview]    = useState<string | null>(currentUrl || null)
  const [uploading,  setUploading]  = useState(false)
  const [error,      setError]      = useState('')
  const [drag,       setDrag]       = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setPreview(currentUrl || null) }, [currentUrl])

  const process = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024)    { setError('Image must be under 5 MB');    return }
    setError('')
    // local preview
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    // upload
    setUploading(true)
    const fd = new FormData()
    fd.append('logo', file)
    const r = await fetch('/api/admin/upload-logo', { method: 'POST', body: fd })
    const d = await r.json()
    setUploading(false)
    if (d.error) { setError(d.error); return }
    clearAppConfigCache()
    onUploaded(d.url)
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) process(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) process(file)
  }

  const initials = (siteName || 'PDM').substring(0, 2).toUpperCase()

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🖼️</span>
        <label className="text-xs font-bold text-[#0a0a0a]">App Logo</label>
        <span className="text-[9px] text-[#aaa] ml-auto">PNG, JPG, SVG · max 5 MB</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Preview circle */}
        <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-[#e8e8e8] bg-[#f9f9f7] flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <span className="text-[#0a0a0a] font-black text-xl">{initials}</span>
          )}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true)  }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all
            ${drag ? 'border-[#1a6b3a] bg-[#f0f9f4]' : 'border-[#e8e8e8] hover:border-[#1a6b3a] hover:bg-[#f9fffe]'}`}>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          {uploading ? (
            <Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-[#aaa]" />
          )}
          <p className="text-xs font-semibold text-[#0a0a0a]">
            {uploading ? 'Uploading…' : 'Tap or drag to upload'}
          </p>
          <p className="text-[10px] text-[#aaa]">Replaces the current logo everywhere</p>
        </div>

        {/* Clear */}
        {preview && !uploading && (
          <button onClick={() => { setPreview(null); onUploaded('') }}
            className="w-8 h-8 rounded-full border border-[#e8e8e8] flex items-center justify-center flex-shrink-0 hover:border-red-200 hover:bg-red-50 transition-colors">
            <X className="w-3.5 h-3.5 text-[#aaa] hover:text-red-400" />
          </button>
        )}
      </div>

      {error && <p className="text-[11px] text-red-500 mt-2">{error}</p>}
      {preview && !error && !uploading && (
        <p className="text-[10px] text-[#1a6b3a] mt-2 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Logo saved — visible on login, sidebar &amp; PWA
        </p>
      )}
    </div>
  )
}

/* ── Main Page ───────────────────────────────────────────────────────────────── */
export default function AppSettingsPage() {
  const [values,  setValues]  = useState<Record<string,string>>(DEFAULTS)
  const [edits,   setEdits]   = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/admin/settings')
    const { data } = await r.json()
    const v: Record<string,string> = { ...DEFAULTS }
    for (const row of (data || [])) v[row.key] = row.has_value ? row.value : (DEFAULTS[row.key] || '')
    setValues(v)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!Object.keys(edits).length) { showToast('No changes'); return }
    setSaving(true)
    for (const [key, value] of Object.entries(edits)) {
      const meta = APP_KEYS.find(k => k.key === key)
      await fetch('/api/admin/settings/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, category: meta?.cat || 'general', label: meta?.label || key, description: meta?.desc || '' })
      })
    }
    setSaving(false)
    setEdits({})
    setValues(v => ({ ...v, ...edits }))
    showToast('App settings saved!')
  }

  const currentLogo = edits['logo_url'] !== undefined ? edits['logo_url'] : (values['logo_url'] || '')
  const siteName    = edits['site_name'] !== undefined ? edits['site_name'] : (values['site_name'] || 'PDM MOUAU')

  return (
    <AdminShell>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6b3a]"/> {toast}
        </div>
      )}

      <div className="p-4 w-full pb-24 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
            <h1 className="font-black text-[#0a0a0a] text-2xl">App Settings</h1>
            <p className="text-xs text-[#6b6b6b] mt-0.5">Site info, branding, contacts &amp; SEO</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 rounded-xl border border-[#e8e8e8] hover:bg-[#f9f9f7]">
              <RefreshCw className="w-4 h-4 text-[#6b6b6b]"/>
            </button>
            <button onClick={save} disabled={saving || !Object.keys(edits).length}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white ${saving || !Object.keys(edits).length ? 'bg-[#1a6b3a]/40 cursor-not-allowed' : 'bg-[#1a6b3a] hover:bg-[#145530]'}`}>
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> Saving…</> : <><Save className="w-3.5 h-3.5"/> Save All</>}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[#1a6b3a] animate-spin"/></div>
        ) : (
          <>
            {/* ── Branding card with logo uploader ── */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-[#f9f9f7] border-b border-[#e8e8e8]">
                <h2 className="font-black text-[#0a0a0a] text-sm">🎨 Branding</h2>
              </div>
              <div className="divide-y divide-[#f5f5f5]">
                {/* Site name + tagline */}
                {['site_name', 'site_tagline'].map(k => {
                  const meta = APP_KEYS.find(x => x.key === k)!
                  const val  = edits[k] !== undefined ? edits[k] : (values[k] || '')
                  return (
                    <div key={k} className="px-4 py-3.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-base">{meta.icon}</span>
                        <label className="text-xs font-bold text-[#0a0a0a]">{meta.label}</label>
                        {edits[k] !== undefined && (
                          <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold ml-auto">Modified</span>
                        )}
                      </div>
                      <input value={val} onChange={e => setEdits(p => ({ ...p, [k]: e.target.value }))}
                        className="input w-full text-sm" placeholder={meta.desc}/>
                      <p className="text-[10px] text-[#aaa] mt-1">{meta.desc}</p>
                    </div>
                  )
                })}

                {/* Logo uploader */}
                <LogoUploader
                  currentUrl={currentLogo}
                  siteName={siteName}
                  onUploaded={url => {
                    setEdits(p => ({ ...p, logo_url: url }))
                    setValues(v => ({ ...v, logo_url: url }))
                  }}
                />
              </div>
            </div>

            {/* ── Other setting categories ── */}
            {CATS.map(cat => (
              <div key={cat.id} className="card overflow-hidden">
                <div className="px-4 py-3 bg-[#f9f9f7] border-b border-[#e8e8e8]">
                  <h2 className="font-black text-[#0a0a0a] text-sm">{cat.label}</h2>
                </div>
                <div className="divide-y divide-[#f5f5f5]">
                  {cat.keys.map(k => {
                    const meta = APP_KEYS.find(x => x.key === k)!
                    const val  = edits[k] !== undefined ? edits[k] : (values[k] || '')
                    return (
                      <div key={k} className="px-4 py-3.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">{meta.icon}</span>
                          <label className="text-xs font-bold text-[#0a0a0a]">{meta.label}</label>
                          {edits[k] !== undefined && (
                            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold ml-auto">Modified</span>
                          )}
                        </div>
                        {k === 'seo_description' || k === 'university_addr' ? (
                          <textarea rows={2} value={val} onChange={e => setEdits(p => ({ ...p, [k]: e.target.value }))}
                            className="input w-full resize-none text-sm" placeholder={meta.desc}/>
                        ) : (
                          <input value={val} onChange={e => setEdits(p => ({ ...p, [k]: e.target.value }))}
                            className="input w-full text-sm" placeholder={meta.desc}/>
                        )}
                        <p className="text-[10px] text-[#aaa] mt-1">{meta.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </AdminShell>
  )
}
