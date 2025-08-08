// pages/api/opentripmap/place/[xid].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchPlaceDetails } from '@/lib/api/opentripmap'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { xid } = req.query
  if (!xid || typeof xid !== 'string') return res.status(400).json({ message: 'Bad request' })
  try {
    const data = await fetchPlaceDetails(xid)
    res.status(200).json(data)
  } catch (e: any) {
    console.error('opentripmap xid error:', e)
    res.status(404).json({ message: 'Not found' })
  }
}
