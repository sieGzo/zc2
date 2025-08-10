// pages/api/skyscanner.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!process.env.RAPIDAPI_KEY) {
    return res.status(200).json([
      { origin: 'WRO', destination: 'LON', price: { amount: 350, currency: 'PLN' } },
      { origin: 'GDN', destination: 'OSL', price: { amount: 220, currency: 'PLN' } },
    ])
  }

  try {
    const params = new URLSearchParams({
      origin: 'WRO',
      destination: 'LHR',
      departDate: '2025-08-15',
      currency: 'PLN',
      market: 'PL',
      locale: 'pl-PL',
    })

    const rsp = await fetch(
      `https://skyscanner80.p.rapidapi.com/api/v1/flights/searchFlights?${params}`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
          'X-RapidAPI-Host': 'skyscanner80.p.rapidapi.com',
        },
      }
    )

    if (!rsp.ok) throw new Error(`HTTP ${rsp.status}`)
    const json = await rsp.json()

    // Konwersja do naszego formatu
    const deals =
      json.data?.flights?.map((f: any) => ({
        origin: f.origin?.code,
        destination: f.destination?.code,
        departureDate: f.departureDate,
        returnDate: f.returnDate,
        price: { amount: f.price?.amount, currency: f.price?.currency || 'PLN' },
      })) || []

    res.status(200).json(deals)
  } catch (err) {
    console.error('SkyScanner API error:', err)
    res.status(500).json([])
  }
}
