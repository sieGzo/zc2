import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Brak id użytkownika' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        visitedCountries: true,
        age: true,
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' })
    }

    res.status(200).json(user)
  } catch (error) {
    console.error('Błąd podczas pobierania usera:', error)
    res.status(500).json({ error: 'Błąd serwera' })
  }
}
