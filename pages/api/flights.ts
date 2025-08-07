import type { NextApiRequest, NextApiResponse } from 'next'
import { amadeus } from '../../lib/amadeus'

const ORIGINS = ['WAW', 'BER', 'KRK', 'BUD', 'GDN']
const DESTINATIONS = ['LON', 'PAR', 'ROM', 'BCN', 'AMS', 'ATH', 'VIE', 'CPH', 'MAD']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const departureDate = new Date()
    departureDate.setDate(departureDate.getDate() + 30)
    const formattedDate = departureDate.toISOString().split('T')[0]

    const results = await Promise.all(
      Array.from({ length: 6 }).map(async () => {
        const origin = ORIGINS[Math.floor(Math.random() * ORIGINS.length)]
        const destination = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)]

        try {
          const response = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate: formattedDate,
            adults: 1,
            max: 1,
            currencyCode: 'PLN',
          })

          const offer = response.data?.[0]

          return {
            origin,
            destination,
            departureDate: formattedDate,
            price: offer?.price?.total ?? null,
            currency: offer?.price?.currency ?? 'PLN',
          }
        } catch (error) {
          console.warn(`Brak danych dla ${origin} → ${destination}`)
          return null
        }
      })
    )

    const validOffers = results.filter(Boolean)
    res.status(200).json(validOffers)
  } catch (err) {
    console.error('❌ Błąd pobierania danych z Amadeus:', err)
    res.status(500).json({ error: 'Błąd pobierania danych z API' })
  }
}
