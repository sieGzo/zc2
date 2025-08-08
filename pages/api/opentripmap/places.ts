// pages/api/opentripmap/places.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchPlacesByRadius } from '@/lib/api/opentripmap'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { lat, lon, radius, kinds, limit } = req.query
    const data = await fetchPlacesByRadius({
      lat: Number(lat), lon: Number(lon),
      radius: radius ? Number(radius) : undefined,
      kinds: kinds ? String(kinds) : undefined,
      limit: limit ? Number(limit) : undefined
    })
    res.status(200).json(data)
  } catch (e: any) {
    console.error('opentripmap places error:', e)
    res.status(200).json([]) // be nice to UI
  }
}
