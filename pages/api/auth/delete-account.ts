// pages/api/auth/delete-account.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './[...nextauth]'           // ← dostosuj ścieżkę jeśli inna
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method Not Allowed' })

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) return res.status(401).json({ ok: false, message: 'Unauthorized' })

  try {
    const userId = session.user.id as string

    // Usuń powiązane rekordy (jeśli nie masz ON DELETE CASCADE)
    await prisma.route.deleteMany({ where: { userId } })
    await prisma.newsletterSubscriber.deleteMany({ where: { userId } }).catch(() => {})
    await prisma.account.deleteMany({ where: { userId } }).catch(() => {})
    await prisma.session.deleteMany({ where: { userId } }).catch(() => {})

    await prisma.user.delete({ where: { id: userId } })

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('❌ delete-account error:', e)
    return res.status(500).json({ ok: false, message: 'Błąd serwera' })
  }
}
