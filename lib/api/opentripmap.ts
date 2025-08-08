// lib/api/opentripmap.ts
const API_URL = 'https://api.opentripmap.com/0.1/en/places'
const API_KEY = process.env.OPENTRIPMAP_API_KEY || process.env.NEXT_PUBLIC_OPENTRIPMAP_API_KEY

export type Place = {
  xid: string
  name: string
  kinds?: string
  lat: number
  lon: number
  preview?: { source: string }
}

export async function fetchPlacesByRadius({
  lat, lon, radius = 5000, kinds = 'interesting_places,natural', limit = 20
}: { lat: number; lon: number; radius?: number; kinds?: string; limit?: number }): Promise<Place[]> {
  if (!API_KEY) return mockPlaces(lat, lon)
  const params = new URLSearchParams({
    apikey: API_KEY,
    radius: String(radius),
    lon: String(lon),
    lat: String(lat),
    kinds,
    limit: String(limit),
    format: 'json',
    rate: '2',
    src_attr: 'true'
  })
  const res = await fetch(`${API_URL}/radius?${params}`)
  if (!res.ok) throw new Error('OpenTripMap radius error')
  const data = await res.json()
  return data
}

export async function fetchPlaceDetails(xid: string) {
  if (!API_KEY) return mockPlaceDetails(xid)
  const res = await fetch(`${API_URL}/xid/${xid}?apikey=${API_KEY}`)
  if (!res.ok) throw new Error('OpenTripMap place error')
  return res.json()
}

// --- Mocks when no API key present ---
function mockPlaces(lat: number, lon: number): Place[] {
  return [
    { xid: 'MOCK1', name: 'Park Miejski', kinds: 'natural,parks', lat: lat + 0.01, lon: lon + 0.01,
      preview: { source: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800' } },
    { xid: 'MOCK2', name: 'Muzeum Regionalne', kinds: 'cultural,museums', lat: lat - 0.008, lon: lon - 0.008,
      preview: { source: 'https://images.unsplash.com/photo-1549890762-0a3f8933bcf4?w=800' } },
  ]
}

function mockPlaceDetails(xid: string) {
  return {
    xid,
    name: xid === 'MOCK2' ? 'Muzeum Regionalne' : 'Park Miejski',
    address: { city: 'Twoje Miasto', road: 'Główna 1' },
    wikipedia_extracts: { text: 'Przykładowy opis atrakcji. Uzupełnij po podpięciu API.' },
    preview: { source: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200' },
    info: 'Mock data – dodaj OPENTRIPMAP_API_KEY aby korzystać z realnych danych.'
  }
}
