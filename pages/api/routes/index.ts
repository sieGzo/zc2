import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/api/prisma"; // jeśli masz inny eksport, popraw import

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const userId = (session?.user as any)?.id || null; // dopasuj do swojej sesji

  if (req.method === "GET") {
    // lista tras użytkownika (albo pusta, jeśli nie zalogowany)
    if (!userId) return res.status(401).json({ błąd: "Zaloguj się, aby zobaczyć swoje trasy." });
    const routes = await prisma.route.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, mode: true, distance: true, time: true, createdAt: true }
    });
    return res.status(200).json(routes);
  }

  if (req.method === "POST") {
    if (!userId) return res.status(401).json({ błąd: "Zaloguj się, aby zapisać trasę." });

    const { name, mode, start, end, distance, time, geojson } = req.body || {};
    if (!name || !mode || !start || !end || !geojson)
      return res.status(400).json({ błąd: "Brakuje pól: name/mode/start/end/geojson" });

    const created = await prisma.route.create({
      data: {
        userId,
        name,
        mode,
        startLat: start[0],
        startLon: start[1],
        endLat: end[0],
        endLon: end[1],
        distance: Math.round(distance ?? 0),
        time: Math.round(time ?? 0),
        geojson
      },
      select: { id: true }
    });
    return res.status(201).json(created);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end("Method Not Allowed");
}
