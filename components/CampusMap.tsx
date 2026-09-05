'use client'
import { useEffect, useRef } from 'react'
import { CampusLocation } from '@/lib/data'

interface Props {
  locations: CampusLocation[]
  selected: CampusLocation | null
  onSelect: (loc: CampusLocation) => void
}

const CAT_COLORS: Record<string, string> = {
  academic: '#1B5E20', admin: '#5C35A0', hostel: '#C9A227',
  social: '#E91E8C', health: '#E53935', worship: '#3F51B5', sport: '#2E7D32'
}

export default function CampusMap({ locations, selected, onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return
    if (mapInstanceRef.current) return

    const L = require('leaflet')
    require('leaflet/dist/leaflet.css')

    const map = L.map(mapRef.current, {
      center: [5.4800, 7.5450],
      zoom: 16,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    mapInstanceRef.current = map
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return
    const L = require('leaflet')

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    locations.forEach(loc => {
      const color = CAT_COLORS[loc.category] || '#1B5E20'
      const isSelected = selected?.id === loc.id

      const icon = L.divIcon({
        html: `<div style="
          width:${isSelected ? 36 : 28}px;
          height:${isSelected ? 36 : 28}px;
          background:${color};
          border:3px solid white;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 3px 10px rgba(0,0,0,0.25);
          transition:all 0.2s;
        "></div>`,
        iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
        iconAnchor: [isSelected ? 18 : 14, isSelected ? 36 : 28],
        className: ''
      })

      const marker = L.marker([loc.lat, loc.lng], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="min-width:200px;font-family:Inter,sans-serif">
            <h3 style="font-weight:700;color:#1B5E20;font-size:14px;margin-bottom:4px">${loc.name}</h3>
            <p style="color:#666;font-size:12px;line-height:1.5;margin-bottom:6px">${loc.description}</p>
            ${loc.hours ? `<p style="color:#1B5E20;font-size:11px;font-weight:600">🕐 ${loc.hours}</p>` : ''}
            <span style="background:#E8F5E9;color:#1B5E20;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;text-transform:capitalize">${loc.category}</span>
          </div>
        `, { maxWidth: 260 })
        .on('click', () => onSelect(loc))

      markersRef.current.push(marker)
    })
  }, [locations, selected, onSelect])

  useEffect(() => {
    if (!selected || !mapInstanceRef.current) return
    mapInstanceRef.current.setView([selected.lat, selected.lng], 17, { animate: true })
  }, [selected])

  return <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '16px' }} />
}
