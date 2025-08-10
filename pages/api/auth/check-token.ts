import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query

  if (typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Brak tokena', verified: false })
  }

  try {
    // emailToken masz @unique, więc można użyć findUnique
    const user = await prisma.user.findUnique({
      where: { emailToken: token },
    })

    if (!user) {
      return res.status(404).json({ success: false, message: 'Nie znaleziono użytkownika', verified: false })
    }

    // Jeśli użytkownik nie był jeszcze potwierdzony – ustaw znacznik czasu
    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(), // ✅ DateTime zamiast boolean
          emailToken: null,          // ✅ pole jest opcjonalne, więc null jest OK
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
