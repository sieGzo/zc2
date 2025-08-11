// pages/api/amadeus-ping.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { amadeus } from '@/lib/amadeus'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const hasKeys = !!process.env.AMADEUS_CLIENT_ID && !!process.env.AMADEUS_CLIENT_SECRET
    if (!hasKeys) {
      return res.status(200).json({ ok: false, stage: 'env', message: 'Brak AMADEUS_* w env' })
    }

    // 1) spróbuj pobrać token (SDK robi to automatycznie przy pierwszym wywołaniu)
    // 2) zrób minimalne zapytanie (popularny endpoint, ma zawsze coś)
    const rsp = await amadeus.shopping.flightDestinations.get({
      origin: 'WAW',
      oneWay: true,
      currencyCode: 'PLN',
    } as any)

    const data = (rsp as any)?.data || []
    res.status(200).json({
      ok: true,
      stage: 'api',
      count: Array.isArray(data) ? data.length : 0,
      sample: Array.isArray(data) ? data.slice(0, 3) : [],
    })
  } catch (err: any) {
    // NIE logujemy sekretów — tylko ogólny komunikat:
    res.status(200).json({
      ok: false,
      stage: 'api-error',
      message: err?.message || 'Unknown error',
      details: err?.response?.data || null,
    })
  }
}
