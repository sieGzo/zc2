import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '@/lib/email'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' })
  }

  const { username, email, password, turnstileToken } = req.body as {
    username?: string
    email?: string
    password?: string
    turnstileToken?: string
  }

  // --- Walidacja podstawowa ---
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Brakuje wymaganych danych.' })
  }

  // --- Walidacja hasła ---
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
    return res.status(400).json({
      message: 'Hasło musi mieć min. 8 znaków, 1 wielką literę i 1 znak specjalny.',
    })
  }

  // --- Walidacja i normalizacja e-maila ---
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const normalizedEmail = String(email).trim().toLowerCase()
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Nieprawidłowy adres e-mail.' })
  }

  // --- Weryfikacja Turnstile ---
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.warn('⚠️ Brakuje TURNSTILE_SECRET_KEY — rejestracja bez weryfikacji (tryb DEV).')
  } else {
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
    } catch (e) {
      console.warn('⚠️ Nie udało się zweryfikować Turnstile:', e)
      return res.status(400).json({ message: 'Błąd weryfikacji zabezpieczenia. Spróbuj ponownie.' })
    }
  }

  try {
    // --- Sprawdzenie unikalności ---
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email: normalizedEmail } }),
      prisma.user.findUnique({ where: { username } }),
    ])

    if (existingEmail) {
      return res.status(409).json({ message: 'Ten e-mail jest już zarejestrowany.' })
    }
    if (existingUsername) {
      return res.status(409).json({ message: 'Nazwa użytkownika jest już zajęta.' })
    }

    // --- Haszowanie hasła i generowanie tokenu ---
    const passwordHash = await bcrypt.hash(password, 10)
    const token = randomBytes(32).toString('hex')

    const newUser = await prisma.user.create({
      data: {
        username,
        email: normalizedEmail,
        passwordHash,
        emailToken: token,
        emailVerified: null,
      },
    })

    // --- Wysyłka maila weryfikacyjnego ---
    try {
      await sendVerificationEmail(normalizedEmail, token)
    } catch (e) {
      console.warn('⚠️ Nie udało się wysłać maila weryfikacyjnego:', e)
    }

    return res.status(200).json({
      message: 'Sprawdź e-mail i potwierdź rejestrację.',
      id: newUser.id,
      username: newUser.username,
    })
  } catch (error) {
    console.error('❌ Błąd rejestracji:', error)
    return res.status(500).json({ message: 'Błąd serwera. Spróbuj później.' })
  }
}
