// pages/api/auth/delete-account.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId } = req.body

  if (!userId) {
    return res.status(400).json({ message: 'Brak userId.' })
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    })
    return res.status(200).json({ message: 'Konto usunięte.' })
  } catch (err) {
    console.error('❌ Błąd usuwania konta:', err)
    return res.status(500).json({ message: 'Nie udało się usunąć konta.' })
  }
}
