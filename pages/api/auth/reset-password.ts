import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  res.setHeader('Cache-Control', 'no-store')

  const { token, password } = req.body

  if (!token || !password) {
    return res.status(400).json({ message: 'Brakuje danych.' })
  }

  // 🟠 Walidacja hasła
  const isStrongPassword =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)

  if (!isStrongPassword) {
    return res.status(400).json({
      message: 'Hasło musi mieć min. 8 znaków, 1 wielką literę i 1 znak specjalny.',
    })
  }

  try {
    // 🔍 Szukamy użytkownika po tokenie i czasie ważności
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      return res.status(400).json({ message: 'Token jest nieprawidłowy lub wygasł.' })
    }

    // 🔒 Haszujemy nowe hasło
    const hashedPassword = await bcrypt.hash(password, 10)

    // 🔁 Aktualizacja użytkownika
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword, // ✅ poprawna nazwa pola z modelu
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return res.status(200).json({ message: 'Hasło zostało zaktualizowane.' })
  } catch (err) {
    console.error('❌ Błąd przy resetowaniu hasła:', err)
    return res.status(500).json({ message: 'Błąd serwera.' })
  }
}
