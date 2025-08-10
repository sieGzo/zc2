import { MapContainer, TileLayer, FeatureGroup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useRef } from 'react'

type Props = {
  line?: [number, number][]            // [lat, lon]
  center?: [number, number]
  zoom?: number
  height?: number | string
  onCreatedLine?: (latlngs: [number, number][]) => void
}

export default function LeafletDrawMapInner({
  line,
  center = [52.2297, 21.0122],
  zoom = 12,
  height = '70vh',
  onCreatedLine,
}: Props) {
  const fgRef = useRef<L.FeatureGroup | null>(null)

  useEffect(() => {
    if (!fgRef.current) return
    const map = (fgRef.current as any)._map as L.Map
    const drawControl = new L.Control.Draw({
      draw: {
        polygon: false, circle: false, rectangle: false, marker: false, circlemarker: false,
        polyline: { shapeOptions: {} },
      },
      edit: { featureGroup: fgRef.current },
    })
    map.addControl(drawControl)
    const onCreated = (e: any) => {
      if (e.layerType === 'polyline') {
        const latlngs = e.layer.getLatLngs().map((p: any) => [p.lat, p.lng]) as [number, number][]
        onCreatedLine?.(latlngs)
        fgRef.current?.addLayer(e.layer)
      }
    }
    map.on(L.Draw.Event.CREATED, onCreated)
    return () => {
      map.off(L.Draw.Event.CREATED, onCreated)
      map.removeControl(drawControl)
    }
  }, [onCreatedLine])

  return (
    <MapContainer center={center} zoom={zoom} style={{ height, width: '100%' }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FeatureGroup ref={fgRef as any} />
      {line && line.length > 0 && <Polyline positions={line} />}
    </MapContainer>
  )
}
