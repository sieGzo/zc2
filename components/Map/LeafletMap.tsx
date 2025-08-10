// components/map/LeafletMap.tsx
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

export default dynamic(() => import('./LeafletMapInner'), { ssr: false })
