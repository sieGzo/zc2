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

// awaryjne dane, gdy brak kluczy lub API zwróci pustkę/błąd
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

  // Force fresh response kiedy user klika "Odśwież"
  // Działa gdy dodasz ?nocache=1 LUB dowolny parametr _t
  const noCache = req.query.nocache === '1' || typeof req.query._t !== 'undefined'
  if (noCache) {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store')
  } else {
    // normalnie: 1h w CDN + 10 min SWR
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600')
    res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=3600, stale-while-revalidate=600')
  }

  const hasKeys = !!process.env.AMADEUS_CLIENT_ID && !!process.env.AMADEUS_CLIENT_SECRET
  if (!hasKeys) {
    return res.status(200).json(FALLBACK)
  }

  const origins =
    typeof req.query.origins === 'string' && req.query.origins.trim()
      ? req.query.origins.split(',').map((s) => s.trim().toUpperCase())
      : DEFAULT_ORIGINS

  const limit = Math.max(1, Number(req.query.limit ?? 10))
  const currency = (req.query.currency ?? 'PLN').toString().toUpperCase()
  const oneWay = (req.query.oneWay ?? 'true').toString() === 'true'

  try {
    const all: Deal[] = []

    for (const origin of origins) {
      try {
        const rsp = await amadeus.shopping.flightDestinations.get({
          origin,
          oneWay,
          currencyCode: currency,
        } as any)

        const data = (rsp as any)?.data || []
        if (!Array.isArray(data)) continue

        for (const d of data) {
          // w API Amadeus „price” bywa stringiem albo obiektem z „total”
          const rawPrice =
            typeof d?.price === 'object' ? d?.price?.total : d?.price
          const amount = Number(rawPrice)
          if (!Number.isFinite(amount) || amount <= 0) continue

          all.push({
            origin: d.origin,
            destination: d.destination,
            departureDate: d.departureDate,
            returnDate: d.returnDate,
            price: { amount, currency },
          })
        }
      } catch (e) {
        // pojedynczy origin nie blokuje całej listy
        console.warn(`Amadeus: błąd dla origin=${origin}`, (e as any)?.message || e)
      }
    }

    // dedupe po destination (bierzemy najtańszą zduplikowaną destynację)
    const byDest = new Map<string, Deal>()
    for (const deal of all) {
      const existing = byDest.get(deal.destination)
      if (!existing || deal.price.amount < existing.price.amount) {
        byDest.set(deal.destination, deal)
      }
    }
    const deduped = Array.from(byDest.values())

    // sortuj po cenie
    deduped.sort((a, b) => a.price.amount - b.price.amount)

    // żeby "odśwież" dawało różnorodność: bierzemy najtańsze ~50, tasujemy i tniemy do limitu
    const cheapestBucket = deduped.slice(0, 50)
    for (let i = cheapestBucket.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[cheapestBucket[i], cheapestBucket[j]] = [cheapestBucket[j], cheapestBucket[i]]
    }
    const top = cheapestBucket.slice(0, limit)

    if (!top.length) return res.status(200).json(FALLBACK)

    return res.status(200).json(top)
  } catch (err) {
    console.warn('Amadeus API error (flights):', (err as any)?.response?.data || (err as any)?.message || err)
    return res.status(200).json(FALLBACK)
  }
}
