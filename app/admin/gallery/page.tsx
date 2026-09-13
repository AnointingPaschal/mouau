'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Loader2, CheckCircle2, Image as ImageIcon, X } from 'lucide-react'

type GalleryItem = { id:string; image_url:string; title:string; caption:string; sort_order:number; active:boolean }

export default function AdminGalleryPage() {
  const [items,   setItems]   = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [toast,   setToast]   = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({ image_url:'', title:'', caption:'', sort_order:'0' })
  const [file,    setFile]    = useState<File|null>(null)
  const [preview, setPreview] = useState('')

  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),3000)}

  const load=async()=>{
    setLoading(true)
    const{data}=await supabase.from('ministry_gallery').select('*').order('sort_order').order('created_at')
    setItems((data as GalleryItem[])||[])
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  const onFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]; if(!f) return
    setFile(f); setPreview(URL.createObjectURL(f))
  }

  const save=async()=>{
    setSaving(true)
    let url=form.image_url
    if(file){
      const ext=file.name.split('.').pop()
      const path=`gallery/${Date.now()}.${ext}`
      const{error}=await supabase.storage.from('materials').upload(path,file,{contentType:file.type})
      if(!error){const{data:{publicUrl}}=supabase.storage.from('materials').getPublicUrl(path);url=publicUrl}
    }
    if(!url){showToast('Add an image URL or upload a photo');setSaving(false);return}
    await supabase.from('ministry_gallery').insert({
      image_url:url, title:form.title, caption:form.caption,
      sort_order:parseInt(form.sort_order)||0, active:true
    })
    setSaving(false); setShowAdd(false); setFile(null); setPreview('')
    setForm({image_url:'',title:'',caption:'',sort_order:'0'})
    showToast('Image added to gallery'); load()
  }

  const toggle=async(item:GalleryItem)=>{
    await supabase.from('ministry_gallery').update({active:!item.active}).eq('id',item.id); load()
  }

  const del=async(id:string)=>{
    if(!confirm('Delete this image?')) return
    await supabase.from('ministry_gallery').delete().eq('id',id)
    showToast('Deleted'); load()
  }

  return (
    <AdminShell>
      {toast&&(<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5 text-green-400"/> {toast}</div>)}
      <div className="p-4 w-full pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <div><p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p><h1 className="font-black text-[#0a0a0a] text-2xl">Gallery</h1><p className="text-xs text-[#6b6b6b]">{items.length} images · {items.filter(i=>i.active).length} showing</p></div>
          <button onClick={()=>setShowAdd(true)} className="flex items-center gap-1.5 text-white text-xs font-bold px-3.5 py-2 rounded-xl pd-gradient"><Plus className="w-3.5 h-3.5"/> Add Image</button>
        </div>

        {loading?(<div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#1e3a8a]"/></div>):(
          <div className="grid grid-cols-2 gap-3">
            {items.map(item=>(
              <div key={item.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm ${!item.active?'opacity-50':''}`}>
                <div className="relative h-32">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                  {item.title&&<p className="absolute bottom-2 left-2 text-white text-[10px] font-bold leading-tight">{item.title}</p>}
                </div>
                <div className="flex items-center gap-1 p-2">
                  <button onClick={()=>toggle(item)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${item.active?'bg-[#1a6b3a]/10 text-[#1a6b3a]':'bg-[#f0f0f0] text-[#aaa]'}`}>
                    {item.active?'Visible':'Hidden'}
                  </button>
                  <button onClick={()=>del(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd&&(
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>!saving&&setShowAdd(false)}/>
          <div className="relative w-full max-w-md bg-white rounded-t-2xl p-5 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#e8e8e8] rounded-full mx-auto mb-4"/>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-[#0a0a0a]">Add Gallery Image</h2>
              {!saving&&<button onClick={()=>setShowAdd(false)} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>}
            </div>
            <div className="space-y-3">
              {/* Upload or URL */}
              <div className="border-2 border-dashed border-[#e8e8e8] rounded-xl p-4 text-center cursor-pointer hover:border-[#1e3a8a]/40 transition-colors"
                onClick={()=>document.getElementById('gf')?.click()}>
                <input id="gf" type="file" accept="image/*" className="hidden" onChange={onFile}/>
                {preview?(<img src={preview} alt="" className="w-full h-32 object-cover rounded-xl"/>):(
                  <><ImageIcon className="w-5 h-5 text-[#ddd] mx-auto mb-1.5"/><p className="text-xs text-[#aaa]">Tap to upload photo</p></>
                )}
              </div>
              <p className="text-[10px] text-[#aaa] text-center">— or paste image URL below —</p>
              <input value={form.image_url} onChange={e=>setForm(f=>({...f,image_url:e.target.value}))} className="input w-full text-sm" placeholder="https://... image URL"/>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="input w-full text-sm" placeholder="Title (e.g. Worship Session)"/>
              <input value={form.caption} onChange={e=>setForm(f=>({...f,caption:e.target.value}))} className="input w-full text-sm" placeholder="Caption (optional)"/>
              <div className="flex gap-2 pt-1">
                <button onClick={()=>setShowAdd(false)} disabled={saving} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">Cancel</button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 pd-gradient">
                  {saving?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:'Add to Gallery'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
