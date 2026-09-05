'use client'
import { useEffect, useRef } from 'react'

type Loc = { id: string; name: string; description: string; lat: number; lng: number; category: string; hours: string; directions: string }
interface Props {
  locations: Loc[]
  selected: Loc | null
  onSelect: (loc: Loc | null) => void
  colors?: Record<string, string>
  route?: [number, number][]          // polyline waypoints
  routeOriginLabel?: string
  routeDestLabel?: string
}

const CAT_COLORS: Record<string, string> = {
  academic: '#1a6b3a', admin: '#0a0a0a', hostel: '#6b6b6b',
  social: '#d97706', health: '#dc2626', worship: '#7c3aed', sport: '#2563eb'
}

export default function CampusMap({ locations, selected, onSelect, colors = {}, route = [], routeOriginLabel, routeDestLabel }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const routeLayerRef = useRef<any>(null)
  const endpointMarkersRef = useRef<any[]>([])

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return
    const L = require('leaflet')
    require('leaflet/dist/leaflet.css')

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { zoomControl: false }).setView([5.4800, 7.5455], 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapInstance.current)
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current)
    }

    // Clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    locations.forEach(loc => {
      const c = colors[loc.category] || CAT_COLORS[loc.category] || '#1a6b3a'
      const isSelected = selected?.id === loc.id
      const icon = L.divIcon({
        html: `<div style="
          background:${c}; width:${isSelected ? 16 : 12}px; height:${isSelected ? 16 : 12}px;
          border-radius:50%; border:2px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,${isSelected ? 0.5 : 0.3});
          transition:all 0.2s;
        "></div>`,
        className: '', iconSize: [isSelected ? 16 : 12, isSelected ? 16 : 12],
        iconAnchor: [isSelected ? 8 : 6, isSelected ? 8 : 6],
      })
      const marker = L.marker([loc.lat, loc.lng], { icon })
        .addTo(mapInstance.current)
        .bindTooltip(loc.name, { permanent: false, direction: 'top', offset: [0, -8], className: 'leaflet-tooltip-custom' })
      marker.on('click', () => onSelect(loc))
      markersRef.current.push(marker)
    })
  }, [locations, selected, colors, onSelect])

  // Draw route
  useEffect(() => {
    if (!mapInstance.current || typeof window === 'undefined') return
    const L = require('leaflet')

    // Remove old route
    if (routeLayerRef.current) { routeLayerRef.current.remove(); routeLayerRef.current = null }
    endpointMarkersRef.current.forEach(m => m.remove())
    endpointMarkersRef.current = []

    if (route.length < 2) return

    // Draw polyline
    routeLayerRef.current = L.polyline(route, {
      color: '#1a6b3a', weight: 5, opacity: 0.85,
      dashArray: undefined, lineCap: 'round', lineJoin: 'round'
    }).addTo(mapInstance.current)

    // Origin marker (green circle)
    const originIcon = L.divIcon({
      html: `<div style="background:#1a6b3a;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
      className: '', iconSize: [14, 14], iconAnchor: [7, 7]
    })
    // Destination marker (red pin)
    const destIcon = L.divIcon({
      html: `<div style="background:#dc2626;width:16px;height:16px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
      className: '', iconSize: [16, 16], iconAnchor: [8, 16]
    })

    const oMarker = L.marker(route[0], { icon: originIcon })
      .addTo(mapInstance.current)
    const dMarker = L.marker(route[route.length - 1], { icon: destIcon })
      .addTo(mapInstance.current)

    if (routeOriginLabel) oMarker.bindTooltip(routeOriginLabel, { permanent: true, direction: 'top', offset: [0, -10] })
    if (routeDestLabel) dMarker.bindTooltip(routeDestLabel, { permanent: true, direction: 'top', offset: [0, -18] })

    endpointMarkersRef.current = [oMarker, dMarker]

    // Fit map to route
    mapInstance.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] })
  }, [route, routeOriginLabel, routeDestLabel])

  // Pan to selected
  useEffect(() => {
    if (selected && mapInstance.current) {
      mapInstance.current.panTo([selected.lat, selected.lng], { animate: true, duration: 0.5 })
    }
  }, [selected])

  return (
    <>
      <style>{`
        .leaflet-tooltip-custom {
          background: #0a0a0a; color: white; border: none;
          border-radius: 6px; font-size: 11px; font-weight: 600;
          padding: 3px 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .leaflet-tooltip-custom::before { border-top-color: #0a0a0a; }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }}/>
    </>
  )
}
