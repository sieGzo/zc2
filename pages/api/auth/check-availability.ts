// pages/api/auth/check-availability.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Metoda niedozwolona' })
  }

  const { email, username } = req.query
  if (!email && !username) {
    return res.status(400).json({ message: 'Brakuje parametru email lub username' })
  }

  try {
    const emailTaken = typeof email === 'string'
      ? !!(await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } }))
      : false

    const usernameTaken = typeof username === 'string'
      ? !!(await prisma.user.findUnique({ where: { username: username.trim() } }))
      : false

    return res.status(200).json({ emailTaken, usernameTaken })
  } catch (error) {
    console.error('❌ Błąd w check-availability:', error)
    return res.status(500).json({ message: 'Błąd serwera. Spróbuj ponownie później.' })
  }