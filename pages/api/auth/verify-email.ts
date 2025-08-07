import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query

  if (typeof token !== 'string') {
    return res.status(400).json({ message: 'Brak lub nieprawidłowy token.' })
  }

  try {
    // 🔍 Szukamy użytkownika po tokenie
    const user = await prisma.user.findFirst({
      where: { emailToken: token },
    })

    if (!user) {
      // 👀 Sprawdzamy, czy to ponowne kliknięcie linku i konto jest już potwierdzone
      const alreadyVerifiedUser = await prisma.user.findFirst({
        where: {
          emailToken: null,
          emailVerified: true,
        },
      })

      if (alreadyVerifiedUser) {
        return res.status(200).json({
          message: 'E-mail był już wcześniej potwierdzony.',
          emailVerified: true,
        })
      }

      return res.status(404).json({ message: 'Nie znaleziono użytkownika.' })
    }

    // ✅ Potwierdzamy e-mail i usuwamy token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailToken: null,
      },
    })

    // ✅ Jeśli subskrybował newsletter, oznacz jako potwierdzony
    await prisma.newsletterSubscriber.updateMany({
      where: { email: user.email },
      data: { verified: true },
    })

    // 📧 Wyślij e-mail powitalny
    await sendWelcomeEmail(user.email)

    return res.status(200).json({
      message: 'E-mail potwierdzony!',
      emailVerified: true,
    })
  } catch (error) {
    console.error('❌ Błąd przy weryfikacji e-maila:', error)
    return res.status(500).json({ message: 'Błąd serwera.' })
  }
}
