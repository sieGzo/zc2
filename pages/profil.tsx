// pages/profil.tsx
import Head from 'next/head'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { getServerSession } from 'next-auth/next'
import { signOut } from 'next-auth/react'
import { authOptions } from './api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { useToast } from '@/components/Toaster'

type DbRoute = {
  id: string
  name: string
  mode: 'walk' | 'bicycle' | string
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
const modeLabel = (m?: string) => (m === 'walk' ? 'piesza' : m === 'bicycle' ? 'rowerowa' : m || '—')
const formatKm = (meters?: number | null) => (!meters || meters <= 0 ? '—' : `${(meters / 1000).toFixed(1)} km`)
function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return '—'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

// Linki
function buildGoogleLink(r: DbRoute) {
  const travelmode = r.mode === 'walk' ? 'walking' : 'bicycling'
  const s = r.startLat != null && r.startLon != null ? `${r.startLat},${r.startLon}` : ''
  const e = r.endLat != null && r.endLon != null ? `${r.endLat},${r.endLon}` : ''
  const q = new URLSearchParams({ api: '1', origin: s, destination: e, travelmode })
  return `https://www.google.com/maps/dir/?${q.toString()}`
}
function buildAppleLink(r: DbRoute) {
  const s = r.startLat != null && r.startLon != null ? `${r.startLat},${r.startLon}` : ''
  const e = r.endLat != null && r.endLon != null ? `${r.endLat},${r.endLon}` : ''
  const q = new URLSearchParams({ saddr: s, daddr: e, dirflg: 'w' }) // tylko piesza
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

export default function Profil({ user, routes }: Props) {
  const toast = useToast()
  const [activeId, setActiveId] = useState<string | null>(routes[0]?.id ?? null)
  const active = useMemo(() => routes.find(r => r.id === activeId) || null, [routes, activeId])
  const coords = useMemo(() => extractCoords(active?.geojson), [active])

  const displayName =
    (user.name || user.email?.split('@')[0] || '')
      .replace(/^./, c => c.toUpperCase())

  async function remove(id: string) {
    if (!confirm('Usunąć tę trasę?')) return
    const res = await fetch(`/api/routes/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      toast.error(j.error || `Błąd usuwania (HTTP ${res.status})`)
      return
    }
    toast.success('Trasa usunięta')
    window.location.reload()
  }
  async function deleteAccount() {
    if (!confirm('Na pewno usunąć konto? Tej operacji nie da się cofnąć.')) return
    const r = await fetch('/api/auth/delete-account', { method: 'POST' })
    if (!r.ok) {
      const j = await r.json().catch(() => ({}))
      toast.error(j.message || 'Nie udało się usunąć konta.')
      return
    }
    toast.success('Konto usunięte')
    await signOut({ callbackUrl: '/' })
  }

  const hasEndpoints =
    active?.startLat != null && active?.startLon != null && active?.endLat != null && active?.endLon != null

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 overflow-x-hidden">
      <Head><title>Twój profil — Zwiedzaj Chytrze</title></Head>

      {/* HEADER: na mobile pionowo, od sm obok siebie; wrap gdy brakuje miejsca */}
      <header className="mb-5 sm:mb-6">
        <div className="flex flex-col gap-2 min-w-0">
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight break-words">
            Cześć, {displayName || 'podróżniku'}!
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Tu znajdziesz zapisane trasy. Możesz je podejrzeć, usunąć albo wrócić do planera.
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <Link href="/trails" className="btn btn-outline w-full sm:w-auto justify-center">Przejdź do planera</Link>
          <button onClick={deleteAccount} className="btn btn-primary bg-red-600 hover:bg-red-700 w-full sm:w-auto">
            Usuń konto
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
        {/* LISTA TRAS */}
        <aside className="md:col-span-1 min-w-0">
          <h2 className="text-base md:text-lg font-semibold mb-2">Moje trasy ({routes.length})</h2>
          <ul className="space-y-2">
            {routes.map(r => {
              const km = formatKm(r.distance)
              const dur = formatDuration(r.time)
              const isActive = activeId === r.id
              const activeCls = isActive
                ? 'bg-orange-50 border-orange-200 dark:bg-gray-800/60'
                : 'bg-white dark:bg-gray-800'
              return (
                <li key={r.id} className={`p-3 border rounded ${activeCls} dark:border-gray-700 min-w-0`}>
                  <button
                    className="text-left w-full block min-w-0"
                    onClick={() => setActiveId(r.id)}
                    aria-current={isActive ? 'true' : 'false'}
                  >
                    <div className="font-medium truncate break-words">{r.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {km} · {modeLabel(r.mode)}{r.time ? ` · ${dur}` : ''}
                    </div>
                  </button>
                  <div className="flex gap-2 mt-2">
                    <Link className="btn btn-sm btn-ghost" href={`/trails/${r.id}`}>Podgląd</Link>
                    <button className="btn btn-sm btn-ghost text-red-600" onClick={() => remove(r.id)}>Usuń</button>
                  </div>
                </li>
              )
            })}
            {routes.length === 0 && (
              <li className="text-gray-500 dark:text-gray-400 text-sm">
                Brak zapisanych tras. Zacznij od{' '}
                <Link className="text-[#f1861e] underline" href="/trails">planera</Link>.
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
                  <span className="pill">{modeLabel(active.mode)}</span>
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

                    {/* Apple tylko piesza */}
                    {active.mode === 'walk' ? (
                      hasEndpoints ? (
                        <a href={buildAppleLink(active)} target="_blank" rel="noreferrer" className="btn btn-ghost">
                          Otwórz w Apple Maps
                        </a>
                      ) : (
                        <button className="btn btn-ghost" disabled>Otwórz w Apple Maps</button>
                      )
                    ) : null}

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

export async function getServerSideProps(
  ctx: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<Props>> {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session) {
    return {
      redirect: { destination: `/login?callbackUrl=${encodeURIComponent('/profil')}`, permanent: false }
    }
  }

  const anyUser = session.user as any
  let userId: string | null = anyUser?.id ?? null
  if (!userId && anyUser?.email) {
    const u = await prisma.user.findUnique({ where: { email: anyUser.email } })
    userId = u?.id ?? null
  }

  const routes = userId
    ? await prisma.route.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, mode: true, distance: true, time: true, geojson: true,
          startLat: true, startLon: true, endLat: true, endLon: true, createdAt: true,
        },
      })
    : []

  return {
    props: {
      user: { name: anyUser?.name ?? null, email: anyUser?.email ?? null },
      routes: JSON.parse(JSON.stringify(routes)) as DbRoute[],
    },
  }
}
