// pages/api/auth/counter.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function clientIp(req: NextApiRequest) {
  return (
    (req.headers['x-real-ip'] as string) ||
    (req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ?? '') ||
    req.socket.remoteAddress ||
    ''
  )
}

function ipHmac(ip: string) {
  const secret = process.env.VISIT_HASH_SECRET || 'CHANGE_ME_IN_ENV'
  return crypto.createHmac('sha256', secret).update(ip).digest('hex').slice(0, 64)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store')

    const ip = clientIp(req)
    const ipHash = ip ? ipHmac(ip) : 'unknown'
    const ua = String(req.headers['user-agent'] || '').slice(0, 200)

    try {
      await prisma.visit.create({ data: { ipHash, userAgent: ua } })
    } catch (e: any) {
      if (e?.code !== 'P2021') throw e
    }

    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)

    const safe = <T,>(p: Promise<T>) =>
      p.catch((e: any) => (e?.code === 'P2021' ? (0 as unknown as T) : Promise.reject(e)))

    const [total, today, month] = await Promise.all([
      safe(prisma.visit.count()),
      safe(prisma.visit.count({ where: { createdAt: { gte: startOfToday } } })),
      safe(prisma.visit.count({ where: { createdAt: { gte: startOfMonth } } })),
    ])

    // Unikalne IP – raw query, szybsze i zgodne typowo
    let unique = 0
    try {
      const result = await prisma.$queryRaw<{ cnt: bigint }[]>`
        SELECT COUNT(DISTINCT "ipHash") AS cnt FROM "Visit"
      `
      unique = Number(result[0]?.cnt ?? 0)
    } catch (e: any) {
      if (e?.code !== 'P2021') throw e
    }

    res.status(200).json({ total, today, month, unique })
  } catch (err) {
    console.error('counter error', err)
    res.status(200).json({ total: 0, today: 0, month: 0, unique: 0, note: 'soft-fail' })
  }
}
