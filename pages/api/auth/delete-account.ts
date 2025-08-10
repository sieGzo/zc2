import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
// UWAGA: jeśli edytor nie ogarnia ścieżki z nawiasami [], patrz niżej (“Jeśli wciąż masz czerwone”)
import { authOptions } from './[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email || null
  if (!email) return res.status(401).json({ ok: false, message: 'Unauthorized' })

  try {
    // znajdź usera po emailu
    const found = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (!found?.id) {
      return res.status(400).json({ ok: false, message: 'Nie znaleziono użytkownika' })
    }

    // usuń zależności, które na pewno istnieją
    await prisma.$transaction([
      prisma.route.deleteMany({ where: { userId: found.id } }),
      prisma.user.delete({ where: { id: found.id } }),
    ])

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('delete-account error:', e)
    return res.status(500).json({ ok: false, message: 'Server error' })
  }
}
