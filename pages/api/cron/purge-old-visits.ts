import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) return res.status(401).end()
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90)
  const { count } = await prisma.visit.deleteMany({ where: { createdAt: { lt: cutoff } } })
  res.status(200).json({ deleted: count })
}
