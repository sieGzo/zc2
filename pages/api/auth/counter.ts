import type { NextApiRequest, NextApiResponse } from 'next'
import UAParser from 'ua-parser-js'
import { prisma } from '@/lib/prisma'

// prościutki filtr botów
function isBot(ua: string) {
  return /(bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|discord|slurp)/i.test(ua)
}

// sanity parse IP (Cloudflare/Vercel → x-real-ip/cf-connecting-ip/x-forwarded-for)
function getIP(req: NextApiRequest) {
  const cf = (req.headers['cf-connecting-ip'] as string) || ''
  const xff = (req.headers['x-forwarded-for'] as string) || ''
  const real = (req.headers['x-real-ip'] as string) || ''
  const ip =
    cf ||
    (xff ? xff.split(',')[0].trim() : '') ||
    real ||
    (req.socket?.remoteAddress as string) ||
    'unknown'
  return ip
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ip = getIP(req)
  const uaRaw = (req.headers['user-agent'] as string) || 'unknown'

  // 1) spróbuj zapisać wizytę (soft-fail gdy nie ma tabeli)
  try {
    // nie nabijamy statów botami ani lokalnym ::1
    if (!isBot(uaRaw) && ip !== '::1') {
      const parser = new UAParser(uaRaw)
      const browser = parser.getBrowser()?.name || 'unknown'
      const os = parser.getOS()?.name || 'unknown'

      // prościutki throttle: jeśli z tego IP jest już wpis z ostatnich 30 sekund – nie dodawaj
      const THROTTLE_SEC = 30
      const since = new Date(Date.now() - THROTTLE_SEC * 1000)
      const recent = await prisma.visit.findFirst({
        where: { ip: ip || 'unknown', createdAt: { gte: since } },
        select: { id: true },
      })

      if (!recent) {
        await prisma.visit.create({
          data: {
            ip: ip || 'unknown',
            userAgent: `${browser} on ${os}`,
          },
        })
      }
    }
  } catch (err: any) {
    // P2021 = brak tabeli Visit → ignorujemy
    if (err?.code !== 'P2021') {
      console.warn('visit insert warn:', err)
    }
  }

  // 2) policz staty (soft-fail jak nie ma tabeli)
  try {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [total, today, month, uniqueIPs] = await Promise.all([
      prisma.visit.count().catch((e: any) => (e?.code === 'P2021' ? 0 : Promise.reject(e))),
      prisma.visit
        .count({ where: { createdAt: { gte: startOfToday } } })
        .catch((e: any) => (e?.code === 'P2021' ? 0 : Promise.reject(e))),
      prisma.visit
        .count({ where: { createdAt: { gte: startOfMonth } } })
        .catch((e: any) => (e?.code === 'P2021' ? 0 : Promise.reject(e))),
      prisma.visit
        .findMany({
          distinct: ['ip'],
          select: { ip: true },
          where: { ip: { notIn: ['::1', 'unknown', null as any] } },
        })
        .then((rows) => rows.length)
        .catch((e: any) => (e?.code === 'P2021' ? 0 : Promise.reject(e))),
    ])

    // lekkie cache’owanie po stronie edge
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json({ total, today, month, unique: uniqueIPs })
  } catch (error) {
    console.error('❌ Błąd API counter:', error)
    // nie wywalaj UI – zwróć zera
    return res.status(200).json({
      total: 0,
      today: 0,
      month: 0,
      unique: 0,
      note: 'counter soft-failed',
    })
  }
}
