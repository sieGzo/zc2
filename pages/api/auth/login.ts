import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'API login działa na produkcji 🎉' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { identifier, password, token } = req.body

  if (!identifier || !password || !token) {
    return res.status(400).json({ message: 'Brakuje wymaganych danych.' })
  }

  // ✅ WALIDACJA CLOUDFLARE TURNSTILE
  try {
    const verifyRes = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY || '',
        response: token,
        remoteip: req.headers['x-forwarded-for']?.toString() || '',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const { success } = verifyRes.data
    if (!success) {
      return res.status(403).json({ message: 'Weryfikacja Cloudflare nie powiodła się.' })
    }
  } catch (error: any) {
    console.error('❌ Błąd walidacji Turnstile:', error)
    return res.status(500).json({ message: 'Błąd połączenia z Turnstile.' })
  }

  try {
    // 📥 Wyszukaj użytkownika po emailu lub nazwie
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() },
        ],
      },
    })

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Nieprawidłowy login lub hasło.' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nieprawidłowy login lub hasło.' })
    }

    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Najpierw potwierdź swój adres e-mail.' })
    }

    return res.status(200).json({
      message: 'Zalogowano pomyślnie!',
      id: user.id,
      username: user.username,
      email: user.email, // 👈 DODANE!
      visitedCountries: user.visitedCountries || [],
    })
  } catch (error) {
    console.error('❌ Błąd serwera w login.ts:', error)
    return res.status(500).json({ message: 'Błąd serwera', error: String(error) })
  }
}
