'use client'
import { useEffect, useRef } from 'react'

type Loc = { id:string; name:string; description:string; lat:number; lng:number; category:string; hours:string; directions:string }

interface Props {
  locations: Loc[]
  selected: Loc|null
  onSelect: (loc: Loc|null) => void
  colors?: Record<string,string>
}

export default function CampusMap({ locations, selected, onSelect, colors = {} }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return

    const L = require('leaflet')
    require('leaflet/dist/leaflet.css')

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([5.4795, 7.5455], 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.current)
    }

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    locations.forEach(loc => {
      const color = colors[loc.category] || '#1a6b3a'
      const icon = L.divIcon({
        html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        className: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      })
      const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(mapInstance.current)
      marker.on('click', () => onSelect(loc))
      markersRef.current.push(marker)
    })

    return () => {}
  }, [locations, colors, onSelect])

  useEffect(() => {
    if (selected && mapInstance.current) {
      mapInstance.current.panTo([selected.lat, selected.lng])
    }
  }, [selected])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }}/>
}
