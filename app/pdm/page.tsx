'use client'
import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import {
  MapPin, Navigation2, Play, ChevronLeft, ChevronRight,
  X, Phone, Mail, Instagram, Youtube, Users,
  BookOpen, Heart, Star, Mic2, Calendar,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

type GalleryItem = { id:string; image_url:string; title:string; caption:string }
type Video       = { id:string; title:string; youtube_url:string; thumbnail_url:string; description:string }
type Event       = { id:string; title:string; description:string; event_date:string; location:string; category:string }

const CHURCH_LAT = 5.478133
const CHURCH_LNG = 7.533195

const PROGRAMS = [
  { icon:BookOpen, label:'Bible Study',      time:'Tuesdays · 6PM',    color:'#1e3a8a' },
  { icon:Heart,    label:'Prayer Meeting',   time:'Thursdays · 6PM',   color:'#b91c1c' },
  { icon:Star,     label:'Sunday Service',   time:'Sundays · 9AM',     color:'#c2410c' },
  { icon:Users,    label:'Discipleship',     time:'Saturdays · 4PM',   color:'#7c3aed' },
  { icon:Mic2,     label:'Worship Night',    time:'Last Fri · 7PM',    color:'#059669' },
  { icon:Heart,    label:'Campus Outreach',  time:'Monthly',           color:'#0891b2' },
]

function YouTubeEmbed({ url, title }:{ url:string; title:string }) {
  const [playing, setPlaying] = useState(false)
  const getYouTubeId=(url:string)=>{
    const m=url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)
    return m?m[1]:null
  }
  const id=getYouTubeId(url)
  if(!id) return null
  const thumb=`https://img.youtube.com/vi/${id}/maxresdefault.jpg`
  if(playing) return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{paddingTop:'56.25%'}}>
      <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${id}?autoplay=1`}
        allow="autoplay;fullscreen" allowFullScreen title={title}/>
    </div>
  )
  return (
    <div className="relative rounded-2xl overflow-hidden cursor-pointer group" onClick={()=>setPlaying(true)} style={{paddingTop:'56.25%'}}>
      <img src={thumb} alt={title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
          <Play className="w-6 h-6 text-white fill-white ml-0.5"/>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <p className="text-white text-xs font-bold line-clamp-1">{title}</p>
      </div>
    </div>
  )
}

export default function PDMPage() {
  const [gallery,    setGallery]    = useState<GalleryItem[]>([])
  const [videos,     setVideos]     = useState<Video[]>([])
  const [events,     setEvents]     = useState<Event[]>([])
  const [slideIdx,   setSlideIdx]   = useState(0)
  const [slideKey,   setSlideKey]   = useState(0)
  const [lightbox,   setLightbox]   = useState<GalleryItem|null>(null)

  useEffect(() => {
    supabase.from('ministry_gallery').select('*').eq('active',true).order('sort_order')
      .then(({data})=>{ if(data?.length) setGallery(data as GalleryItem[]) })
    supabase.from('ministry_videos').select('*').eq('active',true).order('sort_order')
      .then(({data})=>{ if(data) setVideos(data as Video[]) })
    supabase.from('campus_events').select('*').eq('active',true).order('event_date').limit(4)
      .then(({data})=>{ if(data) setEvents(data as Event[]) })
  },[])

  useEffect(()=>{
    if(gallery.length<2) return
    const t=setInterval(()=>{ setSlideIdx(i=>(i+1)%gallery.length); setSlideKey(k=>k+1) },4000)
    return ()=>clearInterval(t)
  },[gallery.length])

  const prev=()=>{ setSlideIdx(i=>(i-1+gallery.length)%gallery.length); setSlideKey(k=>k+1) }
  const next=()=>{ setSlideIdx(i=>(i+1)%gallery.length);                setSlideKey(k=>k+1) }

  return (
    <AppShell>
      {/* Lightbox */}
      {lightbox&&(
        <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center" onClick={()=>setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white"><X className="w-6 h-6"/></button>
          <img src={lightbox.image_url} alt={lightbox.title} className="max-w-full max-h-full object-contain"/>
          {lightbox.title&&<div className="absolute bottom-6 left-0 right-0 text-center"><p className="text-white font-bold text-sm">{lightbox.title}</p>{lightbox.caption&&<p className="text-white/60 text-xs mt-1">{lightbox.caption}</p>}</div>}
        </div>
      )}

      <div className="pb-24">

        {/* ── Dark Hero with tri-color ── */}
        <div className="relative overflow-hidden" style={{background:'#030712'}}>
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-30 blur-3xl" style={{background:'#1e3a8a',transform:'translate(-40%,-40%)'}}/>
          <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full opacity-25 blur-3xl" style={{background:'#b91c1c',transform:'translate(30%,30%)'}}/>
          <div className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full opacity-15 blur-3xl" style={{background:'#c2410c',transform:'translate(-50%,-50%)'}}/>

          <div className="relative z-10 px-4 pt-8 pb-6 text-center">
            {/* Logo dots */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <div className="w-3 h-3 rounded-full" style={{background:'#1e3a8a'}}/>
              <div className="w-3 h-3 rounded-full" style={{background:'#b91c1c'}}/>
              <div className="w-3 h-3 rounded-full" style={{background:'#c2410c'}}/>
            </div>
            <h1 className="text-white font-black text-3xl leading-tight mb-1">
              Pneuma Domain<br/>
              <span style={{background:'linear-gradient(90deg,#60a5fa,#f87171,#fb923c)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                Ministry
              </span>
            </h1>
            <p className="text-white/50 text-sm mb-1">Michael Okpara University of Agriculture</p>
            <p className="text-white/30 text-xs mb-6">Building kingdom-minded students for global impact</p>

            <div className="flex items-center justify-center gap-3">
              <button onClick={()=>window.open(`https://www.google.com/maps/dir/?api=1&destination=${CHURCH_LAT},${CHURCH_LNG}`,'_blank')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{background:'linear-gradient(135deg,#1e3a8a,#b91c1c)'}}>
                <Navigation2 className="w-4 h-4"/> Find Us
              </button>
              <a href="tel:+2348000000000"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white/80 border border-white/20 hover:bg-white/10 transition-colors">
                <Phone className="w-4 h-4"/> Contact
              </a>
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

          {/* ── Programs ── */}
          <div>
            <p className="section-label mb-3">OUR PROGRAMS</p>
            <div className="grid grid-cols-3 gap-2.5">
              {PROGRAMS.map(p=>(
                <div key={p.label} className="bg-white rounded-2xl p-3 shadow-sm text-center">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{background:p.color+'15'}}>
                    <p.icon className="w-4 h-4" style={{color:p.color}}/>
                  </div>
                  <p className="font-bold text-[#0a0a0a] text-[10px] leading-tight">{p.label}</p>
                  <p className="text-[9px] text-[#aaa] mt-0.5">{p.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Videos ── */}
          {videos.length>0&&(
            <div>
              <p className="section-label mb-3">MESSAGES & VIDEOS</p>
              <div className="space-y-3">
                {videos.map(v=>(
                  <div key={v.id}>
                    <YouTubeEmbed url={v.youtube_url} title={v.title}/>
                    {v.description&&<p className="text-xs text-[#6b6b6b] mt-2 leading-relaxed">{v.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Photo Grid ── */}
          {gallery.length>1&&(
            <div>
              <p className="section-label mb-3">GALLERY</p>
              <div className="grid grid-cols-3 gap-1.5">
                {gallery.map((img,i)=>(
                  <div key={img.id} onClick={()=>setLightbox(img)}
                    className={`relative overflow-hidden rounded-xl cursor-pointer ${i===0?'col-span-2 row-span-2':''}`}
                    style={{height: i===0?200:95}}>
                    <img src={img.image_url} alt={img.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"/>
                    {img.title&&i===0&&(
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-[10px] font-bold">{img.title}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Upcoming Events ── */}
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

          {/* ── Location ── */}
          <div>
            <p className="section-label mb-3">FIND US</p>
            <div className="relative rounded-2xl overflow-hidden" style={{height:160}}>
              <iframe
                src={`https://maps.google.com/maps?q=${CHURCH_LAT},${CHURCH_LNG}&output=embed&z=17&t=k`}
                className="w-full h-full border-0" loading="lazy" title="Pneuma Domain Location"/>
              <button onClick={()=>window.open(`https://www.google.com/maps/dir/?api=1&destination=${CHURCH_LAT},${CHURCH_LNG}`,'_blank')}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-lg"
                style={{background:'linear-gradient(135deg,#1e3a8a,#b91c1c)'}}>
                <Navigation2 className="w-3.5 h-3.5"/> Get Directions
              </button>
            </div>
            <div className="bg-white rounded-2xl p-4 mt-2.5 shadow-sm">
              <p className="font-bold text-[#0a0a0a] text-sm">Pneuma Domain Ministry</p>
              <p className="text-xs text-[#6b6b6b] mt-1">Michael Okpara University of Agriculture, Umudike Campus</p>
              <p className="text-xs text-[#6b6b6b]">Umuahia, Abia State, Nigeria</p>
              <div className="flex gap-2 mt-3">
                <button onClick={()=>window.open(`https://www.google.com/maps/dir/?api=1&destination=${CHURCH_LAT},${CHURCH_LNG}`,'_blank')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white"
                  style={{background:'linear-gradient(135deg,#1e3a8a,#b91c1c)'}}>
                  <Navigation2 className="w-3.5 h-3.5"/> Navigate
                </button>
                <a href="https://wa.me/2348000000000" target="_blank"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#25d366] text-white">
                  💬 WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* ── Social links ── */}
          <div className="grid grid-cols-2 gap-2.5">
            <a href="https://youtube.com" target="_blank"
              className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 hover:bg-red-100 transition-colors">
              <Youtube className="w-5 h-5 text-red-600 flex-shrink-0"/>
              <div><p className="font-bold text-[#0a0a0a] text-xs">YouTube</p><p className="text-[10px] text-[#aaa]">Messages & Sermons</p></div>
            </a>
            <a href="https://instagram.com" target="_blank"
              className="flex items-center gap-2.5 bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 hover:bg-purple-100 transition-colors">
              <Instagram className="w-5 h-5 text-purple-600 flex-shrink-0"/>
              <div><p className="font-bold text-[#0a0a0a] text-xs">Instagram</p><p className="text-[10px] text-[#aaa]">Photos & Updates</p></div>
            </a>
          </div>

        </div>
      </div>
    </AppShell>
  )
}
