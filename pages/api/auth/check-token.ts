// pages/api/auth/check-token.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query

  if (typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Brak tokena', verified: false })
  }

  try {
    const user = await prisma.user.findFirst({
      where: { emailToken: token },
    })

    if (!user) {
      return res.status(404).json({ success: false, message: 'Nie znaleziono użytkownika', verified: false })
    }

    // Jeśli użytkownik jeszcze nie był potwierdzony – aktualizuj
    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailToken: null, // usuwamy token po użyciu
        },
      })
    }

    return res.status(200).json({
      success: true,
      message: 'E-mail został potwierdzony!',
      verified: true,
    })
  } catch (error) {
    console.error('Błąd podczas weryfikacji e-maila:', error)
    return res.status(500).json({ success: false, message: 'Błąd serwera', verified: false })
  }
}
