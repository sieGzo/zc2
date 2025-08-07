import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Brakuje lub nieprawidłowy token.' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { emailToken: token },
    })

    if (!user) {
      return res.status(400).json({ message: 'Nieprawidłowy token lub już użyty.' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailToken: null,
      },
    })

    // ✅ Lepszy UX – przekieruj do strony z komunikatem
    return res.redirect('/potwierdzono')
  } catch (err) {
    console.error('❌ Błąd podczas weryfikacji e-maila:', err)
    return res.status(500).json({ message: 'Błąd serwera. Spróbuj później.' })
  }
}
