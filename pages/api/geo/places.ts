// pages/api/geo/places.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { geoapifyPlacesByCircle } from '@/lib/api/geoapify'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { lat, lon, radius, categories, limit } = req.query
    const data = await geoapifyPlacesByCircle({
      lat: Number(lat),
      lon: Number(lon),
      radius: radius ? Number(radius) : undefined,
      categories: categories ? String(categories) : undefined,
      limit: limit ? Number(limit) : undefined,
    })
    res.status(200).json(data)
  } catch (e: any) {
    console.error("geo/places error:", e?.message || e)
    // graceful fallback with empty FeatureCollection
    res.status(200).json({ type: "FeatureCollection", features: [] })
  }
}
