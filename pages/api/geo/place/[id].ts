import type { NextApiRequest, NextApiResponse } from "next";
import { geoapifyPlaceDetails } from "@/lib/api/geoapify";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "id required" });
    }
    const data = await geoapifyPlaceDetails(id);
    res.status(200).json(data);
  } catch (e: any) {
    console.error("geo/place/:id error:", e?.message || e);
    res.status(500).json({ error: e?.message || "unknown error" });
  }
}
