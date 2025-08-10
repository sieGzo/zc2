// pages/trails/[slug].tsx
import Head from 'next/head'
import type { GetServerSideProps, GetServerSidePropsContext } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

const RouteMap = dynamic(() => import('@/components/RouteMap'), { ssr: false })

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

function extractCoords(geojson: any): [number, number][] {
  const out: [number, number][] = []
  if (!geojson) return out
  if (geojson.type === 'FeatureCollection') {
    for (const f of geojson.features ?? []) {
      const g = f?.geometry
      if (!g) continue
      if (g.type === 'LineString') {
        for (const [lon, lat] of g.coordinates) out.push([lat, lon])
      } else if (g.type === 'MultiLineString') {
        for (const seg of g.coordinates) for (const [lon, lat] of seg) out.push([lat, lon])
      }
    }
  } else if (geojson.type === 'LineString') {
    for (const [lon, lat] of geojson.coordinates ?? []) out.push([lat, lon])
  }
  return out
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

  const coords = extractCoords(route.geojson)
  const start = route.startLat && route.startLon ? [route.startLat, route.startLon] as [number, number] : undefined
  const end = route.endLat && route.endLon ? [route.endLat, route.endLon] as [number, number] : undefined

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

        <section className="rounded-xl overflow-hidden border">
          <RouteMap start={start} end={end} coords={coords} onPointSelect={() => {}} />
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
