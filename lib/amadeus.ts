// lib/amadeus.ts
import Amadeus from 'amadeus'

// Ustaw w Vercelu np. AMADEUS_ENV=test dla sandboxa (lub prod dla produkcji)
const env = (process.env.AMADEUS_ENV || 'prod').toLowerCase()
const hostname = env === 'test' ? 'test.api.amadeus.com' : 'api.amadeus.com'

export const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET,
  hostname, // 👈 kluczowe
})
