// pages/api/geo/route.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { geoapifyRoute } from '@/lib/api/geoapify'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const body = req.body || {}
    const data = await geoapifyRoute({ mode: body.mode || 'walk', waypoints: body.waypoints || [] })
    res.status(200).json(data)
  } catch (e: any) {
    console.error("geo/route error:", e?.message || e)
    res.status(400).json({ message: 'Routing failed' })
  }
}
