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

// link builders
function buildGoogleLink(r: DbRoute) {
  const travelmode = r.mode === 'walk' ? 'walking' : 'bicycling'
  const s = r.startLat != null && r.startLon != null ? `${r.startLat},${r.startLon}` : ''
  const e = r.endLat != null && r.endLon != null ? `${r.endLat},${r.endLon}` : ''
  const q = new URLSearchParams({ api: '1', origin: s, destination: e, travelmode })
  return `https://www.google.com/maps/dir/?${q.toString()}`
}
function buildAppleLink(r: DbRoute) {
  const dirflg = r.mode === 'walk' ? 'w' : 'r'
  const s = r.startLat != null && r.startLon != null ? `${r.startLat},${r.startLon}` : ''
  const e = r.endLat != null && r.endLon != null ? `${r.endLat},${r.endLon}` : ''
  const q = new URLSearchParams({ saddr: s, daddr: e, dirflg })
  return `http://maps.apple.com/?${q.toString()}`
}
function buildOsmLink(r: DbRoute) {
  if (r.startLat == null || r.startLon == null || r.endLat == null || r.endLon == null) return '#'
  const engine = r.mode === 'walk' ? 'foot' : 'bicycle'
  const route = `${r.startLat},${r.startLon};${r.endLat},${r.endLon}`
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_${engine}&route=${route}`
}
function buildGpxHref(r: DbRoute) {
  return `/api/routes/${r.id}/gpx`
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

  return (
    <>
      <Head><title>{route.name} — Zwiedzaj Chytrze</title></Head>
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-3xl font-bold">{route.name}</h1>
          <Link href="/trails" className="text-[#f1861e] underline">← Wszystkie trasy</Link>
        </div>

        <p className="text-gray-700 dark:text-gray-300">
          Tryb: <strong>{route.mode}</strong> • {(route.distance ?? 0) > 0 && `${((route.distance ?? 0)/1000).toFixed(1)} km`} •{' '}
          {Math.round((route.time ?? 0)/60)} min • {new Date(route.createdAt).toLocaleString()}
        </p>

        <section className="rounded-xl overflow-hidden border p-4">
          <div className="flex flex-wrap gap-3">
            <a href={buildGoogleLink(route)} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
              Otwórz w Google Maps
            </a>
            <a href={buildAppleLink(route)} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
              Otwórz w Apple Maps
            </a>
            <a href={buildOsmLink(route)} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
              Otwórz w OSM
            </a>
            <a href={buildGpxHref(route)} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
              Pobierz GPX
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-2">Podgląd mapy został wyłączony.</p>
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
