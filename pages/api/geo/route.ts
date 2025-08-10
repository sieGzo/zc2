import type { NextApiRequest, NextApiResponse } from "next";
import { geoapifyRoute } from "@/lib/api/geoapify";

/** jeśli przyszła tablica (Next/URLSearchParams), bierz 1. wartość */
const first = (v: unknown) => Array.isArray(v) ? v[0] : v;

/** akceptuje 52,2297 / 52.2297 / z odstępami/NBSP */
function toNum(v: unknown): number {
  if (v == null) return NaN;
  const s = String(v)
    .replace(/\u00A0/g, " ") // NBSP → spacja
    .replace(/\s+/g, "")     // usuń spacje
    .replace(",", ".");      // przecinek → kropka
  return parseFloat(s);
}

/** Haversine (metry) */
function haversine(lat1:number, lon1:number, lat2:number, lon2:number) {
  const R = 6371e3, toRad = (d:number)=>d*Math.PI/180;
  const φ1 = toRad(lat1), φ2 = toRad(lat2), Δφ = toRad(lat2-lat1), Δλ = toRad(lon2-lon1);
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return 2*R*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/** liniowa interpolacja – wystarczy by podzielić długą trasę < 100 km na etap */
function interpolate(lat1:number, lon1:number, lat2:number, lon2:number, segments:number): [number,number][] {
  const pts:[number,number][] = [];
  for (let i=0;i<=segments;i++){
    const t = i/segments;
    pts.push([lat1 + t*(lat2-lat1), lon1 + t*(lon2-lon1)]); // [lat,lon]
  }
  return pts;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const mode = (first(req.query.mode) as "walk"|"bicycle"|"drive") || (req.body?.mode ?? "walk");

    // OBSŁUŻ OBA ZESTAWY NAZW: from*/to* oraz start*/end*
    const raw = {
      fromLat: first(req.query.fromLat ?? req.body?.fromLat ?? req.query.startLat ?? req.body?.startLat),
      fromLon: first(req.query.fromLon ?? req.body?.fromLon ?? req.query.startLon ?? req.body?.startLon),
      toLat:   first(req.query.toLat   ?? req.body?.toLat   ?? req.query.endLat   ?? req.body?.endLat),
      toLon:   first(req.query.toLon   ?? req.body?.toLon   ?? req.query.endLon   ?? req.body?.endLon),
    };

    const fromLat = toNum(raw.fromLat);
    const fromLon = toNum(raw.fromLon);
    const toLat   = toNum(raw.toLat);
    const toLon   = toNum(raw.toLon);

    const missing = [
      ["fromLat/startLat", fromLat],
      ["fromLon/startLon", fromLon],
      ["toLat/endLat",     toLat],
      ["toLon/endLon",     toLon],
    ].filter(([,v]) => !Number.isFinite(v)).map(([k]) => k as string);

    if (missing.length) {
      return res.status(400).json({
        błąd: `Brak/nieprawidłowe parametry: ${missing.join(", ")}`,
        odebrano: raw
      });
    }

    // dziel etapy pod limit Geoapify ~100 km
    const dist = haversine(fromLat, fromLon, toLat, toLon);
    const MAX_LEG = 95_000; // bufor
    const segments = Math.max(1, Math.ceil(dist / MAX_LEG));
    const waypoints = interpolate(fromLat, fromLon, toLat, toLon, segments); // [lat,lon]

    const data = await geoapifyRoute({ mode, waypoints }); // geoapify.ts wysyła "lat,lon|lat,lon"
    return res.status(200).json(data);
  } catch (e: any) {
    console.error("geo/route:", e?.message || e);
    return res.status(500).json({ błąd: e?.message || "Planowanie trasy nie powiodło się" });
  }
}
