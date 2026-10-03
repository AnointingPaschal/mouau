'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import TopBar from '@/components/TopBar'
import {
  MapPin, Navigation2, Clock, ChevronLeft, Loader2,
  Image as ImageIcon, Play, ChevronLeft as PrevIcon, ChevronRight as NextIcon,
  Share2, X, ExternalLink,
  GraduationCap, Building2, Heart, Home, Dumbbell, Library,
  Mic2, Hotel, Utensils, BookOpen, Info, Hash
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Place = {
  id: string
  name: string
  description: string
  category: string
  lat: number
  lng: number
  hours: string
  directions: string
  active: boolean
  images: string[] | null
  video_url: string | null
  plus_code: string | null
}

const CAT_CONFIG: Record<string,{label:string;color:string;icon:any}> = {
  college: { label:'College',         color:'#1e3a8a', icon:GraduationCap },
  admin:   { label:'Administration',  color:'#0f172a', icon:Building2     },
  hostel:  { label:'Hostel',          color:'#64748b', icon:Home          },
  lodge:   { label:'Lodge',           color:'#6366f1', icon:Hotel         },
  social:  { label:'Social & Shops',  color:'#d97706', icon:Utensils      },
  health:  { label:'Health',          color:'#b91c1c', icon:Heart         },
  library: { label:'Library',         color:'#0891b2', icon:Library       },
  lecture: { label:'Lecture Hall',    color:'#c2410c', icon:Mic2          },
  worship: { label:'Worship',         color:'#7c3aed', icon:BookOpen      },
  sport:   { label:'Sports',          color:'#059669', icon:Dumbbell      },
}

export default function PlaceViewPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const [place,     setPlace]     = useState<Place | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [imgIdx,    setImgIdx]    = useState(0)
  const [lightbox,  setLightbox]  = useState<string | null>(null)
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => {
    supabase.from('campus_locations').select('*').eq('id', id).maybeSingle()
      .then(({ data }) => { setPlace(data as Place); setLoading(false) })
  }, [id])

  if (loading) return (
    <AppShell>
      <TopBar title="" />
      <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-[#aaa]"/></div>
    </AppShell>
  )

  if (!place) return (
    <AppShell>
      <TopBar title="Not found" />
      <div className="text-center py-24 px-6">
        <MapPin className="w-10 h-10 text-[#ddd] mx-auto mb-3"/>
        <p className="font-bold text-[#0a0a0a]">Place not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-[#1e3a8a] font-semibold">← Back</button>
      </div>
    </AppShell>
  )

  const cfg   = CAT_CONFIG[place.category] || { label: place.category, color: '#6b6b6b', icon: MapPin }
  const Icon  = cfg.icon
  const imgs  = Array.isArray(place.images) ? place.images.filter(Boolean) : []
  const hasVid = !!place.video_url

  const getDir = () => {
    const dest = place.lat && place.lng ? `${place.lat},${place.lng}` : encodeURIComponent(place.name + ', MOUAU Umudike')
    router.push(`/navigate?to=${dest}&directions=1`)
  }

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: place.name, text: place.description, url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  const embedUrl = () => {
    if (!place.video_url) return ''
    const yt = place.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`
    return place.video_url
  }

  const mapQuery = place.plus_code
    ? encodeURIComponent(place.plus_code)
    : `${place.lat},${place.lng}`
  const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&z=17&output=embed`
  const mapsLink = place.plus_code
    ? `https://www.google.com/maps?q=${encodeURIComponent(place.plus_code)}`
    : `https://www.google.com/maps?q=${place.lat},${place.lng}`

  return (
    <AppShell>
      <TopBar title={place.name} />
      <div className="pb-32">

        {/* Hero — image carousel or colour banner */}
        <div className="relative" style={{height: imgs.length ? 240 : 140, background: cfg.color}}>
          {imgs.length > 0 ? (
            <>
              {/* Images */}
              <img src={imgs[imgIdx]} alt={place.name}
                className="w-full h-full object-cover"
                onClick={() => setLightbox(imgs[imgIdx])}/>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"/>

              {/* Prev/Next */}
              {imgs.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); setImgIdx(i => (i - 1 + imgs.length) % imgs.length) }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                    <PrevIcon className="w-4 h-4"/>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setImgIdx(i => (i + 1) % imgs.length) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                    <NextIcon className="w-4 h-4"/>
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {imgs.map((_,i) => (
                      <button key={i} onClick={() => setImgIdx(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i===imgIdx?'bg-white scale-125':'bg-white/40'}`}/>
                    ))}
                  </div>
                </>
              )}

              {/* Photo count badge */}
              <div className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                <ImageIcon className="w-3 h-3"/> {imgIdx+1}/{imgs.length}
              </div>
            </>
          ) : (
            /* No images — just colour banner with icon */
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Icon className="w-7 h-7 text-white"/>
              </div>
              <p className="text-white/60 text-xs font-semibold">No photos yet</p>
            </div>
          )}

          {/* Back + share buttons */}
          <button onClick={() => router.back()}
            className="absolute top-3 left-3 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
            <ChevronLeft className="w-4 h-4"/>
          </button>
          <button onClick={share}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm"
            style={imgs.length ? {top:40,right:8} : {}}>
            <Share2 className="w-3.5 h-3.5"/>
          </button>

          {/* Video play button */}
          {hasVid && !showVideo && (
            <button onClick={() => setShowVideo(true)}
              className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/90 text-[#0a0a0a] text-xs font-bold px-3 py-1.5 rounded-full shadow backdrop-blur-sm">
              <Play className="w-3.5 h-3.5 fill-current"/> Play Video
            </button>
          )}
        </div>

        {/* Video embed */}
        {hasVid && showVideo && (
          <div className="relative aspect-video bg-black">
            <iframe src={embedUrl()} className="w-full h-full" allowFullScreen
              allow="autoplay; fullscreen"/>
            <button onClick={() => setShowVideo(false)}
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white">
              <X className="w-3.5 h-3.5"/>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-4 pt-5 space-y-4">

          {/* Name + category */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{background:cfg.color}}>
                <Icon className="w-3 h-3 text-white"/>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{color:cfg.color}}>{cfg.label}</span>
            </div>
            <h1 className="font-black text-[#0a0a0a] text-2xl leading-tight">{place.name}</h1>
            {place.description && <p className="text-sm text-[#666] mt-1 leading-relaxed">{place.description}</p>}
          </div>

          {/* Quick info pills */}
          <div className="flex flex-wrap gap-2">
            {place.hours && (
              <div className="flex items-center gap-1.5 bg-[#f5f5f5] rounded-xl px-3 py-1.5">
                <Clock className="w-3.5 h-3.5 text-[#888]"/>
                <span className="text-xs text-[#555] font-medium">{place.hours}</span>
              </div>
            )}
            {place.plus_code && (
              <div className="flex items-center gap-1.5 bg-[#f5f5f5] rounded-xl px-3 py-1.5">
                <Hash className="w-3.5 h-3.5 text-[#888]"/>
                <span className="text-xs text-[#555] font-mono">{place.plus_code}</span>
              </div>
            )}
            {place.lat && place.lng && (
              <div className="flex items-center gap-1.5 bg-[#f5f5f5] rounded-xl px-3 py-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#888]"/>
                <span className="text-xs text-[#555] font-mono">{place.lat.toFixed(4)}, {place.lng.toFixed(4)}</span>
              </div>
            )}
          </div>

          {/* Directions text */}
          {place.directions && (
            <div className="card p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#888] flex-shrink-0 mt-0.5"/>
              <div>
                <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1">How to get there</p>
                <p className="text-sm text-[#444] leading-relaxed">{place.directions}</p>
              </div>
            </div>
          )}

          {/* Map */}
          {place.lat && place.lng && (
            <div>
              <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-2">Location</p>
              <div className="rounded-2xl overflow-hidden border border-[#e8e8e8] shadow-sm" style={{height:200}}>
                <iframe
                  src={mapSrc}
                  className="w-full h-full border-0"
                  title={`Map of ${place.name}`}
                  loading="lazy"
                />
              </div>
              <a href={mapsLink}
                target="_blank" rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-[#aaa] hover:text-[#1e3a8a]">
                Open in Google Maps <ExternalLink className="w-2.5 h-2.5"/>
              </a>
            </div>
          )}

          {/* Image thumbnail strip */}
          {imgs.length > 1 && (
            <div>
              <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-2">Photos</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imgs.map((src,i) => (
                  <button key={i} onClick={() => { setImgIdx(i); setLightbox(src); window.scrollTo({top:0,behavior:'smooth'}) }}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i===imgIdx?'border-[#1e3a8a]':'border-transparent'}`}>
                    <img src={src} alt="" className="w-full h-full object-cover"/>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Fixed Get Directions button */}
      <div className="fixed bottom-20 inset-x-0 px-4 z-30">
        <button onClick={getDir}
          className="w-full max-w-lg mx-auto flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-white text-sm shadow-xl"
          style={{background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`}}>
          <Navigation2 className="w-5 h-5"/>
          Get Directions
        </button>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white"><X className="w-6 h-6"/></button>
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain p-4"/>
        </div>
      )}
    </AppShell>
  )
}
