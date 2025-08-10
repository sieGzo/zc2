import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '@/lib/email'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'

// bezpieczne pobranie sekretu – łapiemy różne warianty nazw
function getTurnstileSecret() {
  return (
    process.env.TURNSTILE_SECRET_KEY ||
    process.env.NEXT_TURNSTILE_SECRET ||
    ''
  )
}

async function verifyTurnstile(token?: string, ip?: string | string[]) {
  const secret = getTurnstileSecret()
  if (!secret) {
    // brak klucza — nie blokujemy rejestracji w DEV/na testach
    console.warn('⚠️ Brak TURNSTILE_SECRET_KEY — pomijam weryfikację (DEV).')
    return { ok: true, reason: 'no-secret-dev-bypass' }
  }
  if (!token) return { ok: false, reason: 'missing-token' }

  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(typeof ip === 'string' ? { remoteip: ip } : {}),
      }),
    })
    const data = await resp.json()
    return { ok: !!data.success, detail: data }
  } catch (e) {
    return { ok: false, reason: 'verify-exception', detail: String(e) }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' })
  }

  const { username, email, password, turnstileToken } = (req.body ?? {}) as {
    username?: string; email?: string; password?: string; turnstileToken?: string;
  }

  // 1) walidacje
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Brakuje wymaganych danych.' })
  }
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
    return res.status(400).json({ message: 'Hasło musi mieć min. 8 znaków, 1 wielką literę i 1 znak specjalny.' })
  }
  const emailNorm = String(email).trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(emailNorm)) {
    return res.status(400).json({ message: 'Nieprawidłowy adres e-mail.' })
  }

  // 2) Turnstile
  const ip = (req.headers['cf-connecting-ip'] as string) || req.socket.remoteAddress
  const ts = await verifyTurnstile(turnstileToken, ip)
  if (!ts.ok) {
    // PODCZAS TESTÓW – pomóżmy sobie detalem; potem możesz usunąć "detail"
    return res.status(400).json({
      message: 'Weryfikacja nie powiodła się. Spróbuj ponownie.',
      detail: ts.detail ?? ts.reason ?? null,
    })
  }

  try {
    // 3) unikalność
    const [emailExists, usernameExists] = await Promise.all([
      prisma.user.findUnique({ where: { email: emailNorm } }),
      prisma.user.findUnique({ where: { username } }),
    ])
    if (emailExists)   return res.status(409).json({ message: 'Ten e-mail jest już zarejestrowany.' })
    if (usernameExists) return res.status(409).json({ message: 'Nazwa użytkownika jest już zajęta.' })

    // 4) zapis
    const passwordHash = await bcrypt.hash(password, 10)
    const token = randomBytes(32).toString('hex')

    console.log('📝 Tworzę użytkownika:', { username, emailNorm })
    const newUser = await prisma.user.create({
      data: {
        username,
        email: emailNorm,
        passwordHash,
        emailToken: token,
        emailVerified: null, // będzie po kliknięciu w mail
      },
      select: { id: true, username: true, email: true },
    })
    console.log('✅ Utworzono:', newUser)

    // 5) mail weryfikacyjny (best-effort)
    try { await sendVerificationEmail(emailNorm, token) }
    catch (e) { console.warn('MAIL WARN:', e) }

    return res.status(200).json({
      message: 'Sprawdź e-mail i potwierdź rejestrację.',
      user: newUser,
    })
  } catch (e) {
    console.error('❌ Błąd rejestracji (DB):', e)
    return res.status(500).json({ message: 'Błąd serwera. Spróbuj później.' })
  }
}
