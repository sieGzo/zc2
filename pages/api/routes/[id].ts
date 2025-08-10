import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

async function getUserIdFromSession(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const anyUser = session?.user as any
  if (!anyUser) return null
  if (anyUser.id) return String(anyUser.id)
  if (anyUser.email) {
    const u = await prisma.user.findUnique({ where: { email: anyUser.email } })
    return u?.id ?? null
  }
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserIdFromSession(req, res)
  const { id } = req.query as { id: string }

  if (req.method === 'GET') {
    const r = await prisma.route.findUnique({ where: { id } })
    // prosty „ownership check”: jeśli trasa ma userId i różni się od bieżącego — 404
    if (!r || (userId && r.userId && r.userId !== userId)) {
      return res.status(404).json({ error: 'not found' })
    }
    return res.status(200).json(r)
  }

  if (req.method === 'PUT') {
    const { name, mode, geojson, startLat, startLon, endLat, endLon, distance, time } = req.body || {}
    const updated = await prisma.route.update({
      where: { id },
      data: { name, mode, geojson, startLat, startLon, endLat, endLon, distance, time },
    })
    return res.status(200).json(updated)
  }

  if (req.method === 'DELETE') {
    await prisma.route.delete({ where: { id } })
    return res.status(204).end()
  }

  res.setHeader('Allow', 'GET,PUT,DELETE')
  return res.status(405).end('Method Not Allowed')
}
