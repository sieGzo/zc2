import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end()
  }

  const { email, username } = req.query

  if (!email && !username) {
    return res.status(400).json({ message: 'Brakuje parametru email lub username' })
  }

  try {
    console.log('Query:', req.query) // 👈 log parametru

    let emailTaken = false
    let usernameTaken = false

    if (email && typeof email === 'string') {
      console.log('Sprawdzam email:', email)
      const user = await prisma.user.findUnique({ where: { email } })
      emailTaken = !!user
    }

    if (username && typeof username === 'string') {
      console.log('Sprawdzam username:', username)
      const user = await prisma.user.findUnique({ where: { username } })
      usernameTaken = !!user
    }

    return res.status(200).json({ emailTaken, usernameTaken })
  } catch (error) {
    console.error('❌ Błąd w check-availability:', error)
    return res.status(500).json({ message: 'Błąd serwera' })
  }
}
