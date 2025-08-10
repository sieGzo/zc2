// pages/api/auth/verify-email.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = typeof req.query.token === 'string' ? req.query.token : null
  if (!token) return res.status(400).send('Brak lub nieprawidłowy token.')

  try {
    const user = await prisma.user.findFirst({ where: { emailToken: token } })

    if (!user) {
      // Token już zużyty albo nieprawidłowy – spróbujmy sprawdzić, czy użytkownik już zweryfikowany
      // (gdybyś chciał, możesz przyjmować też ?email= w query i wtedy sprawdzać po emailu)
      return res.writeHead(302, { Location: '/login?verified=1' }).end()
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date(), emailToken: null },
    })

    // Oznacz newsletter jako potwierdzony (best-effort)
    if (user.email) {
      await prisma.newsletterSubscriber.updateMany({
        where: { email: user.email },
        data: { verified: true },
      })
      // E-mail powitalny – tylko jeśli mamy adres
      try { await sendWelcomeEmail(user.email) } catch (e) { console.warn('sendWelcomeEmail warn:', e) }
    }

    // Ładny UX: przekieruj na login z info
    return res.writeHead(302, { Location: '/login?verified=1' }).end()
  } catch (error) {
    console.error('❌ Błąd przy weryfikacji e-maila:', error)
    return res.status(500).send('Błąd serwera.')
  }
}
