'use client'
import { useEffect, useState } from 'react'
import AdminShell from '@/components/AdminShell'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Edit2, Loader2, CheckCircle2, X, Save, Play, Image as ImageIcon } from 'lucide-react'

type Video = { id:string; title:string; youtube_url:string; thumbnail_url:string; description:string; sort_order:number; active:boolean }
type GImg  = { id:string; image_url:string; title:string; caption:string; sort_order:number; active:boolean }

export default function AdminPDMPage() {
  const [tab,      setTab]      = useState<'gallery'|'videos'>('gallery')
  const [gallery,  setGallery]  = useState<GImg[]>([])
  const [videos,   setVideos]   = useState<Video[]>([])
  const [loading,  setLoading]  = useState(true)
  const [toast,    setToast]    = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [imgForm,  setImgForm]  = useState({ image_url:'', title:'', caption:'' })
  const [vidForm,  setVidForm]  = useState({ title:'', youtube_url:'', description:'' })

  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),3000)}

  const load=async()=>{
    setLoading(true)
    const[g,v]=await Promise.all([
      supabase.from('ministry_gallery').select('*').order('sort_order').order('created_at'),
      supabase.from('ministry_videos').select('*').order('sort_order').order('created_at'),
    ])
    setGallery((g.data as GImg[])||[])
    setVideos((v.data as Video[])||[])
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  const saveImage=async()=>{
    if(!imgForm.image_url.trim()){showToast('Enter image URL');return}
    setSaving(true)
    await supabase.from('ministry_gallery').insert({image_url:imgForm.image_url,title:imgForm.title,caption:imgForm.caption,sort_order:0,active:true})
    setSaving(false);setShowForm(false);setImgForm({image_url:'',title:'',caption:''});showToast('Image added');load()
  }

  const saveVideo=async()=>{
    if(!vidForm.title||!vidForm.youtube_url){showToast('Title and URL required');return}
    setSaving(true)
    await supabase.from('ministry_videos').insert({title:vidForm.title,youtube_url:vidForm.youtube_url,description:vidForm.description,sort_order:0,active:true})
    setSaving(false);setShowForm(false);setVidForm({title:'',youtube_url:'',description:''});showToast('Video added');load()
  }

  const toggleImg=async(id:string,active:boolean)=>{ await supabase.from('ministry_gallery').update({active:!active}).eq('id',id); load() }
  const delImg  =async(id:string)=>{ if(!confirm('Delete?')) return; await supabase.from('ministry_gallery').delete().eq('id',id); load() }
  const toggleVid=async(id:string,active:boolean)=>{ await supabase.from('ministry_videos').update({active:!active}).eq('id',id); load() }
  const delVid  =async(id:string)=>{ if(!confirm('Delete?')) return; await supabase.from('ministry_videos').delete().eq('id',id); load() }

  const getYTId=(url:string)=>{ const m=url.match(/(?:v=|youtu\.be\/)([^"&?\/\s]{11})/i); return m?m[1]:null }

  return (
    <AdminShell>
      {toast&&(<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5 text-green-400"/> {toast}</div>)}
      <div className="p-4 w-full pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <div><p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p><h1 className="font-black text-[#0a0a0a] text-2xl">PDM Content</h1></div>
          <button onClick={()=>setShowForm(true)} className="flex items-center gap-1.5 text-white text-xs font-bold px-3.5 py-2 rounded-xl" style={{background:'linear-gradient(135deg,#1e3a8a,#b91c1c)'}}>
            <Plus className="w-3.5 h-3.5"/> Add
          </button>
        </div>

        <div className="flex bg-[#f9f9f7] rounded-xl p-1 gap-1">
          {(['gallery','videos'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${tab===t?'bg-white text-[#0a0a0a] shadow-sm':'text-[#aaa]'}`}>
              {t==='gallery'?<><ImageIcon className="w-3.5 h-3.5"/> Gallery</>:<><Play className="w-3.5 h-3.5"/> Videos</>}
            </button>
          ))}
        </div>

        {loading?(<div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#1e3a8a]"/></div>):
        tab==='gallery'?(
          <div className="grid grid-cols-2 gap-3">
            {gallery.map(img=>(
              <div key={img.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm ${!img.active?'opacity-50':''}`}>
                <div className="relative h-28"><img src={img.image_url} alt="" className="w-full h-full object-cover"/>
                  {img.title&&<div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2"><p className="text-white text-[9px] font-bold">{img.title}</p></div>}
                </div>
                <div className="flex gap-1 p-2">
                  <button onClick={()=>toggleImg(img.id,img.active)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold ${img.active?'bg-[#1a6b3a]/10 text-[#1a6b3a]':'bg-[#f0f0f0] text-[#aaa]'}`}>{img.active?'Visible':'Hidden'}</button>
                  <button onClick={()=>delImg(img.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            ))}
          </div>
        ):(
          <div className="space-y-2">
            {videos.map(v=>{
              const id=getYTId(v.youtube_url)
              return (
                <div key={v.id} className={`card p-3 ${!v.active?'opacity-50':''}`}>
                  <div className="flex gap-3 items-start">
                    {id&&<img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt="" className="w-20 h-14 rounded-xl object-cover flex-shrink-0"/>}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0a0a0a] text-sm line-clamp-1">{v.title}</p>
                      {v.description&&<p className="text-[10px] text-[#aaa] line-clamp-1 mt-0.5">{v.description}</p>}
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      <button onClick={()=>toggleVid(v.id,v.active)} className={`p-1.5 rounded-lg text-[10px] font-bold ${v.active?'bg-[#1a6b3a]/10 text-[#1a6b3a]':'bg-[#f0f0f0] text-[#aaa]'}`}>{v.active?'●':'○'}</button>
                      <button onClick={()=>delVid(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showForm&&(
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>!saving&&setShowForm(false)}/>
          <div className="relative w-full max-w-md bg-white rounded-t-2xl p-5 animate-slide-up">
            <div className="w-10 h-1 bg-[#e8e8e8] rounded-full mx-auto mb-4"/>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-[#0a0a0a]">{tab==='gallery'?'Add Gallery Image':'Add Video'}</h2>
              {!saving&&<button onClick={()=>setShowForm(false)} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>}
            </div>
            {tab==='gallery'?(
              <div className="space-y-3">
                <div><label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Image URL *</label><input value={imgForm.image_url} onChange={e=>setImgForm(f=>({...f,image_url:e.target.value}))} className="input w-full text-sm" placeholder="https://... image link"/></div>
                <div><label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Title</label><input value={imgForm.title} onChange={e=>setImgForm(f=>({...f,title:e.target.value}))} className="input w-full text-sm" placeholder="e.g. Sunday Service"/></div>
                <div><label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Caption</label><input value={imgForm.caption} onChange={e=>setImgForm(f=>({...f,caption:e.target.value}))} className="input w-full text-sm" placeholder="Short caption..."/></div>
                <div className="flex gap-2 pt-1">
                  <button onClick={()=>setShowForm(false)} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">Cancel</button>
                  <button onClick={saveImage} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5" style={{background:'linear-gradient(135deg,#1e3a8a,#b91c1c)'}}>
                    {saving?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<><Save className="w-3.5 h-3.5"/> Add Image</>}
                  </button>
                </div>
              </div>
            ):(
              <div className="space-y-3">
                <div><label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Title *</label><input value={vidForm.title} onChange={e=>setVidForm(f=>({...f,title:e.target.value}))} className="input w-full text-sm" placeholder="e.g. Sunday Message - Dec 2024"/></div>
                <div><label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">YouTube URL *</label><input value={vidForm.youtube_url} onChange={e=>setVidForm(f=>({...f,youtube_url:e.target.value}))} className="input w-full text-sm" placeholder="https://youtu.be/..."/></div>
                <div><label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Description</label><textarea rows={2} value={vidForm.description} onChange={e=>setVidForm(f=>({...f,description:e.target.value}))} className="input w-full resize-none text-sm" placeholder="Short description..."/></div>
                <div className="flex gap-2 pt-1">
                  <button onClick={()=>setShowForm(false)} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">Cancel</button>
                  <button onClick={saveVideo} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5" style={{background:'linear-gradient(135deg,#b91c1c,#c2410c)'}}>
                    {saving?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<><Save className="w-3.5 h-3.5"/> Add Video</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  )
}
