// pages/api/auth/check-availability.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Metoda niedozwolona' })
  }

  // weź pierwszy element jeśli ktoś przysłał tablicę
  const emailParam = Array.isArray(req.query.email) ? req.query.email[0] : req.query.email
  const usernameParam = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username

  try {
    let emailTaken = false
    let usernameTaken = false

    if (typeof emailParam === 'string' && emailParam.trim()) {
      const e = emailParam.trim().toLowerCase()
      const found = await prisma.user.findFirst({ where: { email: e }, select: { id: true } })
      emailTaken = !!found
    }

    if (typeof usernameParam === 'string' && usernameParam.trim()) {
      const u = usernameParam.trim()
      const found = await prisma.user.findFirst({ where: { username: u }, select: { id: true } })
      usernameTaken = !!found
    }

    return res.status(200).json({ ok: true, emailTaken, usernameTaken })
  } catch (error: any) {
    console.error('❌ check-availability error:', error?.message || error)
    // Nie blokujemy flow rejestracji 500-ką:
    return res.status(200).json({ ok: true, emailTaken: false, usernameTaken: false })
  }
}
