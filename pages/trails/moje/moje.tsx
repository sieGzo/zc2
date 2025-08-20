// pages/trails/moje/moje.tsx
import Head from "next/head"
import { useEffect, useState, useMemo } from "react"

type Saved = {
  id: number
  name: string
  mode: "walk" | "bicycle"
  start?: [number, number]
  end?: [number, number]
  distance?: number
  time?: number
  geojson: any
}

// helpers
function extractCoords(geojson: any): [number, number][] {
  const out: [number, number][] = []
  for (const f of geojson?.features ?? []) {
    const g = f?.geometry
    if (!g) continue
    if (g.type === "LineString") {
      for (const [lon, lat] of g.coordinates) out.push([lat, lon])
    } else if (g.type === "MultiLineString") {
      for (const seg of g.coordinates) for (const [lon, lat] of seg) out.push([lat, lon])
    }
  }
  return out
}
function formatKm(m?: number) {
  if (!m || m <= 0) return "—"
  return `${(m / 1000).toFixed(1)} km`
}
function formatDuration(s?: number) {
  if (!s || s <= 0) return "—"
  const min = Math.round(s / 60)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

// link builders
function buildGoogleLink(r: Saved) {
  const travelmode = r.mode === "walk" ? "walking" : "bicycling"
  const s = r.start ? `${r.start[0]},${r.start[1]}` : ""
  const e = r.end ? `${r.end[0]},${r.end[1]}` : ""
  const q = new URLSearchParams({ api: "1", origin: s, destination: e, travelmode })
  return `https://www.google.com/maps/dir/?${q.toString()}`
}
function buildAppleLink(r: Saved) {
  if (r.mode !== "walk") return "#"
  const s = r.start ? `${r.start[0]},${r.start[1]}` : ""
  const e = r.end ? `${r.end[0]},${r.end[1]}` : ""
  const q = new URLSearchParams({ saddr: s, daddr: e, dirflg: "w" })
  return `http://maps.apple.com/?${q.toString()}`
}
function buildOsmLink(r: Saved) {
  if (!r.start || !r.end) return "#"
  const engine = r.mode === "walk" ? "foot" : "bicycle"
  const route = `${r.start[0]},${r.start[1]};${r.end[0]},${r.end[1]}`
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_${engine}&route=${route}`
}
function buildGpxHref(r: Saved) {
  if (!r.start || !r.end) return "#"
  const mode = r.mode
  const q = new URLSearchParams({
    mode,
    p: `${r.start[0]},${r.start[1]}`
  })
  return `/api/geo/route.gpx?${q.toString()}&p=${r.end[0]},${r.end[1]}`
}

export default function MyTrailsPage() {
  const [items, setItems] = useState<Saved[]>([])
  const [active, setActive] = useState<Saved | null>(null)

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem("zc_saved_routes") || "[]")
      setItems(list)
      setActive(list[0] || null)
    } catch {}
  }, [])

  function remove(id: number) {
    const next = items.filter(i => i.id !== id)
    setItems(next)
    localStorage.setItem("zc_saved_routes", JSON.stringify(next))
    if (active?.id === id) setActive(next[0] || null)
  }

  const coords = useMemo(() => (active ? extractCoords(active.geojson) : []), [active])
  const hasEndpoints = active?.start && active?.end

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 overflow-x-hidden">
      <Head><title>Moje trasy — Zwiedzaj Chytrze</title></Head>

      <h1 className="text-2xl md:text-3xl font-extrabold mb-4 break-words">
        Moje trasy
      </h1>

      <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
        {/* LISTA TRAS */}
        <aside className="md:col-span-1 min-w-0">
          <ul className="space-y-2">
            {items.map(i => {
              const km = formatKm(i.distance)
              const dur = formatDuration(i.time)
              const activeCls = active?.id === i.id
                ? "bg-orange-50 border-orange-200 dark:bg-gray-800/60"
                : "bg-white dark:bg-gray-800"
              return (
                <li key={i.id} className={`p-3 border rounded ${activeCls} dark:border-gray-700 min-w-0`}>
                  <button className="text-left w-full block min-w-0" onClick={() => setActive(i)}>
                    <div className="font-medium truncate break-words">{i.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {km} · {i.mode}{i.time ? ` · ${dur}` : ""}
                    </div>
                  </button>
                  <div className="flex gap-2 mt-2">
                    <a className="btn btn-sm btn-ghost" href="/trails">Otwórz w planerze</a>
                    <button className="btn btn-sm btn-ghost text-red-600" onClick={() => remove(i.id)}>Usuń</button>
                  </div>
                </li>
              )
            })}
            {items.length === 0 && (
              <li className="text-gray-500 dark:text-gray-400 text-sm">
                Brak zapisanych tras.
              </li>
            )}
          </ul>
        </aside>

        {/* PANEL TRASY */}
        <section className="md:col-span-2 min-w-0">
          {active ? (
            <>
              <div className="mb-3 min-w-0">
                <div className="text-lg md:text-xl font-semibold break-words">{active.name}</div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span className="pill">{formatKm(active.distance)}</span>
                  <span className="pill">{formatDuration(active.time)}</span>
                  <span className="pill">{active.mode}</span>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div className="flex flex-wrap items-center gap-3">
                    {hasEndpoints ? (
                      <a href={buildGoogleLink(active)} target="_blank" rel="noreferrer" className="btn btn-outline">
                        Otwórz w Google Maps
                      </a>
                    ) : (
                      <button className="btn btn-outline" disabled>Otwórz w Google Maps</button>
                    )}

                    {active.mode === "walk" && (
                      hasEndpoints ? (
                        <a href={buildAppleLink(active)} target="_blank" rel="noreferrer" className="btn btn-ghost">
                          Otwórz w Apple Maps
                        </a>
                      ) : (
                        <button className="btn btn-ghost" disabled>Otwórz w Apple Maps</button>
                      )
                    )}

                    {hasEndpoints ? (
                      <>
                        <a href={buildOsmLink(active)} target="_blank" rel="noreferrer" className="btn btn-ghost">
                          Otwórz w OSM
                        </a>
                        <a href={buildGpxHref(active)} target="_blank" rel="noreferrer" className="btn btn-ghost">
                          Pobierz GPX
                        </a>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-ghost" disabled>Otwórz w OSM</button>
                        <button className="btn btn-ghost" disabled>Pobierz GPX</button>
                      </>
                    )}
                  </div>

                  {coords.length > 0 && (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Pkt. na trasie: {coords.length}. (Podgląd mapy został wyłączony.)
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p>Wybierz trasę z listy.</p>
          )}
        </section>
      </div>
    </main>
  )
}
