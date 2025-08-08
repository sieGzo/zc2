// lib/api/geoapify.ts
// Minimal client helpers for Geoapify Places & Routing

export const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY || process.env.NEXT_PUBLIC_GEOAPIFY_KEY

export type GeoPlace = {
  id?: string
  name?: string
  category?: string
  lat: number
  lon: number
  address?: string
  place_id?: string
  properties?: any
  preview?: string
}

export async function geoapifyPlacesByCircle(params: {
  lat: number
  lon: number
  radius?: number
  categories?: string
  limit?: number
}) {
  const key = GEOAPIFY_KEY
  if (!key) throw new Error("Brak GEOAPIFY_API_KEY / NEXT_PUBLIC_GEOAPIFY_KEY")
  const { lat, lon, radius = 5000, categories = "tourism.sights,natural", limit = 30 } = params
  const url = new URL("https://api.geoapify.com/v2/places")
  url.searchParams.set("categories", categories)
  url.searchParams.set("filter", `circle:${lon},{lat},{radius}`.replace("{lat}", String(lat)).replace("{radius}", String(radius)))
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("apiKey", key)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error("Geoapify places error")
  const data = await res.json()
  return data // GeoJSON FeatureCollection
}

export async function geoapifyPlaceDetails(placeId: string) {
  const key = GEOAPIFY_KEY
  if (!key) throw new Error("Brak GEOAPIFY_API_KEY / NEXT_PUBLIC_GEOAPIFY_KEY")
  const url = new URL("https://api.geoapify.com/v2/place-details")
  url.searchParams.set("id", placeId)
  url.searchParams.set("apiKey", key)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error("Geoapify place-details error")
  return res.json()
}

export async function geoapifyRoute(params: {
  mode?: "walk"|"bicycle"
  waypoints: [number, number][] // [lon,lat]
}) {
  const key = GEOAPIFY_KEY
  if (!key) throw new Error("Brak GEOAPIFY_API_KEY / NEXT_PUBLIC_GEOAPIFY_KEY")
  const { mode = "walk", waypoints } = params
  const url = new URL("https://api.geoapify.com/v1/routing")
  url.searchParams.set("waypoints", waypoints.map(w => w.join(",")).join("|"))
  url.searchParams.set("mode", mode)
  url.searchParams.set("apiKey", key)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error("Geoapify routing error")
  return res.json()
}
