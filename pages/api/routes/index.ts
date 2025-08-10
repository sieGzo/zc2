import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

// wyciąga [lon,lat] z różnych wariantów GeoJSON
function extractLonLat(geojson: any): [number, number][] {
  const out: [number, number][] = []
  if (!geojson) return out

  const pushLine = (coords: [number, number][]) => {
    for (const [lon, lat] of coords) out.push([lon, lat])
  }

  if (geojson.type === 'FeatureCollection') {
    for (const f of geojson.features ?? []) {
      const g = f?.geometry
      if (!g) continue
      if (g.type === 'LineString') pushLine(g.coordinates ?? [])
      if (g.type === 'MultiLineString') for (const seg of g.coordinates ?? []) pushLine(seg)
    }
  } else if (geojson.type === 'Feature') {
    const g = geojson.geometry
    if (g?.type === 'LineString') pushLine(g.coordinates ?? [])
    if (g?.type === 'MultiLineString') for (const seg of g.coordinates ?? []) pushLine(seg)
  } else if (geojson.type === 'LineString') {
    pushLine(geojson.coordinates ?? [])
  } else if (geojson.type === 'MultiLineString') {
    for (const seg of geojson.coordinates ?? []) pushLine(seg)
  }

  return out
}

async function getUserIdFromSession(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const anyUser = session?.user as any
  if (!anyUser) return null

  // 1) jeśli mamy id w sesji – sprawdź czy taki user istnieje
  if (anyUser.id) {
    const exists = await prisma.user.findUnique({ where: { id: String(anyUser.id) }, select: { id: true } })
    if (exists) return exists.id
  }

  // 2) fallback po emailu
  if (anyUser.email) {
    const u = await prisma.user.findUnique({ where: { email: anyUser.email }, select: { id: true } })
    if (u) return u.id
  }

  // 3) brak usera w bazie → zapis jako „gość” (userId = null)
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserIdFromSession(req, res) // może być null (gość)

  if (req.method === 'GET') {
    try {
      const routes = await prisma.route.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return res.status(200).json(routes)
    } catch (e: any) {
      console.error('ROUTES_GET_ERROR', e)
      return res.status(500).json({ error: String(e?.message || e) })
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        name,
        mode,            // 'walk' | 'bicycle' (w schemacie masz String)
        startLat: inStartLat,
        startLon: inStartLon,
        endLat: inEndLat,
        endLon: inEndLon,
        distance,        // m
        time,            // s
        geojson,         // FeatureCollection/Feature/LineString/MultiLineString
        start,           // [lat, lon]  ← nowy format z frontu
        end,             // [lat, lon]  ← nowy format z frontu
      } = req.body || {}

      // --- NOWE: obsługa start/end jako tablic [lat, lon] ---
      let startLat: number | undefined = inStartLat
      let startLon: number | undefined = inStartLon
      let endLat: number | undefined = inEndLat
      let endLon: number | undefined = inEndLon
      if (Array.isArray(start) && start.length === 2) {
        startLat = typeof startLat === 'number' ? startLat : Number(start[0])
        startLon = typeof startLon === 'number' ? startLon : Number(start[1])
      }
      if (Array.isArray(end) && end.length === 2) {
        endLat = typeof endLat === 'number' ? endLat : Number(end[0])
        endLon = typeof endLon === 'number' ? endLon : Number(end[1])
      }
      // --- KONIEC DODATKU ---

      // 1) walidacja nazwy
      if (!name) return res.status(400).json({ error: 'name required' })

      // 2) wyciągnij linię z GeoJSON (jeśli brak coordsów, będzie 400)
      const lonlat = extractLonLat(geojson) // [lon,lat]
      if (lonlat.length < 2) {
        return res.status(400).json({ error: 'geojson with a LineString required' })
      }

      // 3) wylicz start/end jeśli nadal nie ma
      const [sLon, sLat] = lonlat[0]
      const [eLon, eLat] = lonlat[lonlat.length - 1]

      const _startLat = typeof startLat === 'number' ? startLat : sLat
      const _startLon = typeof startLon === 'number' ? startLon : sLon
      const _endLat   = typeof endLat   === 'number' ? endLat   : eLat
      const _endLon   = typeof endLon   === 'number' ? endLon   : eLon

      // 4) zapis — trzymamy oryginalny geojson „as is”
      const created = await prisma.route.create({
        data: {
          userId,
          name,
          mode: mode ?? 'walk',
          startLat: _startLat,
          startLon: _startLon,
          endLat: _endLat,
          endLon: _endLon,
          distance: distance ?? 0,
          time: time ?? 0,
          geojson,
        },
      })
      return res.status(201).json(created)
    } catch (e: any) {
      console.error('ROUTES_POST_ERROR', e)
      return res.status(500).json({ error: String(e?.message || e) })
    }
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).end('Method Not Allowed')
}
