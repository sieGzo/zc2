// pages/api/promocje.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { amadeus } from '@/lib/amadeus'

const ORIGINS = ['WAW', 'BER', 'KRK', 'BUD', 'GDN']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const origin = ORIGINS[Math.floor(Math.random() * ORIGINS.length)]

    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: 'LON', // Tymczasowo, docelowo losuj inne
      departureDate: '2025-08-10',
      adults: '1',
      max: '10',
      currencyCode: 'EUR'
    })

    const data = response.data || []
    const random = data.sort(() => 0.5 - Math.random()).slice(0, 5)

    res.status(200).json({ origin, offers: random })
  } catch (err: any) {
    console.error('Amadeus API error:', err)
    res.status(500).json({ error: 'Błąd pobierania promocji' })
  }
}
