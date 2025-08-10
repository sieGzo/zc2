// pages/api/auth/check-availability.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Metoda niedozwolona' })
  }

  // pobieramy tylko pierwszy element, jeśli query param jest tablicą
  const emailParam = Array.isArray(req.query.email) ? req.query.email[0] : req.query.email
  const usernameParam = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username

  if (!emailParam && !usernameParam) {
    return res.status(400).json({ ok: false, message: 'Brakuje parametru email lub username' })
  }

  try {
    const emailTaken =
      typeof emailParam === 'string'
        ? !!(await prisma.user.findUnique({
            where: { email: emailParam.trim().toLowerCase() },
          }))
        : false

    const usernameTaken =
      typeof usernameParam === 'string'
        ? !!(await prisma.user.findUnique({
            where: { username: usernameParam.trim() },
          }))
        : false

    return res.status(200).json({ ok: true, emailTaken, usernameTaken })
  } catch (error) {
    console.error('❌ Błąd w check-availability:', error)
    return res.status(500).json({ ok: false, message: 'Błąd serwera. Spróbuj ponownie później.' })
  }
}
