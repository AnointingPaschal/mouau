'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import {
  MapPin, Navigation2, Play, ChevronLeft, ChevronRight,
  X, Phone, Mail, ExternalLink, Calendar,
  Heart, Star, BookOpen, Users, Music, Globe,
  Mic2, Dumbbell, Youtube, Instagram, Facebook
} from 'lucide-react'
import Link from 'next/link'

type GImg    = { id:string; image_url:string; title:string; caption:string }
type Video   = { id:string; title:string; youtube_url:string; video_url:string; video_type:string; description:string }
type Program = { id:string; label:string; time_info:string; icon:string; color:string }
type Settings= Record<string,string>
type Event   = { id:string; title:string; event_date:string; location:string }

const CHURCH_LAT = 5.478133
const CHURCH_LNG = 7.533195

const ICON_MAP: Record<string,any> = { Heart,Star,BookOpen,Users,Music,Globe,Mic2,Dumbbell,Phone,Cross:Users,Zap:Star,Award:Star }

function VideoPlayer({ v }:{ v:Video }) {
  const [playing,setPlaying]=useState(false)
  if(v.video_type==='upload'&&v.video_url) {
    return (
      <div>
        <div className="relative rounded-2xl overflow-hidden bg-black">
          <video src={v.video_url} controls className="w-full max-h-60 bg-black" poster=""/>
        </div>
        <p className="font-bold text-[#0a0a0a] text-sm mt-2">{v.title}</p>
        {v.description&&<p className="text-xs text-[#6b6b6b] mt-1 leading-relaxed">{v.description}</p>}
      </div>
    )
  }
  const getYTId=(url:string)=>{const m=url.match(/(?:v=|youtu\.be\/)([^"&?\/\s]{11})/i);return m?m[1]:null}
  const id=getYTId(v.youtube_url||'')
  if(!id) return null
  if(playing) return (
    <div>
      <div className="relative rounded-2xl overflow-hidden" style={{paddingTop:'56.25%'}}>
        <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${id}?autoplay=1`} allow="autoplay;fullscreen" allowFullScreen title={v.title}/>
      </div>
      <p className="font-bold text-[#0a0a0a] text-sm mt-2">{v.title}</p>
    </div>
  )
  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden cursor-pointer group" onClick={()=>setPlaying(true)} style={{paddingTop:'56.25%'}}>
        <img src={`https://img.youtube.com/vi/${id}/maxresdefault.jpg`} alt={v.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-white fill-white ml-0.5"/>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <p className="text-white text-xs font-bold line-clamp-1">{v.title}</p>
        </div>
      </div>
      {v.description&&<p className="text-xs text-[#6b6b6b] mt-2 leading-relaxed">{v.description}</p>}
    </div>
  )
}

export default function PDMPage() {
  const [gallery,  setGallery]  = useState<GImg[]>([])
  const [videos,   setVideos]   = useState<Video[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [settings, setSettings] = useState<Settings>({})
  const [events,   setEvents]   = useState<Event[]>([])
  const [slideIdx, setSlideIdx] = useState(0)
  const [slideKey, setSlideKey] = useState(0)
  const [lightbox, setLightbox] = useState<GImg|null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(()=>{
    Promise.all([
      supabase.from('ministry_gallery').select('*').eq('active',true).order('sort_order'),
      supabase.from('ministry_videos').select('*').eq('active',true).order('sort_order'),
      supabase.from('pdm_programs').select('*').eq('active',true).order('sort_order'),
      supabase.from('pdm_settings').select('key,value'),
      supabase.from('campus_events').select('id,title,event_date,location').eq('active',true).order('event_date').limit(4),
    ]).then(([g,v,p,s,ev])=>{
      setGallery((g.data as GImg[])||[])
      setVideos((v.data as Video[])||[])
      setPrograms((p.data as Program[])||[])
      const sv:Settings={}; (s.data||[]).forEach((r:any)=>{ sv[r.key]=r.value }); setSettings(sv)
      setEvents((ev.data as Event[])||[])
      setLoading(false)
    })
  },[])

  useEffect(()=>{
    if(gallery.length<2) return
    const t=setInterval(()=>{setSlideIdx(i=>(i+1)%gallery.length);setSlideKey(k=>k+1)},4000)
    return ()=>clearInterval(t)
  },[gallery.length])

  const prev=()=>{setSlideIdx(i=>(i-1+gallery.length)%gallery.length);setSlideKey(k=>k+1)}
  const next=()=>{setSlideIdx(i=>(i+1)%gallery.length);setSlideKey(k=>k+1)}

  const s=settings
  const whatsappNum=(s.whatsapp||'').replace(/\D/g,'')

  return (
    <AppShell>
      {lightbox&&(
        <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center" onClick={()=>setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white"><X className="w-6 h-6"/></button>
          <img src={lightbox.image_url} alt="" className="max-w-full max-h-full object-contain"/>
          {lightbox.title&&<div className="absolute bottom-6 left-0 right-0 text-center"><p className="text-white font-bold text-sm">{lightbox.title}</p></div>}
        </div>
      )}

      <div className="pb-24">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden" style={{background:'#030712'}}>
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-30 blur-3xl" style={{background:'#1e3a8a',transform:'translate(-40%,-40%)'}}/>
          <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full opacity-25 blur-3xl" style={{background:'#b91c1c',transform:'translate(30%,30%)'}}/>
          <div className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full opacity-15 blur-3xl" style={{background:'#c2410c',transform:'translate(-50%,-50%)'}}/>
          <div className="relative z-10 px-4 pt-8 pb-6 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <div className="w-3 h-3 rounded-full" style={{background:'#1e3a8a'}}/>
              <div className="w-3 h-3 rounded-full" style={{background:'#b91c1c'}}/>
              <div className="w-3 h-3 rounded-full" style={{background:'#c2410c'}}/>
            </div>
            <h1 className="text-white font-black text-3xl leading-tight mb-1">
              {s.name||'Pneuma Domain'}<br/>
              <span style={{background:'linear-gradient(90deg,#60a5fa,#f87171,#fb923c)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                Ministry
              </span>
            </h1>
            {s.tagline&&<p className="text-white/50 text-sm mb-1 max-w-xs mx-auto">{s.tagline}</p>}
            <p className="text-white/30 text-xs mb-2">Michael Okpara University of Agriculture</p>
            {s.sunday_time&&(
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-1.5 mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c2410c]"/>
                <span className="text-white/70 text-xs font-semibold">{s.sunday_time}{s.sunday_venue?` · ${s.sunday_venue}`:''}</span>
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <button onClick={()=>window.open(`https://www.google.com/maps/dir/?api=1&destination=${CHURCH_LAT},${CHURCH_LNG}`,'_blank')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{background:'linear-gradient(135deg,#1e3a8a,#b91c1c)'}}>
                <Navigation2 className="w-4 h-4"/> Find Us
              </button>
              {s.phone&&<a href={`tel:${s.phone}`} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white/80 border border-white/20">
                <Phone className="w-4 h-4"/> Call
              </a>}
            </div>
          </div>
        </div>

        {/* ── Gallery Slideshow ── */}
        {gallery.length>0&&(
          <div className="relative" style={{height:220}}>
            <img key={slideKey} src={gallery[slideIdx]?.image_url} alt="" className="w-full h-full object-cover gallery-slide"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"/>
            <div className="absolute bottom-4 left-4 right-16">
              {gallery[slideIdx]?.title&&<p className="text-white font-bold text-sm">{gallery[slideIdx].title}</p>}
              {gallery[slideIdx]?.caption&&<p className="text-white/60 text-xs mt-0.5">{gallery[slideIdx].caption}</p>}
            </div>
            {gallery.length>1&&(
              <>
                <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm"><ChevronLeft className="w-4 h-4"/></button>
                <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm"><ChevronRight className="w-4 h-4"/></button>
                <div className="absolute bottom-4 right-4 flex gap-1">
                  {gallery.map((_,i)=><button key={i} onClick={()=>{setSlideIdx(i);setSlideKey(k=>k+1)}} className={`h-1.5 rounded-full transition-all ${i===slideIdx?'bg-white w-4':'bg-white/40 w-1.5'}`}/>)}
                </div>
              </>
            )}
            <button onClick={()=>setLightbox(gallery[slideIdx])} className="absolute top-3 right-3 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
              <ExternalLink className="w-3.5 h-3.5"/>
            </button>
          </div>
        )}

        <div className="px-4 space-y-6 pt-5">

          {/* About */}
          {s.about&&(
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{color:'#1e3a8a'}}>About Us</p>
              <p className="text-sm text-[#4b4b4b] leading-relaxed">{s.about}</p>
            </div>
          )}

          {/* Programs */}
          {programs.length>0&&(
            <div>
              <p className="section-label mb-3">OUR PROGRAMS</p>
              <div className="grid grid-cols-3 gap-2.5">
                {programs.map(p=>{const Icon=ICON_MAP[p.icon]||Heart; return(
                  <div key={p.id} className="bg-white rounded-2xl p-3 shadow-sm text-center">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{background:p.color+'18'}}>
                      <Icon className="w-4 h-4" style={{color:p.color}}/>
                    </div>
                    <p className="font-bold text-[#0a0a0a] text-[10px] leading-tight">{p.label}</p>
                    <p className="text-[9px] text-[#aaa] mt-0.5">{p.time_info}</p>
                  </div>
                )})}
              </div>
            </div>
          )}

          {/* Videos */}
          {videos.length>0&&(
            <div>
              <p className="section-label mb-3">MESSAGES & VIDEOS</p>
              <div className="space-y-4">
                {videos.map(v=><VideoPlayer key={v.id} v={v}/>)}
              </div>
            </div>
          )}

          {/* Photo Grid */}
          {gallery.length>1&&(
            <div>
              <p className="section-label mb-3">GALLERY</p>
              <div className="grid grid-cols-3 gap-1.5">
                {gallery.map((img,i)=>(
                  <div key={img.id} onClick={()=>setLightbox(img)}
                    className={`relative overflow-hidden rounded-xl cursor-pointer ${i===0?'col-span-2 row-span-2':''}`}
                    style={{height:i===0?200:95}}>
                    <img src={img.image_url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/>
                    {img.title&&i===0&&<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2"><p className="text-white text-[10px] font-bold">{img.title}</p></div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {events.length>0&&(
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="section-label">UPCOMING EVENTS</p>
                <Link href="/events" className="text-[9px] font-bold" style={{color:'#1e3a8a'}}>See all →</Link>
              </div>
              <div className="space-y-2">
                {events.map(ev=>(
                  <div key={ev.id} className="bg-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#1e3a8a,#b91c1c)'}}>
                      <p className="text-white font-black text-sm leading-none">{new Date(ev.event_date).getDate()}</p>
                      <p className="text-white/70 text-[8px] uppercase">{new Date(ev.event_date).toLocaleString('en',{month:'short'})}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0a0a0a] text-xs">{ev.title}</p>
                      {ev.location&&<p className="text-[10px] text-[#aaa] truncate mt-0.5">📍 {ev.location}</p>}
                    </div>
                    <Calendar className="w-4 h-4 text-[#ddd] flex-shrink-0"/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <p className="section-label mb-3">FIND US</p>
            <div className="relative rounded-2xl overflow-hidden" style={{height:160}}>
              <iframe src={`https://maps.google.com/maps?q=${CHURCH_LAT},${CHURCH_LNG}&output=embed&z=17&t=k`} className="w-full h-full border-0" loading="lazy" title="Pneuma Domain"/>
              <button onClick={()=>window.open(`https://www.google.com/maps/dir/?api=1&destination=${CHURCH_LAT},${CHURCH_LNG}`,'_blank')}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-lg" style={{background:'linear-gradient(135deg,#1e3a8a,#b91c1c)'}}>
                <Navigation2 className="w-3.5 h-3.5"/> Directions
              </button>
            </div>
            <div className="bg-white rounded-2xl p-4 mt-2.5 shadow-sm">
              <p className="font-bold text-[#0a0a0a] text-sm">{s.name||'Pneuma Domain Ministry'}</p>
              <p className="text-xs text-[#6b6b6b] mt-1">Michael Okpara University of Agriculture, Umudike</p>
              {s.email&&<p className="text-xs text-[#6b6b6b]">✉️ {s.email}</p>}
              <div className="flex gap-2 mt-3">
                <button onClick={()=>window.open(`https://www.google.com/maps/dir/?api=1&destination=${CHURCH_LAT},${CHURCH_LNG}`,'_blank')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white" style={{background:'linear-gradient(135deg,#1e3a8a,#b91c1c)'}}>
                  <Navigation2 className="w-3.5 h-3.5"/> Navigate
                </button>
                {whatsappNum&&<a href={`https://wa.me/${whatsappNum}`} target="_blank"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#25d366] text-white">
                  💬 WhatsApp
                </a>}
              </div>
            </div>
          </div>

          {/* Social links */}
          {(s.youtube||s.instagram||s.facebook)&&(
            <div className="grid grid-cols-2 gap-2.5">
              {s.youtube&&<a href={s.youtube} target="_blank" className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                <Youtube className="w-5 h-5 text-red-600 flex-shrink-0"/>
                <div><p className="font-bold text-[#0a0a0a] text-xs">YouTube</p><p className="text-[10px] text-[#aaa]">Messages</p></div>
              </a>}
              {s.instagram&&<a href={s.instagram} target="_blank" className="flex items-center gap-2.5 bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3">
                <Instagram className="w-5 h-5 text-purple-600 flex-shrink-0"/>
                <div><p className="font-bold text-[#0a0a0a] text-xs">Instagram</p><p className="text-[10px] text-[#aaa]">Updates</p></div>
              </a>}
              {s.facebook&&<a href={s.facebook} target="_blank" className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 col-span-2">
                <Facebook className="w-5 h-5 text-blue-600 flex-shrink-0"/>
                <div><p className="font-bold text-[#0a0a0a] text-xs">Facebook</p><p className="text-[10px] text-[#aaa]">Community & Events</p></div>
              </a>}
            </div>
          )}

        </div>
      </div>
    </AppShell>
  )
}
