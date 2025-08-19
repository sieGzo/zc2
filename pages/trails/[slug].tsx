// pages/trails/[slug].tsx
import Head from 'next/head'
import type { GetServerSideProps, GetServerSidePropsContext } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

type DbRoute = {
  id: string
  name: string
  mode: string
  distance: number | null
  time: number | null
  geojson: any
  startLat: number | null
  startLon: number | null
  endLat: number | null
  endLon: number | null
  createdAt: string
}

type Props = { route: DbRoute | null }

// Link builders
function buildGoogleLink(r: DbRoute) {
  const travelmode = r.mode === 'walk' ? 'walking' : 'bicycling'
  const s = r.startLat != null && r.startLon != null ? `${r.startLat},${r.startLon}` : ''
  const e = r.endLat != null && r.endLon != null ? `${r.endLat},${r.endLon}` : ''
  const q = new URLSearchParams({ api: '1', origin: s, destination: e, travelmode })
  return `https://www.google.com/maps/dir/?${q.toString()}`
}
function buildAppleLink(r: DbRoute) {
  // Apple: tylko pieszo (brak bicycling)
  const s = r.startLat != null && r.startLon != null ? `${r.startLat},${r.startLon}` : ''
  const e = r.endLat != null && r.endLon != null ? `${r.endLat},${r.endLon}` : ''
  const q = new URLSearchParams({ saddr: s, daddr: e, dirflg: 'w' })
  return `http://maps.apple.com/?${q.toString()}`
}
function buildOsmLink(r: DbRoute) {
  if (r.startLat == null || r.startLon == null || r.endLat == null || r.endLon == null) return '#'
  const engine = r.mode === 'walk' ? 'foot' : 'bicycle'
  const route = `${r.startLat},${r.startLon};${r.endLat},${r.endLon}`
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_${engine}&route=${route}`
}
function buildGpxHref(r: DbRoute) {
  // GPX bez ponownego routingu – z DB
  return `/api/routes/${r.id}/gpx`
}

function formatKm(m: number | null | undefined) {
  if (!m || m <= 0) return '—'
  return `${(m / 1000).toFixed(1)} km`
}
function formatDuration(s: number | null | undefined) {
  if (!s || s <= 0) return '—'
  const minutes = Math.round(s / 60)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60), m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export default function TrailPage({ route }: Props) {
  if (!route) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <Head><title>Trasa — Zwiedzaj Chytrze</title></Head>
        <h1 className="text-2xl font-bold mb-4">Nie znaleziono trasy</h1>
        <Link href="/trails" className="text-[#f1861e] underline">← Wróć do planera</Link>
      </main>
    )
  }

  const hasEndpoints =
    route.startLat != null && route.startLon != null && route.endLat != null && route.endLon != null

  return (
    <>
      <Head><title>{route.name} — Zwiedzaj Chytrze</title></Head>
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-3xl font-bold">{route.name}</h1>
          <Link href="/trails" className="text-[#f1861e] underline">← Wszystkie trasy</Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <span className="pill">{route.mode}</span>
          <span className="pill">{formatKm(route.distance)}</span>
          <span className="pill">{formatDuration(route.time)}</span>
          <span className="pill">{new Date(route.createdAt).toLocaleString()}</span>
        </div>

        <section className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Otwórz w nawigacji lub pobierz ślad GPX.
            </p>
            <div className="flex flex-wrap gap-3">
              {hasEndpoints ? (
                <a href={buildGoogleLink(route)} target="_blank" rel="noreferrer" className="btn btn-outline">
                  Otwórz w Google Maps
                </a>
              ) : (
                <button className="btn btn-outline" disabled>Otwórz w Google Maps</button>
              )}

              {/* Apple tylko dla pieszych */}
              {route.mode === 'walk' ? (
                hasEndpoints ? (
                  <a href={buildAppleLink(route)} target="_blank" rel="noreferrer" className="btn btn-ghost">
                    Otwórz w Apple Maps
                  </a>
                ) : (
                  <button className="btn btn-ghost" disabled>Otwórz w Apple Maps</button>
                )
              ) : null}

              {hasEndpoints ? (
                <>
                  <a href={buildOsmLink(route)} target="_blank" rel="noreferrer" className="btn btn-ghost">
                    Otwórz w OSM
                  </a>
                  <a href={buildGpxHref(route)} target="_blank" rel="noreferrer" className="btn btn-ghost">
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

            <p className="text-xs text-gray-500 mt-3">Podgląd mapy został wyłączony.</p>
          </div>
        </section>
      </main>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  ctx: GetServerSidePropsContext
) => {
  const slug = ctx.params?.slug as string | undefined
  if (!slug) return { props: { route: null } }

  const r = await prisma.route.findUnique({
    where: { id: slug },
    select: {
      id: true, name: true, mode: true, distance: true, time: true, geojson: true,
      startLat: true, startLon: true, endLat: true, endLon: true, createdAt: true,
    },
  })

  return { props: { route: r ? JSON.parse(JSON.stringify(r)) : null } }
}
