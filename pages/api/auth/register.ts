// pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/lib/email';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

function getTurnstileSecret() {
  return (
    process.env.TURNSTILE_SECRET_KEY ||
    process.env.NEXT_TURNSTILE_SECRET ||
    ''
  );
}

async function verifyTurnstile(token?: string, ip?: string | string[]) {
  const secret = getTurnstileSecret();
  if (!secret) {
    console.warn('⚠️ Brak TURNSTILE_SECRET_KEY — pomijam weryfikację (DEV).');
    return { ok: true, reason: 'no-secret-dev-bypass' as const };
  }
  if (!token) return { ok: false as const, reason: 'missing-token' as const };

  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(typeof ip === 'string' ? { remoteip: ip } : {}),
      }),
    });

    const data = await resp.json();

    // 🔎 log tylko na serwerze (zredagowany)
    console.log('Turnstile verify:', {
      success: data?.success,
      hostname: data?.hostname,
      'error-codes': data?.['error-codes'],
      action: data?.action,
      cdata: data?.cdata ? 'present' : 'none',
    });

    // Zwracamy surowe dane, żeby UI mógł je zmapować
    return { ok: !!data.success, detail: data as any };
  } catch (e) {
    console.error('Turnstile verify exception:', e);
    return { ok: false as const, reason: 'verify-exception' as const, detail: String(e) };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Metoda niedozwolona' });
  }

  const { username, email, password, turnstileToken } = (req.body ?? {}) as {
    username?: string; email?: string; password?: string; turnstileToken?: string;
  };

  const usernameNorm = (username ?? '').trim();
  const emailNorm = (email ?? '').trim().toLowerCase();
  if (!usernameNorm || !emailNorm || !password) {
    return res.status(400).json({ ok: false, message: 'Brakuje wymaganych danych.' });
  }

  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(usernameNorm)) {
    return res.status(400).json({ ok: false, message: 'Nazwa użytkownika może zawierać litery, cyfry, ., _, - i mieć 3–30 znaków.' });
  }
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
    return res.status(400).json({ ok: false, message: 'Hasło musi mieć min. 8 znaków, 1 wielką literę i 1 znak specjalny.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailNorm)) {
    return res.status(400).json({ ok: false, message: 'Nieprawidłowy adres e-mail.' });
  }

  const ip = (req.headers['cf-connecting-ip'] as string) || req.socket.remoteAddress;

  // 🔎 logujemy skąd przyszedł request (pomaga gdy widget działa na innym hoście)
  console.log('Register attempt:', {
    host: req.headers.host,
    ip,
  });

  const ts = await verifyTurnstile(turnstileToken, ip);
  if (!ts.ok) {
    // 🔎 przepisujemy najczęstsze kody Turnstile na zrozumiałe info
    const codes = (ts as any)?.detail?.['error-codes'] || [];
    let friendly = 'Weryfikacja nie powiodła się. Spróbuj ponownie.';
    if (codes.includes('invalid-input-response')) friendly = 'Sesja wygasła lub token jest nieprawidłowy. Odśwież weryfikację i spróbuj ponownie.';
    if (codes.includes('invalid-input-secret')) friendly = 'Nieprawidłowy sekret Turnstile (konfiguracja serwera).';
    if (codes.includes('invalid-sitekey')) friendly = 'Nieprawidłowy site key Turnstile (konfiguracja klienta).';
    if (codes.includes('hostname-mismatch')) friendly = 'Domena nie jest dodana w Turnstile → Hostname Management.';
    return res.status(400).json({
      ok: false,
      message: friendly,
      detail: (ts as any).detail ?? (ts as any).reason ?? null,
    });
  }

  try {
    const [emailExists, usernameExists] = await Promise.all([
      prisma.user.findUnique({ where: { email: emailNorm } }),
      prisma.user.findUnique({ where: { username: usernameNorm } }),
    ]);
    if (emailExists)   return res.status(409).json({ ok: false, message: 'Ten e-mail jest już zarejestrowany.' });
    if (usernameExists) return res.status(409).json({ ok: false, message: 'Nazwa użytkownika jest już zajęta.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const token = randomBytes(32).toString('hex');

    const newUser = await prisma.user.create({
      data: {
        username: usernameNorm,
        email: emailNorm,
        passwordHash,
        emailToken: token,
        emailVerified: null,
      },
      select: { id: true, username: true, email: true },
    });

    try {
      await sendVerificationEmail(emailNorm, token);
    } catch (e) {
      console.warn('MAIL WARN:', e);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔗 DEV verify link: /api/auth/verify-email?token=${token}`);
    }

    return res.status(200).json({
      ok: true,
      message: 'Sprawdź e-mail i potwierdź rejestrację.',
      user: newUser,
    });
  } catch (e) {
    console.error('❌ Błąd rejestracji (DB):', e);
    return res.status(500).json({ ok: false, message: 'Błąd serwera. Spróbuj później.' });
  }
}
