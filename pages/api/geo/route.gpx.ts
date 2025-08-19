// pages/api/geo/route.gpx.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

    const modeRaw = (req.query.mode as string) || "bicycle";
    const mode = modeRaw === "walk" ? "walk" : "bicycle";

    const points = Array.isArray(req.query.p) ? (req.query.p as string[]) : [req.query.p as string];
    const pts = points.filter(Boolean);
    if (pts.length < 2) return res.status(400).send("Need at least 2 points: p=lat,lon");

    const apiKey = process.env.GEOAPIFY_KEY || process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
    if (!apiKey) return res.status(500).send("Missing GEOAPIFY_KEY");

    // lat,lon -> lon,lat dla Geoapify
    const coords = pts.map((p) => {
      const [lat, lon] = p.split(",").map(Number);
      return { lat, lon, lonlat: [lon, lat] as [number, number] };
    });

    // Geoapify Routing: jedna trasa z (start, via..., meta)
    const body = {
      mode, // 'walk' | 'bicycle'
      waypoints: coords.map(({ lon, lat }) => ({ lon, lat })),
      details: { instructions: false, elevation: false }
    };

    const r = await fetch(`https://api.geoapify.com/v1/routing?apiKey=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) return res.status(502).send(await r.text());

    const data = await r.json();
    // Geoapify zwraca MultiLineString/LineString. Bierzemy pierwszy segment.
    const line: [number, number][] =
      data?.features?.[0]?.geometry?.coordinates?.flat?.() ||
      data?.features?.[0]?.geometry?.coordinates?.[0] ||
      [];

    if (!line.length) return res.status(502).send("Empty geometry");

    // line: [lon,lat] -> GPX
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
    res.status(200).send(gpx);
  } catch (e: any) {
    res.status(500).send(e?.message || "Internal error");
  }
}
