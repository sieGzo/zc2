import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/api/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const userId = (session?.user as any)?.id || null;
  const { id } = req.query;

  if (!userId) return res.status(401).json({ błąd: "Zaloguj się." });
  if (!id || typeof id !== "string") return res.status(400).json({ błąd: "Brak id" });

  if (req.method === "DELETE") {
    await prisma.route.deleteMany({ where: { id, userId } }); // bezpiecznie (tylko właściciel)
    return res.status(204).end();
  }

  res.setHeader("Allow", "DELETE");
  return res.status(405).end("Method Not Allowed");
}
