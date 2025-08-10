// pages/api/auth/reset-password-request.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Metoda niedozwolona' })
  res.setHeader('Cache-Control', 'no-store')

  try {
    const emailRaw = (req.body?.email ?? '') as string
    const email = emailRaw.trim().toLowerCase()

    // Zawsze neutralny komunikat (nie zdradzamy stanu konta)
    const NEUTRAL = { message: 'Jeśli konto istnieje, wysłano e-mail.' }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(200).json(NEUTRAL)
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      const token = randomBytes(32).toString('hex')
      const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1h

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiry: expiry },
      })

      try {
        await sendPasswordResetEmail(email, token) // powinno linkować do /nowe-haslo?token=...
      } catch (e) {
        console.warn('sendPasswordResetEmail failed:', e)
        // nie zwracamy 500 — UX/bezpieczeństwo
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔗 DEV reset link: /nowe-haslo?token=${token}`)
      }
    }

    return res.status(200).json(NEUTRAL)
  } catch (err) {
    console.error('❌ reset-password-request error:', err)
    // dalej neutralnie
    return res.status(200).json({ message: 'Jeśli konto istnieje, wysłano e-mail.' })
  }
}
