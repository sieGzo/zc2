// pages/api/geo/route.gpx.ts
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Wejście:
 *   GET /api/geo/route.gpx?mode=walk|bicycle&p=lat,lon&p=lat,lon[&p=lat,lon...]
 *   Co najmniej 2 punkty (start, meta). Kolejne opcjonalnie via.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const mode = (req.query.mode as string) === "walk" ? "walk" : "bicycle";
    const points = Array.isArray(req.query.p) ? req.query.p as string[] : [req.query.p as string];
    if (!points[0] || !points[1]) return res.status(400).send("Need at least 2 points");

    // Geoapify Directions (lon,lat!)
    const apiKey = process.env.GEOAPIFY_KEY || process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
    if (!apiKey) return res.status(500).send("Missing GEOAPIFY_KEY");

    // zamiana lat,lon -> lon,lat
    const coords = points.map((p) => {
      const [lat, lon] = p.split(",").map(Number);
      return [lon, lat];
    });

    const profile = mode === "walk" ? "walk" : "bicycle"; // dopasuj do Twojego /api/geo/route
    const body = {
      mode: profile,
      waypoints: coords.map(([lon, lat]) => ({ lon, lat })),
    };

    const r = await fetch("https://api.geoapify.com/v1/routing?apiKey=" + apiKey, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(502).send(txt || "Routing failed");
    }

    const data = await r.json();
    const features = data?.features || [];
    const line = features[0]?.geometry?.coordinates?.[0] || [];

    // line: [[lon,lat], ...] -> GPX
    const gpx =
      [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<gpx version="1.1" creator="ZwiedzajChytrze">`,
        `<trk><name>ZwiedzajChytrze Route</name><trkseg>`,
        ...line.map(([lon, lat]: [number, number]) => `<trkpt lat="${lat}" lon="${lon}"></trkpt>`),
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
