// pages/api/kiwi.ts
import type { NextApiRequest, NextApiResponse } from 'next'

const KIWI_API = 'https://api.tequila.kiwi.com/v2/search'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!process.env.KIWI_API_KEY) {
    return res.status(200).json([
      { origin: 'WAW', destination: 'BCN', price: { amount: 299, currency: 'PLN' } },
      { origin: 'KRK', destination: 'ROM', price: { amount: 329, currency: 'PLN' } },
    ])
  }

  try {
    const params = new URLSearchParams({
      fly_from: 'WAW', // Możesz losować lub przyjmować z req.query
      dateFrom: '15/08/2025',
      dateTo: '31/08/2025',
      curr: 'PLN',
      limit: '10',
    })

    const rsp = await fetch(`${KIWI_API}?${params}`, {
      headers: { apikey: process.env.KIWI_API_KEY },
    })

    if (!rsp.ok) throw new Error(`HTTP ${rsp.status}`)
    const json = await rsp.json()

    const deals = (json.data || []).map((d: any) => ({
      origin: d.cityFrom || d.flyFrom,
      destination: d.cityTo || d.flyTo,
      departureDate: d.local_departure?.split('T')[0],
      returnDate: d.route?.[1]?.local_departure?.split('T')[0],
      price: { amount: d.price, currency: 'PLN' },
    }))

    res.status(200).json(deals)
  } catch (err) {
    console.error('Kiwi API error:', err)
    res.status(500).json([])
  }
}
