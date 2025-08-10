import Head from "next/head";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });

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
                  {(active.distance! / 1000).toFixed(1)} km · {Math.round((active.time ?? 0) / 60)} min
                </div>
              </div>
              <RouteMap start={active.start} end={active.end} coords={coords} onPointSelect={() => {}} />
            </>
          ) : (
            <p>Wybierz trasę z listy.</p>
          )}
        </section>
      </div>
    </main>
  );
}
