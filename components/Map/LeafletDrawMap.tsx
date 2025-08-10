import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'

export default dynamic(() => import('./LeafletDrawMapInner'), { ssr: false })
