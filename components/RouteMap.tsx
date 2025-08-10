import { MapContainer, TileLayer, Polyline, Marker, useMap, useMapEvents } from "react-leaflet";
import { LatLngBoundsExpression } from "leaflet";
import L from "leaflet";
import { useEffect } from "react";

// fix ikon w Next.js – weź z CDN, działa zawsze
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Props = {
  start?: [number, number];         // [lat, lon]
  end?: [number, number];           // [lat, lon]
  coords?: [number, number][];      // polyline [lat, lon]
  onPointSelect: (lat: number, lon: number) => void;
};

function FitTo({ start, end, coords }: { start?: [number, number]; end?: [number, number]; coords?: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = [];
    if (coords?.length) pts.push(...coords);
    if (start) pts.push(start);
    if (end) pts.push(end);
    if (!pts.length) return;
    const bounds: LatLngBoundsExpression = pts.map(([lat, lon]) => [lat, lon]);
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [start, end, coords, map]);
  return null;
}

function ClickHandler({ onPointSelect }: { onPointSelect: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onPointSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function RouteMap({ start, end, coords, onPointSelect }: Props) {
  const center = start || end || [52.2297, 21.0122];

  return (
    <MapContainer center={center} zoom={7} style={{ height: 400, width: "100%" }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPointSelect={onPointSelect} />
      {coords?.length ? <Polyline positions={coords} /> : null}
      {start && <Marker position={start} />}
      {end && <Marker position={end} />}
      <FitTo start={start} end={end} coords={coords} />
    </MapContainer>
  );
}
