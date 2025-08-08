import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '@/lib/email'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { username, email, password, turnstileToken } = req.body

  if (!username || !email || !password || !turnstileToken) {
    return res.status(400).json({ message: 'Brakuje wymaganych danych.' })
  }

  // ✅ Walidacja hasła
  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[^a-zA-Z0-9]/.test(password)
  ) {
    return res.status(400).json({
      message: 'Hasło musi mieć min. 8 znaków, 1&nbsp;wielką literę i&nbsp;1&nbsp;znak specjalny.',
    })
  }

  // ✅ Walidacja emaila
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Nieprawidłowy adres e-mail.' })
  }

  // ✅ Weryfikacja Turnstile
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.warn('Brakuje TURNSTILE_SECRET_KEY w zmiennych środowiskowych!')
    return res.status(500).json({ message: 'Brak konfiguracji Turnstile.' })
  }

  try {
    const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    })

    const cfData = await cfRes.json()

    if (!cfData.success) {
      console.error('❌ Nieudana weryfikacja Turnstile:', cfData)
      return res.status(400).json({ message: 'Weryfikacja nie powiodła się. Spróbuj ponownie.' })
    }

    // ✅ Sprawdzenie czy email/username już istnieją
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username } }),
    ])

    if (existingEmail) {
      return res.status(409).json({ message: 'Ten e-mail jest już zarejestrowany.' })
    }

    if (existingUsername) {
      return res.status(409).json({ message: 'Nazwa użytkownika jest już zajęta.' })
    }

    // 🔐 Haszowanie i zapis
    const passwordHash = await bcrypt.hash(password, 10)
    const token = randomBytes(32).toString('hex')

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash, // <--- poprawione
        emailToken: token,
        emailVerified: null,
      },
    })

    // 📧 Wyślij mail z tokenem
    await sendVerificationEmail(email, token)

    return res.status(200).json({
      message: 'Sprawdź e-mail i&nbsp;potwierdź rejestrację.',
      id: newUser.id,
      username: newUser.username,
    })
  } catch (error) {
    console.error('❌ Błąd rejestracji:', error)
    return res.status(500).json({ message: 'Błąd serwera. Spróbuj później.' })
  }
}
