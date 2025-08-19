// pages/profil.tsx
import Head from 'next/head'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { getServerSession } from 'next-auth/next'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { authOptions } from './api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { useToast } from '@/components/Toaster'

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

function capFirst(s?: string | null) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function formatKm(meters?: number | null) {
  if (!meters || meters <= 0) return null
  return `${(meters / 1000).toFixed(1)} km`
}
function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return '—'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

// Linki do nawigacji bazujące na zapisanych punktach (lat,lon)
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
  if (r.startLat == null || r.startLon == null || r.endLat == null || r.endLon == null) return '#'
  const mode = r.mode === 'walk' ? 'walk' : 'bicycle'
  const q = new URLSearchParams({
    mode,
    p: `${r.startLat},${r.startLon}`,
  })
  // drugi punkt jako drugi parametr p
  const url = `/api/geo/route.gpx?${q.toString()}&p=${r.endLat},${r.endLon}`
  return url
}

export default function Profil({ user, routes }: Props) {
  const router = useRouter()
  const toast = useToast()

  const [activeId, setActiveId] = useState<string | null>(routes[0]?.id ?? null)
  const active = useMemo(() => routes.find(r => r.id === activeId) || null, [routes, activeId])
  const coords = useMemo(() => extractCoords(active?.geojson), [active])

  const displayName =
    capFirst(user.name) ||
    capFirst(user.email?.split('@')[0] || '')

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
    <main className="max-w-6xl mx-auto p-6">
      <Head><title>Twój profil — Zwiedzaj Chytrze</title></Head>

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Cześć, {displayName || 'podróżniku'}!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tu znajdziesz zapisane trasy. Możesz je podejrzeć, usunąć albo wrócić do planera.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/trails"
            className="px-4 py-2 rounded-lg border border-[#f1861e] text-[#f1861e] hover:bg-orange-50 dark:hover:bg-gray-800 transition"
          >
            Przejdź do planera
          </Link>
          <button
            onClick={deleteAccount}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            Usuń konto
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <aside className="md:col-span-1">
          <h2 className="text-lg font-semibold mb-2">Moje trasy ({routes.length})</h2>
          <ul className="space-y-2">
            {routes.map(r => {
              const km = formatKm(r.distance)
              const dur = formatDuration(r.time)
              const activeCls = activeId === r.id ? 'bg-orange-50 border-orange-200' : 'bg-white'
              return (
                <li key={r.id} className={`p-3 border rounded ${activeCls} dark:bg-gray-800 dark:border-gray-700`}>
                  <button
                    className="text-left w-full"
                    onClick={() => setActiveId(r.id)}
                    aria-current={activeId === r.id ? 'true' : 'false'}
                  >
                    <div className="font-medium truncate">{r.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {km ? `${km} · ` : ''}{r.mode}{r.time ? ` · ${dur}` : ''}
                    </div>
                  </button>
                  <div className="flex gap-3 mt-2 text-sm">
                    <Link className="text-[#f1861e] hover:underline" href={`/trails/${r.id}`}>Podgląd</Link>
                    <button className="text-red-600 hover:underline" onClick={() => remove(r.id)}>Usuń</button>
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

        <section className="md:col-span-2">
          {active ? (
            <>
              <div className="mb-3">
                <div className="text-lg font-semibold">{active.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatKm(active.distance) ?? '—'} · {formatDuration(active.time)} · {active.mode}
                </div>
              </div>

              {/* Zamiast RouteMap — przyciski nawigacji i GPX */}
              <div className="card">
                <div className="card-body">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Poniżej szybkie akcje dla wybranej trasy.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={active ? buildGoogleLink(active) : '#'}
                      target="_blank"
                      rel="noreferrer"
                      className={`btn ${hasEndpoints ? 'btn-secondary' : 'btn-disabled'}`}
                      aria-disabled={!hasEndpoints}
                    >
                      Otwórz w Google Maps
                    </a>
                    <a
                      href={active ? buildAppleLink(active) : '#'}
                      target="_blank"
                      rel="noreferrer"
                      className={`btn ${hasEndpoints ? 'btn-ghost' : 'btn-disabled'}`}
                      aria-disabled={!hasEndpoints}
                    >
                      Otwórz w Apple Maps
                    </a>
                    <a
                      href={active ? buildOsmLink(active) : '#'}
                      target="_blank"
                      rel="noreferrer"
                      className={`btn ${hasEndpoints ? 'btn-ghost' : 'btn-disabled'}`}
                      aria-disabled={!hasEndpoints}
                      title={!hasEndpoints ? 'Ta trasa nie ma zapisanych punktów start/meta' : ''}
                    >
                      Otwórz w OSM
                    </a>
                    <a
                      href={active ? buildGpxHref(active) : '#'}
                      target="_blank"
                      rel="noreferrer"
                      className={`btn ${hasEndpoints ? 'btn-ghost' : 'btn-disabled'}`}
                      aria-disabled={!hasEndpoints}
                      title={!hasEndpoints ? 'Ta trasa nie ma zapisanych punktów start/meta' : ''}
                    >
                      Pobierz GPX
                    </a>
                  </div>

                  {/* Podgląd skrócony listy współrzędnych (opcjonalnie) */}
                  {coords.length > 0 && (
                    <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      Pkt. na trasie: {coords.length}. (Podgląd mapy został wyłączony.)
                    </div>
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
