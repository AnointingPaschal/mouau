'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Slide = { id:string; image_url:string; title:string; caption:string }

export default function GallerySlideshow() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [idx,    setIdx]    = useState(0)
  const [key,    setKey]    = useState(0)

  useEffect(() => {
    supabase.from('ministry_gallery').select('*').eq('active', true).order('sort_order')
      .then(({ data }) => { if (data?.length) setSlides(data as Slide[]) })
  }, [])

  useEffect(() => {
    if (slides.length < 2) return
    const t = setInterval(() => {
      setIdx(i => (i + 1) % slides.length)
      setKey(k => k + 1)
    }, 4000)
    return () => clearInterval(t)
  }, [slides.length])

  if (!slides.length) return null

  const slide = slides[idx]
  const prev = () => { setIdx(i => (i - 1 + slides.length) % slides.length); setKey(k => k + 1) }
  const next = () => { setIdx(i => (i + 1) % slides.length);                setKey(k => k + 1) }

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{height: 200}}>
      {/* Image */}
      <img key={key} src={slide.image_url} alt={slide.title}
        className="w-full h-full object-cover gallery-slide"/>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
      {/* Pneuma Domain badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500"/>
        <span className="text-white text-[9px] font-bold tracking-wider uppercase">Pneuma Domain MOUAU</span>
      </div>
      {/* Text */}
      <div className="absolute bottom-3 left-4 right-16">
        {slide.title && <p className="text-white font-bold text-sm leading-tight">{slide.title}</p>}
        {slide.caption && <p className="text-white/70 text-[10px] mt-0.5">{slide.caption}</p>}
      </div>
      {/* Nav */}
      {slides.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
            <ChevronLeft className="w-4 h-4"/>
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
            <ChevronRight className="w-4 h-4"/>
          </button>
          {/* Dots */}
          <div className="absolute bottom-2.5 right-4 flex gap-1">
            {slides.map((_,i) => (
              <button key={i} onClick={() => { setIdx(i); setKey(k => k+1) }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-3' : 'bg-white/40'}`}/>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
