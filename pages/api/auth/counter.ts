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

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  try {
    // 🛑 Zapisz wizytę tylko jeśli nie ma jej jeszcze dziś dla tego IP
    const existingVisit = await prisma.visit.findFirst({
      where: {
        ip,
        createdAt: {
          gte: today,
        },
      },
    })

    if (!existingVisit) {
      await prisma.visit.create({
        data: {
          ip,
          userAgent: `${browser} on ${os}`,
        },
      })
    }

    // 🔢 Pobierz statystyki
    const [total, todayCount, monthCount, uniqueVisits] = await Promise.all([
      prisma.visit.count(),
      prisma.visit.count({ where: { createdAt: { gte: today } } }),
      prisma.visit.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.visit.findMany({
        select: { ip: true },
        distinct: ['ip'],
      }).then((visits) => visits.length),
    ])

    res.status(200).json({
      total,
      today: todayCount,
      month: monthCount,
      unique: uniqueVisits,
    })
  } catch (error) {
    console.error('❌ Błąd API counter:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
