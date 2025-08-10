// pages/profil.tsx
import Head from 'next/head'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './api/auth/[...nextauth]'
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

type Props = {
  user: { name: string | null; email: string | null }
  routes: DbRoute[]
}

function extractCoords(geojson: any): [number, number][] {
  const out: [number, number][] = []
  if (!geojson) return out
  // wspieramy zarówno FeatureCollection jak i czystego LineStringa
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

export default function Profil({ user, routes }: Props) {
  const [activeId, setActiveId] = useState<string | null>(routes[0]?.id ?? null)
  const active = useMemo(() => routes.find(r => r.id === activeId) || null, [routes, activeId])
  const coords = useMemo(() => extractCoords(active?.geojson), [active])

  async function remove(id: string) {
    if (!confirm('Usunąć tę trasę?')) return
    const res = await fetch(`/api/routes/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      alert(j.error || `Błąd usuwania (HTTP ${res.status})`)
      return
    }
    // odśwież SSR bez pełnego reloadu:
    window.location.reload()
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <Head><title>Twój profil — Zwiedzaj Chytrze</title></Head>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Twój profil</h1>
          <p className="text-gray-600">{user.name || user.email || '—'}</p>
        </div>
        <Link href="/trails" className="px-3 py-2 rounded-lg border hover:bg-gray-50">Przejdź do planera</Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Lista tras */}
        <aside className="md:col-span-1">
          <h2 className="text-lg font-semibold mb-2">Moje trasy ({routes.length})</h2>
          <ul className="space-y-2">
            {routes.map(r => (
              <li key={r.id} className={`p-3 border rounded ${activeId === r.id ? 'bg-orange-50' : ''}`}>
                <button className="text-left w-full" onClick={() => setActiveId(r.id)}>
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-xs text-gray-600">
                    {(r.distance ?? 0) > 0 ? `${((r.distance ?? 0) / 1000).toFixed(1)} km` : ''} · {r.mode}
                  </div>
                </button>
                <div className="flex gap-3 mt-2 text-sm">
                  <Link className="text-blue-600 underline" href={`/trails/${r.id}`}>Podgląd</Link>
                  <button className="text-red-600" onClick={() => remove(r.id)}>Usuń</button>
                </div>
              </li>
            ))}
            {routes.length === 0 && <li className="text-gray-500">Brak zapisanych tras.</li>}
          </ul>
        </aside>

        {/* Mapa + szczegóły */}
        <section className="md:col-span-2">
          {active ? (
            <>
              <div className="mb-3">
                <div className="text-lg font-semibold">{active.name}</div>
                <div className="text-sm text-gray-600">
                  {(active.distance ?? 0) > 0 && `${((active.distance ?? 0) / 1000).toFixed(1)} km`} ·{' '}
                  {Math.round((active.time ?? 0) / 60)} min
                </div>
              </div>
              <RouteMap
                start={active.startLat && active.startLon ? [active.startLat, active.startLon] : undefined}
                end={active.endLat && active.endLon ? [active.endLat, active.endLon] : undefined}
                coords={coords}
                onPointSelect={() => {}}
              />
            </>
          ) : (
            <p>Wybierz trasę z listy.</p>
          )}
        </section>
      </div>
    </main>
  )
}

export async function getServerSideProps(
  ctx: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<Props>> {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session) {
    return {
      redirect: {
        destination: `/login?callbackUrl=${encodeURIComponent('/profil')}`,
        permanent: false,
      },
    }
  }

  const anyUser = session.user as any
  let userId: string | null = anyUser?.id ?? null
  if (!userId && anyUser?.email) {
    const u = await prisma.user.findUnique({ where: { email: anyUser.email } })
    userId = u?.id ?? null
  }

  const routes = await prisma.route.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, mode: true, distance: true, time: true, geojson: true,
      startLat: true, startLon: true, endLat: true, endLon: true, createdAt: true,
    },
  })

  return {
    props: {
      user: { name: anyUser?.name ?? null, email: anyUser?.email ?? null },
      routes: JSON.parse(JSON.stringify(routes)) as DbRoute[],
    },
  }
}
