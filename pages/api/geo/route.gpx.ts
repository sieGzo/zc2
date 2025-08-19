import type { NextApiRequest, NextApiResponse } from "next";

// bardzo prosty in-memory rate‑limit (opcjonalnie)
const buckets = new Map<string, { count: number; ts: number }>();
function allow(ip: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now - b.ts > windowMs) {
    buckets.set(ip, { count: 1, ts: now });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "0.0.0.0";
    if (!allow(ip)) return res.status(429).send("Too Many Requests");

    const modeRaw = (req.query.mode as string) || "bicycle";
    const mode: "walk" | "bicycle" = modeRaw === "walk" ? "walk" : "bicycle";

    const pointsParam = req.query.p;
    const points = Array.isArray(pointsParam) ? pointsParam : [pointsParam as string];
    const pts = (points.filter(Boolean) as string[]).map(s => s.trim());
    if (pts.length < 2) return res.status(400).send("Need at least 2 points: p=lat,lon");

    const apiKey = process.env.GEOAPIFY_KEY || process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
    if (!apiKey) return res.status(500).send("Missing GEOAPIFY_KEY");

    // Geoapify oczekuje waypoints=lat,lon|lat,lon ...
    // Walidacja liczb + składka parametru
    const wpList: string[] = [];
    for (const p of pts) {
      const [latStr, lonStr] = p.split(",");
      const lat = Number(latStr), lon = Number(lonStr);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return res.status(400).send("Invalid coordinates");
      }
      wpList.push(`${lat},${lon}`);
    }
    const waypoints = wpList.join("|");

    const url = new URL("https://api.geoapify.com/v1/routing");
    url.searchParams.set("waypoints", waypoints);
    url.searchParams.set("mode", mode);
    url.searchParams.set("apiKey", apiKey);

    const r = await fetch(url.toString(), { method: "GET" });
    if (!r.ok) return res.status(502).send(await r.text());

    const data = (await r.json()) as any;

    // Wyciągnij pierwszą geometrię linii (GeoJSON -> [lon,lat])
    let line: [number, number][] = [];
    const geom = data?.features?.[0]?.geometry;
    if (geom?.type === "LineString") {
      line = (geom.coordinates as [number, number][]) || [];
    } else if (geom?.type === "MultiLineString") {
      const first = (geom.coordinates?.[0] as [number, number][]) || [];
      line = first;
    }

    if (!line.length) return res.status(502).send("Empty geometry");

    // GPX
    const gpx =
      [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<gpx version="1.1" creator="ZwiedzajChytrze">`,
        `<trk><name>${pts[0]} → ${pts[pts.length - 1]}</name><trkseg>`,
        ...line.map(([lon, lat]) => `<trkpt lat="${lat}" lon="${lon}"></trkpt>`),
        `</trkseg></trk>`,
        `</gpx>`,
      ].join("");

    res.setHeader("content-type", "application/gpx+xml; charset=utf-8");
    res.setHeader("content-disposition", 'attachment; filename="route.gpx"');
    return res.status(200).send(gpx);
  } catch (e: any) {
    return res.status(500).send(e?.message || "Internal error");
  }
}
