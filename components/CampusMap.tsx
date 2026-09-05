'use client'
// Google Maps iframe embed — no Leaflet, no OpenStreetMap
// All map display is real Google Maps via iframe

interface Props {
  src: string
  loading?: boolean
}

export default function CampusMap({ src, loading = false }: Props) {
  if (loading) return (
    <div className="w-full h-full flex items-center justify-center bg-[#f9f9f7]">
      <div className="text-center">
        <div className="w-5 h-5 border-2 border-[#1a6b3a] border-t-transparent rounded-full animate-spin mx-auto mb-2"/>
        <p className="text-xs text-[#aaa]">Loading Google Maps...</p>
      </div>
    </div>
  )

  return (
    <iframe
      key={src}
      src={src}
      width="100%"
      height="100%"
      style={{ border: 0, display: 'block' }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title="Google Maps — MOUAU Campus"
    />
  )
}
