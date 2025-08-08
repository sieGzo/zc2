import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const UAParser = require('ua-parser-js')

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'

  const userAgentString = req.headers['user-agent'] || 'unknown'
  const parser = new UAParser(userAgentString)
  const browser = parser.getBrowser()?.name || 'unknown'
  const os = parser.getOS()?.name || 'unknown'

  try {
    // Spróbuj zapisać wizytę; jeśli nie ma tabeli Visit (P2021), zignoruj
    try {
      await prisma.visit.create({
        data: {
          ip: typeof ip === 'string' ? ip : 'unknown',
          userAgent: `${browser} on ${os}`,
        },
      })
    } catch (err: any) {
      if (err?.code !== 'P2021') {
        throw err
      }
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [total, todayCount, monthCount, uniqueVisits] = await Promise.all([
      prisma.visit.count().catch((e:any) => (e?.code === 'P2021' ? 0 : Promise.reject(e))),
      prisma.visit.count({ where: { createdAt: { gte: startOfToday } } }).catch((e:any) => (e?.code === 'P2021' ? 0 : Promise.reject(e))),
      prisma.visit.count({ where: { createdAt: { gte: startOfMonth } } }).catch((e:any) => (e?.code === 'P2021' ? 0 : Promise.reject(e))),
      prisma.visit.findMany({
        select: { ip: true },
        where: { ip: { not: null } },
        distinct: ['ip'],
      }).then((visits) => visits.length).catch((e:any) => (e?.code === 'P2021' ? 0 : Promise.reject(e))),
    ])

    res.status(200).json({
      total,
      today: todayCount,
      month: monthCount,
      unique: uniqueVisits,
    })
  } catch (error) {
    console.error('❌ Błąd API counter:', error)
    res.status(200).json({
      total: 0, today: 0, month: 0, unique: 0,
      note: 'counter soft-failed',
    })
  }
}
