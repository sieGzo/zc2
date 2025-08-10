import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

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
    const ip = clientIp(req)
    const ipHash = ip ? ipHmac(ip) : 'unknown'
    const ua = (req.headers['user-agent'] || '').slice(0, 120)

    // miękko zapisz wizytę (ignoruj brak tabeli w środowisku przejściowym)
    try {
      await prisma.visit.create({ data: { ipHash, userAgent: ua } })
    } catch (e: any) {
      if (e?.code !== 'P2021') throw e
    }

    const startOfToday = new Date(); startOfToday.setHours(0,0,0,0)
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)

    const safeCount = (p: Promise<any>) =>
      p.catch((e:any)=> (e?.code === 'P2021' ? 0 : Promise.reject(e)))

    const [total, today, month, unique] = await Promise.all([
      safeCount(prisma.visit.count()),
      safeCount(prisma.visit.count({ where: { createdAt: { gte: startOfToday } } })),
      safeCount(prisma.visit.count({ where: { createdAt: { gte: startOfMonth } } })),
      safeCount(prisma.visit.findMany({ select: { ipHash: true }, distinct: ['ipHash'] }).then(r => r.length)),
    ])

    res.status(200).json({ total, today, month, unique })
  } catch (err) {
    console.error('counter error', err)
    res.status(200).json({ total: 0, today: 0, month: 0, unique: 0, note: 'soft-fail' })
  }
}
