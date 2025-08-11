// lib/amadeus.ts
import Amadeus from 'amadeus'

const clientId = process.env.AMADEUS_CLIENT_ID
const clientSecret = process.env.AMADEUS_CLIENT_SECRET

// Użyj produkcyjnego hosta; dla sandboxa: 'test' lub hostname: 'test.api.amadeus.com'
export const amadeus = new Amadeus({
  clientId,
  clientSecret,
  // jeśli masz klucze do sandboxa, odkomentuj to:
//  hostname: 'test.api.amadeus.com',
})
