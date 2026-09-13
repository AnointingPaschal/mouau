'use client'
import { useEffect, useState, useCallback } from 'react'
import AdminShell from '@/components/AdminShell'
import { supabase } from '@/lib/supabase'
import {
  Plus, Trash2, Edit2, Loader2, CheckCircle2, X, Save,
  Play, ImageIcon, Upload, Heart, Star, BookOpen, Users,
  Music, Globe, Mic2, Dumbbell, ChevronUp, ChevronDown,
  Type, Phone, Link as LinkIcon
} from 'lucide-react'

type GImg    = { id:string; image_url:string; title:string; caption:string; sort_order:number; active:boolean }
type Video   = { id:string; title:string; youtube_url:string; video_url:string; video_type:string; description:string; sort_order:number; active:boolean }
type Program = { id:string; label:string; time_info:string; icon:string; color:string; sort_order:number; active:boolean }
type Settings= Record<string,string>

type Tab = 'about'|'programs'|'gallery'|'videos'|'contact'

const ICON_OPTIONS = ['Heart','Star','BookOpen','Users','Music','Globe','Mic2','Dumbbell','Phone','Cross','Zap','Award']
const ICON_MAP: Record<string,any> = { Heart,Star,BookOpen,Users,Music,Globe,Mic2,Dumbbell,Phone:Phone,Cross:Plus,Zap:Music,Award:Star }
const COLORS = ['#1e3a8a','#b91c1c','#c2410c','#7c3aed','#059669','#0891b2','#d97706','#0f172a']

const SETTING_FIELDS = [
  { key:'name',        label:'Ministry Name',     type:'text',     placeholder:'Pneuma Domain Ministry' },
  { key:'tagline',     label:'Tagline',            type:'text',     placeholder:'Short tagline...' },
  { key:'about',       label:'About / Description',type:'textarea', placeholder:'About the ministry...' },
  { key:'sunday_time', label:'Sunday Service Time',type:'text',     placeholder:'Sundays · 9:00 AM' },
  { key:'sunday_venue',label:'Sunday Venue',       type:'text',     placeholder:'MOUAU Campus' },
]
const CONTACT_FIELDS = [
  { key:'phone',       label:'Phone Number',       type:'text', placeholder:'+234 800 000 0000' },
  { key:'whatsapp',    label:'WhatsApp Number',    type:'text', placeholder:'+234 800 000 0000' },
  { key:'email',       label:'Email Address',      type:'text', placeholder:'pdm@example.com' },
  { key:'youtube',     label:'YouTube Channel URL',type:'text', placeholder:'https://youtube.com/@channel' },
  { key:'instagram',   label:'Instagram URL',      type:'text', placeholder:'https://instagram.com/handle' },
  { key:'facebook',    label:'Facebook URL',       type:'text', placeholder:'https://facebook.com/page' },
]

