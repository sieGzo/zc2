// pages/api/geo/place/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { geoapifyPlaceDetails } from '@/lib/api/geoapify'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id || typeof id !== 'string') return res.status(400).json({ message: 'Bad request' })
  try {
    const data = await geoapifyPlaceDetails(id)
    res.status(200).json(data)
  } catch (e: any) {
    console.error("geo/place error:", e?.message || e)
    res.status(404).json({ message: 'Not found' })
  }
}
