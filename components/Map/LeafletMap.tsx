// components/map/LeafletMap.tsx
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

export default dynamic(() => import('./LeafletDrawMapInner'), { ssr: false })