export default function AdminPDMPage() {
  const [tab,        setTab]        = useState<Tab>('about')
  const [gallery,    setGallery]    = useState<GImg[]>([])
  const [videos,     setVideos]     = useState<Video[]>([])
  const [programs,   setPrograms]   = useState<Program[]>([])
  const [settings,   setSettings]   = useState<Settings>({})
  const [loading,    setLoading]    = useState(true)
  const [toast,      setToast]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [uploading,  setUploading]  = useState(false)

  // Gallery state
  const [showImgForm, setShowImgForm]= useState(false)
  const [imgFile,    setImgFile]    = useState<File|null>(null)
  const [imgPreview, setImgPreview] = useState('')
  const [imgForm,    setImgForm]    = useState({ image_url:'', title:'', caption:'' })

  // Video state
  const [showVidForm,setShowVidForm]= useState(false)
  const [vidFile,    setVidFile]    = useState<File|null>(null)
  const [vidType,    setVidType]    = useState<'youtube'|'upload'>('youtube')
  const [vidForm,    setVidForm]    = useState({ title:'', youtube_url:'', description:'' })

  // Program state
  const [showProgForm,setShowProgForm]=useState(false)
  const [editProg,   setEditProg]   = useState<Program|null>(null)
  const [progForm,   setProgForm]   = useState({ label:'', time_info:'', icon:'Heart', color:'#1e3a8a' })

  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),3000)}

  const load=useCallback(async()=>{
    setLoading(true)
    const[g,v,p,s]=await Promise.all([
      supabase.from('ministry_gallery').select('*').order('sort_order').order('created_at'),
      supabase.from('ministry_videos').select('*').order('sort_order').order('created_at'),
      supabase.from('pdm_programs').select('*').order('sort_order'),
      supabase.from('pdm_settings').select('key,value'),
    ])
    setGallery((g.data as GImg[])||[])
    setVideos((v.data as Video[])||[])
    setPrograms((p.data as Program[])||[])
    const sv: Settings={}
    ;(s.data||[]).forEach((r:any)=>{ sv[r.key]=r.value })
    setSettings(sv)
    setLoading(false)
  },[])
  useEffect(()=>{load()},[load])

  // ── Settings save ──────────────────────────────────────────────────────────
  const saveSetting=async(key:string,value:string)=>{
    await supabase.from('pdm_settings').upsert({key,value,updated_at:new Date().toISOString()},{onConflict:'key'})
    setSettings(s=>({...s,[key]:value}))
    showToast('Saved')
  }

  // ── Gallery ────────────────────────────────────────────────────────────────
  const saveImage=async()=>{
    if(!imgFile&&!imgForm.image_url.trim()){showToast('Upload a photo or paste URL');return}
    setSaving(true)
    let url=imgForm.image_url.trim()
    if(imgFile){
      setUploading(true)
      const ext=imgFile.name.split('.').pop()
      const path=`gallery/${Date.now()}.${ext}`
      const{error}=await supabase.storage.from('materials').upload(path,imgFile,{contentType:imgFile.type})
      if(error){showToast('Upload failed: '+error.message);setSaving(false);setUploading(false);return}
      const{data:{publicUrl}}=supabase.storage.from('materials').getPublicUrl(path)
      url=publicUrl;setUploading(false)
    }
    await supabase.from('ministry_gallery').insert({image_url:url,title:imgForm.title,caption:imgForm.caption,sort_order:gallery.length,active:true})
    setSaving(false);setShowImgForm(false);setImgFile(null);setImgPreview('');setImgForm({image_url:'',title:'',caption:''});showToast('Image added');load()
  }
  const delImg=async(id:string)=>{if(!confirm('Delete?'))return;await supabase.from('ministry_gallery').delete().eq('id',id);load()}
  const toggleImg=async(id:string,active:boolean)=>{await supabase.from('ministry_gallery').update({active:!active}).eq('id',id);load()}

  // ── Videos ─────────────────────────────────────────────────────────────────
  const saveVideo=async()=>{
    if(!vidForm.title){showToast('Title required');return}
    if(vidType==='youtube'&&!vidForm.youtube_url){showToast('Paste YouTube URL');return}
    if(vidType==='upload'&&!vidFile){showToast('Select a video file');return}
    setSaving(true)
    let videoUrl='',videoType='youtube'
    if(vidType==='upload'&&vidFile){
      setUploading(true)
      const ext=vidFile.name.split('.').pop()
      const path=`videos/${Date.now()}.${ext}`
      const{error}=await supabase.storage.from('materials').upload(path,vidFile,{contentType:vidFile.type,upsert:false})
      if(error){showToast('Video upload failed: '+error.message);setSaving(false);setUploading(false);return}
      const{data:{publicUrl}}=supabase.storage.from('materials').getPublicUrl(path)
      videoUrl=publicUrl;videoType='upload';setUploading(false)
    }
    await supabase.from('ministry_videos').insert({
      title:vidForm.title,description:vidForm.description,
      youtube_url:vidType==='youtube'?vidForm.youtube_url:'',
      video_url:videoUrl,video_type:videoType,
      sort_order:videos.length,active:true
    })
    setSaving(false);setShowVidForm(false);setVidFile(null);setVidForm({title:'',youtube_url:'',description:''});showToast('Video added');load()
  }
  const delVid=async(id:string)=>{if(!confirm('Delete?'))return;await supabase.from('ministry_videos').delete().eq('id',id);load()}
  const toggleVid=async(id:string,active:boolean)=>{await supabase.from('ministry_videos').update({active:!active}).eq('id',id);load()}

  // ── Programs ───────────────────────────────────────────────────────────────
  const openAddProg=()=>{setEditProg(null);setProgForm({label:'',time_info:'',icon:'Heart',color:'#1e3a8a'});setShowProgForm(true)}
  const openEditProg=(p:Program)=>{setEditProg(p);setProgForm({label:p.label,time_info:p.time_info,icon:p.icon,color:p.color});setShowProgForm(true)}
  const saveProg=async()=>{
    if(!progForm.label){showToast('Label required');return}
    setSaving(true)
    if(editProg) await supabase.from('pdm_programs').update(progForm).eq('id',editProg.id)
    else await supabase.from('pdm_programs').insert({...progForm,sort_order:programs.length,active:true})
    setSaving(false);setShowProgForm(false);showToast(editProg?'Updated':'Program added');load()
  }
  const delProg=async(id:string)=>{if(!confirm('Delete?'))return;await supabase.from('pdm_programs').delete().eq('id',id);load()}
  const toggleProg=async(id:string,active:boolean)=>{await supabase.from('pdm_programs').update({active:!active}).eq('id',id);load()}

  const getYTId=(url:string)=>{const m=url.match(/(?:v=|youtu\.be\/)([^"&?\/\s]{11})/i);return m?m[1]:null}

  const TABS: {id:Tab;label:string}[] = [
    {id:'about',label:'About'},{id:'programs',label:'Programs'},
    {id:'gallery',label:'Gallery'},{id:'videos',label:'Videos'},{id:'contact',label:'Contact'},
  ]

  const SettingRow=({field}:{field:typeof SETTING_FIELDS[0]})=>{
    const [val,setVal]=useState(settings[field.key]||'')
    useEffect(()=>setVal(settings[field.key]||''),[settings[field.key]])
    return (
      <div className="px-4 py-3.5 border-b border-[#f5f5f5] last:border-0">
        <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5 block">{field.label}</label>
        {field.type==='textarea'?(
          <textarea rows={3} value={val} onChange={e=>setVal(e.target.value)}
            onBlur={()=>val!==settings[field.key]&&saveSetting(field.key,val)}
            className="input w-full resize-none text-sm" placeholder={field.placeholder}/>
        ):(
          <input value={val} onChange={e=>setVal(e.target.value)}
            onBlur={()=>val!==settings[field.key]&&saveSetting(field.key,val)}
            className="input w-full text-sm" placeholder={field.placeholder}/>
        )}
      </div>
    )
  }

  return (
    <AdminShell>
      {toast&&(<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5 text-green-400"/> {toast}</div>)}

      <div className="p-4 w-full pb-24 space-y-4">
        <div>
          <p className="text-[10px] text-[#aaa] uppercase tracking-widest">ADMIN</p>
          <h1 className="font-black text-[#0a0a0a] text-2xl">PDM Content</h1>
          <p className="text-xs text-[#6b6b6b] mt-0.5">Manage all Pneuma Domain Ministry content</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${tab===t.id?'text-white':'bg-white border border-[#e8e8e8] text-[#6b6b6b]'}`}
              style={tab===t.id?{background:'linear-gradient(135deg,#1e3a8a,#b91c1c)'}:{}}>
              {t.label}
            </button>
          ))}
        </div>

        {loading?(<div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#1e3a8a]"/></div>): <>

          {/* ── ABOUT ── */}
          {tab==='about'&&(
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-[#f9f9f7] border-b border-[#e8e8e8]">
                <p className="font-black text-[#0a0a0a] text-sm">Ministry Info</p>
                <p className="text-[10px] text-[#aaa] mt-0.5">Changes save automatically when you leave a field</p>
              </div>
              {SETTING_FIELDS.map(f=><SettingRow key={f.key} field={f}/>)}
            </div>
          )}

          {/* ── PROGRAMS ── */}
          {tab==='programs'&&(
            <div className="space-y-3">
              <button onClick={openAddProg} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#1e3a8a]/30 rounded-2xl text-sm font-bold text-[#1e3a8a] hover:bg-[#1e3a8a]/5 transition-colors">
                <Plus className="w-4 h-4"/> Add Program
              </button>
              {programs.map(p=>{
                const Icon=ICON_MAP[p.icon]||Heart
                return (
                  <div key={p.id} className={`card p-3.5 flex items-center gap-3 ${!p.active?'opacity-50':''}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:p.color+'20'}}>
                      <Icon className="w-5 h-5" style={{color:p.color}}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0a0a0a] text-sm">{p.label}</p>
                      <p className="text-[10px] text-[#aaa]">{p.time_info}</p>
                    </div>
                    <div className="flex gap-0.5">
                      <button onClick={()=>toggleProg(p.id,p.active)} className={`p-1.5 rounded-lg text-xs font-bold ${p.active?'bg-[#1a6b3a]/10 text-[#1a6b3a]':'bg-[#f0f0f0] text-[#aaa]'}`}>{p.active?'●':'○'}</button>
                      <button onClick={()=>openEditProg(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-[#aaa] hover:text-blue-500"><Edit2 className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>delProg(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── GALLERY ── */}
          {tab==='gallery'&&(
            <div className="space-y-3">
              <button onClick={()=>setShowImgForm(true)} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#1e3a8a]/30 rounded-2xl text-sm font-bold text-[#1e3a8a] hover:bg-[#1e3a8a]/5 transition-colors">
                <Plus className="w-4 h-4"/> Upload Photo
              </button>
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
            </div>
          )}

          {/* ── VIDEOS ── */}
          {tab==='videos'&&(
            <div className="space-y-3">
              <button onClick={()=>setShowVidForm(true)} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#b91c1c]/30 rounded-2xl text-sm font-bold text-[#b91c1c] hover:bg-[#b91c1c]/5 transition-colors">
                <Plus className="w-4 h-4"/> Add Video
              </button>
              {videos.map(v=>{
                const ytId=getYTId(v.youtube_url||'')
                const thumb=ytId?`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`:''
                return (
                  <div key={v.id} className={`card p-3 ${!v.active?'opacity-50':''}`}>
                    <div className="flex gap-3 items-start">
                      {thumb?<img src={thumb} alt="" className="w-20 h-14 rounded-xl object-cover flex-shrink-0"/>:
                        <div className="w-20 h-14 bg-[#f0f0f0] rounded-xl flex items-center justify-center flex-shrink-0"><Play className="w-5 h-5 text-[#aaa]"/></div>}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#0a0a0a] text-sm line-clamp-1">{v.title}</p>
                        <p className="text-[9px] font-semibold mt-0.5" style={{color:v.video_type==='upload'?'#1a6b3a':'#b91c1c'}}>{v.video_type==='upload'?'📁 Uploaded':'▶ YouTube'}</p>
                        {v.description&&<p className="text-[10px] text-[#aaa] line-clamp-1 mt-0.5">{v.description}</p>}
                      </div>
                      <div className="flex gap-0.5">
                        <button onClick={()=>toggleVid(v.id,v.active)} className={`p-1.5 rounded-lg text-xs font-bold ${v.active?'bg-[#1a6b3a]/10 text-[#1a6b3a]':'bg-[#f0f0f0] text-[#aaa]'}`}>{v.active?'●':'○'}</button>
                        <button onClick={()=>delVid(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── CONTACT ── */}
          {tab==='contact'&&(
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-[#f9f9f7] border-b border-[#e8e8e8]">
                <p className="font-black text-[#0a0a0a] text-sm">Contact & Social Media</p>
                <p className="text-[10px] text-[#aaa] mt-0.5">Changes save automatically when you leave a field</p>
              </div>
              {CONTACT_FIELDS.map(f=><SettingRow key={f.key} field={f as any}/>)}
            </div>
          )}

        </>}
      </div>

      {/* ── Add Image Modal ── */}
      {showImgForm&&(
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>!saving&&setShowImgForm(false)}/>
          <div className="relative w-full max-w-md bg-white rounded-t-2xl p-5 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#e8e8e8] rounded-full mx-auto mb-4"/>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-[#0a0a0a]">Upload Photo</h2>
              {!saving&&<button onClick={()=>{setShowImgForm(false);setImgFile(null);setImgPreview('')}} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>}
            </div>
            <div className="space-y-3">
              <div className="border-2 border-dashed border-[#e8e8e8] rounded-2xl overflow-hidden cursor-pointer hover:border-[#1e3a8a]/40 transition-colors" onClick={()=>document.getElementById('pdm-img')?.click()}>
                <input id="pdm-img" type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(!f)return;setImgFile(f);setImgPreview(URL.createObjectURL(f));setImgForm(x=>({...x,image_url:''}))}}/>
                {imgPreview?(
                  <div className="relative"><img src={imgPreview} alt="" className="w-full h-44 object-cover"/>
                    <button onClick={e=>{e.stopPropagation();setImgFile(null);setImgPreview('')}} className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white"><X className="w-4 h-4"/></button>
                  </div>
                ):(
                  <div className="flex flex-col items-center py-10 gap-2">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#1e3a8a15,#b91c1c15)'}}><ImageIcon className="w-7 h-7 text-[#aaa]"/></div>
                    <p className="font-bold text-[#0a0a0a] text-sm">Tap to upload photo</p>
                    <p className="text-xs text-[#aaa]">JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-[#aaa] text-center">— or paste image URL —</p>
              <input value={imgForm.image_url} onChange={e=>{setImgForm(f=>({...f,image_url:e.target.value}));if(e.target.value){setImgFile(null);setImgPreview('')}}} className="input w-full text-sm" placeholder="https://..."/>
              <input value={imgForm.title} onChange={e=>setImgForm(f=>({...f,title:e.target.value}))} className="input w-full text-sm" placeholder="Photo title (e.g. Sunday Service)"/>
              <input value={imgForm.caption} onChange={e=>setImgForm(f=>({...f,caption:e.target.value}))} className="input w-full text-sm" placeholder="Caption (optional)"/>
              <div className="flex gap-2 pt-1">
                <button onClick={()=>{setShowImgForm(false);setImgFile(null);setImgPreview('')}} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">Cancel</button>
                <button onClick={saveImage} disabled={saving||uploading} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5" style={{background:'linear-gradient(135deg,#1e3a8a,#b91c1c)'}}>
                  {saving||uploading?<><Loader2 className="w-3.5 h-3.5 animate-spin"/>{uploading?'Uploading...':'Saving...'}</>:<><Upload className="w-3.5 h-3.5"/> Add Photo</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Video Modal ── */}
      {showVidForm&&(
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>!saving&&setShowVidForm(false)}/>
          <div className="relative w-full max-w-md bg-white rounded-t-2xl p-5 animate-slide-up max-h-[92vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#e8e8e8] rounded-full mx-auto mb-4"/>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-[#0a0a0a]">Add Video</h2>
              {!saving&&<button onClick={()=>{setShowVidForm(false);setVidFile(null)}} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>}
            </div>
            <div className="space-y-3">
              <div><label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Title *</label>
                <input value={vidForm.title} onChange={e=>setVidForm(f=>({...f,title:e.target.value}))} className="input w-full text-sm" placeholder="e.g. Sunday Message — December 2024"/>
              </div>
              {/* Type toggle */}
              <div className="flex bg-[#f9f9f7] rounded-xl p-1 gap-1">
                <button onClick={()=>{setVidType('youtube');setVidFile(null)}} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${vidType==='youtube'?'bg-white text-[#0a0a0a] shadow-sm':'text-[#aaa]'}`}>
                  <Play className="w-3.5 h-3.5 text-red-500"/> YouTube URL
                </button>
                <button onClick={()=>setVidType('upload')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${vidType==='upload'?'bg-white text-[#0a0a0a] shadow-sm':'text-[#aaa]'}`}>
                  <Upload className="w-3.5 h-3.5 text-[#1e3a8a]"/> Upload File
                </button>
              </div>
              {vidType==='youtube'?(
                <input value={vidForm.youtube_url} onChange={e=>setVidForm(f=>({...f,youtube_url:e.target.value}))} className="input w-full text-sm" placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."/>
              ):(
                <div className="border-2 border-dashed border-[#e8e8e8] rounded-2xl cursor-pointer hover:border-[#1e3a8a]/40 transition-colors" onClick={()=>document.getElementById('pdm-vid')?.click()}>
                  <input id="pdm-vid" type="file" accept="video/*" className="hidden" onChange={e=>setVidFile(e.target.files?.[0]||null)}/>
                  <div className="flex flex-col items-center py-8 gap-2">
                    {vidFile?(
                      <><Play className="w-8 h-8 text-[#1e3a8a]"/><p className="font-bold text-[#0a0a0a] text-sm">{vidFile.name}</p><p className="text-xs text-[#aaa]">{(vidFile.size/1024/1024).toFixed(1)} MB</p></>
                    ):(
                      <><div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#1e3a8a15,#b91c1c15)'}}><Play className="w-7 h-7 text-[#aaa]"/></div><p className="font-bold text-[#0a0a0a] text-sm">Tap to upload video</p><p className="text-xs text-[#aaa]">MP4, MOV, AVI supported</p></>
                    )}
                  </div>
                </div>
              )}
              <div><label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Description</label>
                <textarea rows={2} value={vidForm.description} onChange={e=>setVidForm(f=>({...f,description:e.target.value}))} className="input w-full resize-none text-sm" placeholder="Brief description..."/>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={()=>{setShowVidForm(false);setVidFile(null)}} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">Cancel</button>
                <button onClick={saveVideo} disabled={saving||uploading} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5" style={{background:'linear-gradient(135deg,#b91c1c,#c2410c)'}}>
                  {saving||uploading?<><Loader2 className="w-3.5 h-3.5 animate-spin"/>{uploading?'Uploading...':'Saving...'}</>:<><Upload className="w-3.5 h-3.5"/> Add Video</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Program Modal ── */}
      {showProgForm&&(
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>!saving&&setShowProgForm(false)}/>
          <div className="relative w-full max-w-md bg-white rounded-t-2xl p-5 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#e8e8e8] rounded-full mx-auto mb-4"/>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-[#0a0a0a]">{editProg?'Edit Program':'Add Program'}</h2>
              {!saving&&<button onClick={()=>setShowProgForm(false)} className="p-1.5 rounded-full bg-[#f9f9f7]"><X className="w-4 h-4 text-[#6b6b6b]"/></button>}
            </div>
            <div className="space-y-3">
              <div><label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Program Name *</label>
                <input value={progForm.label} onChange={e=>setProgForm(f=>({...f,label:e.target.value}))} className="input w-full text-sm" placeholder="e.g. Bible Study"/>
              </div>
              <div><label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1 block">Schedule / Time</label>
                <input value={progForm.time_info} onChange={e=>setProgForm(f=>({...f,time_info:e.target.value}))} className="input w-full text-sm" placeholder="e.g. Tuesdays · 6PM"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5 block">Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {ICON_OPTIONS.map(ic=>{const IC=ICON_MAP[ic]||Heart;return(
                    <button key={ic} onClick={()=>setProgForm(f=>({...f,icon:ic}))}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${progForm.icon===ic?'border-[#1e3a8a] bg-[#1e3a8a]/10':'border-[#e8e8e8]'}`}>
                      <IC className="w-4 h-4" style={{color:progForm.icon===ic?'#1e3a8a':'#aaa'}}/>
                    </button>
                  )})}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c=>(
                    <button key={c} onClick={()=>setProgForm(f=>({...f,color:c}))}
                      className={`w-8 h-8 rounded-full transition-all ${progForm.color===c?'ring-2 ring-offset-2 ring-[#0a0a0a] scale-110':''}`}
                      style={{background:c}}/>
                  ))}
                </div>
              </div>
              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-[#f9f9f7] rounded-xl">
                {(()=>{const IC=ICON_MAP[progForm.icon]||Heart;return(
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:progForm.color+'20'}}><IC className="w-5 h-5" style={{color:progForm.color}}/></div>
                )})()}
                <div><p className="font-bold text-[#0a0a0a] text-sm">{progForm.label||'Program name'}</p><p className="text-[10px] text-[#aaa]">{progForm.time_info||'Schedule'}</p></div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={()=>setShowProgForm(false)} className="flex-1 py-2.5 border border-[#e8e8e8] rounded-xl text-sm font-semibold text-[#6b6b6b]">Cancel</button>
                <button onClick={saveProg} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5" style={{background:'linear-gradient(135deg,#1e3a8a,#b91c1c)'}}>
                  {saving?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<><Save className="w-3.5 h-3.5"/>{editProg?'Update':'Add'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
