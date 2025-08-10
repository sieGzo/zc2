export const GEOAPIFY_KEY = process.env.GEOAPIFY_API_KEY;

export async function geoapifyPlacesByCircle(params: {
  lat: number;
  lon: number;
  radius?: number;
  categories?: string;
  limit?: number;
}) {
  const key = GEOAPIFY_KEY;
  if (!key) throw new Error("Brak GEOAPIFY_API_KEY");

  const { lat, lon, radius = 5000, categories = "tourism.sights,natural", limit = 30 } = params;

  const url = new URL("https://api.geoapify.com/v2/places");
  url.searchParams.set("categories", categories);
  // ✔️ poprawny zapis filtra koła (lon,lat,radius)
  url.searchParams.set("filter", `circle:${lon},${lat},${radius}`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("apiKey", key);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Geoapify places error ${res.status}`);
  return res.json(); // FeatureCollection
}

export async function geoapifyPlaceDetails(placeId: string) {
  const key = GEOAPIFY_KEY;
  if (!key) throw new Error("Brak GEOAPIFY_API_KEY");

  const url = new URL("https://api.geoapify.com/v2/place-details");
  url.searchParams.set("id", placeId);
  url.searchParams.set("apiKey", key);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Geoapify place-details error ${res.status}`);
  return res.json();
}

export async function geoapifyRoute(params: {
  mode?: "walk" | "bicycle" | "drive";
  waypoints: [number, number][]; // [lat, lon]  <— UWAGA: LAT, LON
}) {
  const key = GEOAPIFY_KEY;
  if (!key) throw new Error("Brak GEOAPIFY_API_KEY");

  const { mode = "walk", waypoints } = params;

  const url = new URL("https://api.geoapify.com/v1/routing");
  // Geoapify → "lat,lon|lat,lon"
  url.searchParams.set("waypoints", waypoints.map(([lat, lon]) => `${lat},${lon}`).join("|"));
  url.searchParams.set("mode", mode);
  url.searchParams.set("apiKey", key);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Geoapify routing error ${res.status}${msg ? `: ${msg}` : ""}`);
  }
  return res.json();
}