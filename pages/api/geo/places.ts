import type { NextApiRequest, NextApiResponse } from "next";
import { geoapifyPlacesByCircle } from "@/lib/api/geoapify";

const toNum = (v: unknown) => parseFloat(String(v ?? "").replace(",", "."));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const lat = toNum(req.query.lat);
    const lon = toNum(req.query.lon);
    const radius = req.query.radius ? toNum(req.query.radius) : undefined;
    const categories = req.query.categories ? String(req.query.categories) : "tourism.sights,natural";
    const limit = req.query.limit ? Number(req.query.limit) : 30;

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: "lat & lon required" });
    }

    const data = await geoapifyPlacesByCircle({ lat, lon, radius, categories, limit });
    res.status(200).json(data);
  } catch (e: any) {
    console.error("geo/places error:", e?.message || e);
    res.status(500).json({ error: e?.message || "unknown error" });
  }
}
