// components/map/LeafletMap.tsx
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

// Użyj Twojego działającego komponentu:
export default dynamic(() => import('../RouteMap'), { ssr: false })
