// pages/trails/moje/moje.tsx
import Head from "next/head";
import { useEffect, useState } from "react";

type Saved = {
  id: number;
  name: string;
  mode: "walk" | "bicycle";
  start?: [number, number];
  end?: [number, number];
  startLabel?: string;
  endLabel?: string;
  distance?: number; // m
  time?: number;     // s
  geojson: any;
};

function extractCoords(geojson: any): [number, number][] {
  const out: [number, number][] = [];
  for (const f of geojson?.features ?? []) {
    const g = f?.geometry;
    if (!g) continue;
    if (g.type === "LineString") {
      for (const [lon, lat] of g.coordinates) out.push([lat, lon]);
    } else if (g.type === "MultiLineString") {
      for (const seg of g.coordinates) for (const [lon, lat] of seg) out.push([lat, lon]);
    }
  }
  return out;
}

// Link builders
function googleLink(i: Saved) {
  const travelmode = i.mode === "walk" ? "walking" : "bicycling";
  const origin =
    i.startLabel?.trim() ||
    (i.start ? `${i.start[0]},${i.start[1]}` : "");
  const destination =
    i.endLabel?.trim() ||
    (i.end ? `${i.end[0]},${i.end[1]}` : "");
  if (!origin || !destination) return "#";
  const q = new URLSearchParams({ api: "1", origin, destination, travelmode });
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}
function appleLink(i: Saved) {
  const dirflg = i.mode === "walk" ? "w" : "r";
  const s =
    i.startLabel?.trim() ||
    (i.start ? `${i.start[0]},${i.start[1]}` : "");
  const e =
    i.endLabel?.trim() ||
    (i.end ? `${i.end[0]},${i.end[1]}` : "");
  if (!s || !e) return "#";
  const q = new URLSearchParams({ saddr: s, daddr: e, dirflg });
  return `http://maps.apple.com/?${q.toString()}`;
}
function osmLink(i: Saved) {
  if (!i.start || !i.end) return "#";
  const engine = i.mode === "walk" ? "foot" : "bicycle";
  const route = `${i.start[0]},${i.start[1]};${i.end[0]},${i.end[1]}`;
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_${engine}&route=${route}`;
}
function gpxHref(i: Saved) {
  if (!i.start || !i.end) return "#";
  const mode = i.mode === "walk" ? "walk" : "bicycle";
  return `/api/geo/route.gpx?mode=${mode}&p=${i.start[0]},${i.start[1]}&p=${i.end[0]},${i.end[1]}`;
}

export default function MyTrailsPage() {
  const [items, setItems] = useState<Saved[]>([]);
  const [active, setActive] = useState<Saved | null>(null);

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("zc_saved_routes") || "[]");
      setItems(list);
      setActive(list[0] || null);
    } catch {}
  }, []);

  function remove(id: number) {
    const next = items.filter(i => i.id !== id);
    setItems(next);
    localStorage.setItem("zc_saved_routes", JSON.stringify(next));
    if (active?.id === id) setActive(next[0] || null);
  }

  const coords = active ? extractCoords(active.geojson) : [];
  const canGoogleApple =
    !!active &&
    !!(
      (active.startLabel && active.endLabel) ||
      (active.start && active.end)
    );
  const hasCoords = !!active?.start && !!active?.end;

  const disabledCls = "opacity-50 pointer-events-none cursor-not-allowed";
  const btnCls = "px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";

  const kmText =
    active?.distance && active.distance > 0
      ? `${(active.distance / 1000).toFixed(1)} km`
      : "—";
  const timeText =
    active?.time && active.time > 0
      ? `${Math.round(active.time / 60)} min`
      : "—";

  return (
    <main className="max-w-6xl mx-auto p-6">
      <Head><title>Moje trasy — Zwiedzaj Chytrze</title></Head>
      <h1 className="text-3xl font-bold mb-4">Moje trasy</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <aside className="md:col-span-1">
          <ul className="space-y-2">
            {items.map(i => (
              <li key={i.id} className={`p-3 border rounded ${active?.id === i.id ? "bg-orange-50" : ""}`}>
                <button className="text-left w-full" onClick={() => setActive(i)}>
                  <div className="font-medium">{i.name}</div>
                  <div className="text-xs text-gray-600">
                    {(i.distance ?? 0) / 1000 > 0 ? `${(i.distance! / 1000).toFixed(1)} km` : ""} · {i.mode === "walk" ? "piesza" : "rowerowa"}
                  </div>
                </button>
                <div className="flex gap-2 mt-2">
                  <a className="text-xs text-blue-600 underline" href="/trails" title="Otwórz planer">Otwórz w planerze</a>
                  <button className="text-xs text-red-600" onClick={() => remove(i.id)}>Usuń</button>
                </div>
              </li>
            ))}
            {items.length === 0 && <li className="text-gray-500">Brak zapisanych tras.</li>}
          </ul>
        </aside>

        <section className="md:col-span-2">
          {active ? (
            <>
              <div className="mb-3">
                <div className="text-lg font-semibold">{active.name}</div>
                <div className="text-sm text-gray-600">
                  {kmText} · {timeText} · {active.mode === "walk" ? "piesza" : "rowerowa"}
                </div>
              </div>

              {/* Zamiast RouteMap — przyciski akcji */}
              <div className="rounded-xl border p-4">
                <div className="flex flex-wrap gap-3">
                  <a
                    href={active ? googleLink(active) : "#"}
                    target="_blank"
                    rel="noreferrer"
                    className={`${btnCls} ${canGoogleApple ? "" : disabledCls}`}
                    aria-disabled={!canGoogleApple}
                    title={!canGoogleApple ? "Potrzebne punkty start/meta lub etykiety" : ""}
                  >
                    Otwórz w Google Maps
                  </a>
                  <a
                    href={active ? appleLink(active) : "#"}
                    target="_blank"
                    rel="noreferrer"
                    className={`${btnCls} ${canGoogleApple ? "" : disabledCls}`}
                    aria-disabled={!canGoogleApple}
                    title={!canGoogleApple ? "Potrzebne punkty start/meta lub etykiety" : ""}
                  >
                    Otwórz w Apple Maps
                  </a>
                  <a
                    href={active ? osmLink(active) : "#"}
                    target="_blank"
                    rel="noreferrer"
                    className={`${btnCls} ${hasCoords ? "" : disabledCls}`}
                    aria-disabled={!hasCoords}
                    title={!hasCoords ? "OSM wymaga współrzędnych start/meta" : ""}
                  >
                    Otwórz w OSM
                  </a>
                  <a
                    href={active ? gpxHref(active) : "#"}
                    target="_blank"
                    rel="noreferrer"
                    className={`${btnCls} ${hasCoords ? "" : disabledCls}`}
                    aria-disabled={!hasCoords}
                    title={!hasCoords ? "GPX wymaga współrzędnych start/meta" : ""}
                  >
                    Pobierz GPX
                  </a>
                </div>

                {/* Informacja pomocnicza */}
                {coords.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Pkt. na trasie: {coords.length}. (Podgląd mapy został wyłączony.)
                  </p>
                )}
              </div>
            </>
          ) : (
            <p>Wybierz trasę z listy.</p>
          )}
        </section>
      </div>
    </main>
  );
}
