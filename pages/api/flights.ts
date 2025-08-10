// pages/api/flights.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { amadeus } from '@/lib/amadeus'

type Deal = {
  origin: string
  destination: string
  departureDate?: string
  returnDate?: string
  price: { amount: number; currency: string }
}

const DEFAULT_ORIGINS = ['WAW', 'KRK', 'GDN', 'WRO', 'BER', 'BUD']

const FALLBACK: Deal[] = [
  { origin: 'WAW', destination: 'BCN', price: { amount: 289, currency: 'PLN' } },
  { origin: 'KRK', destination: 'ROM', price: { amount: 319, currency: 'PLN' } },
  { origin: 'GDN', destination: 'OSL', price: { amount: 199, currency: 'PLN' } },
  { origin: 'WRO', destination: 'PAR', price: { amount: 339, currency: 'PLN' } },
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' })
  }

  // Jeśli w query jest nocache=1 → wyłącz cache
  if (req.query.nocache === '1') {
    res.setHeader('Cache-Control', 'no-store')
  } else {
    // standardowo cache 1h + stale 10 min
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600')
  }

  const hasKeys = !!process.env.AMADEUS_CLIENT_ID && !!process.env.AMADEUS_CLIENT_SECRET
  if (!hasKeys) {
    return res.status(200).json(FALLBACK)
  }

  const origins =
    typeof req.query.origins === 'string' && req.query.origins.trim()
      ? req.query.origins.split(',').map((s) => s.trim().toUpperCase())
      : DEFAULT_ORIGINS

  const limit = Number(req.query.limit ?? 10)
  const currency = (req.query.currency ?? 'PLN').toString().toUpperCase()
  const oneWay = (req.query.oneWay ?? 'true').toString() === 'true'

  try {
    const all: Deal[] = []

    for (const origin of origins) {
      const rsp = await amadeus.shopping.flightDestinations.get({
        origin,
        oneWay,
        currencyCode: currency,
      } as any)

      const data = (rsp as any)?.data || []
      if (!Array.isArray(data)) continue

      for (const d of data) {
        const rawPrice =
          typeof d?.price === 'object'
            ? d?.price?.total
            : d?.price
        const amount = Number(rawPrice) || 0
        if (!amount) continue

        all.push({
          origin: d.origin,
          destination: d.destination,
          departureDate: d.departureDate,
          returnDate: d.returnDate,
          price: { amount, currency },
        })
      }
    }

    all.sort((a, b) => a.price.amount - b.price.amount)
    const top = all.slice(0, Math.max(1, limit))

    if (!top.length) return res.status(200).json(FALLBACK)

    return res.status(200).json(top)
  } catch (err: any) {
    console.warn('Amadeus API error (flights):', err?.response?.data || err?.message || err)
    return res.status(200).json(FALLBACK)
  }
}
