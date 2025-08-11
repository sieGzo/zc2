// pages/api/auth/delete-account.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
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
    const found = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (!found?.id) {
      return res.status(400).json({ ok: false, message: 'Nie znaleziono użytkownika' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.route.deleteMany({ where: { userId: found.id } }).catch(() => {})
      await tx.session.deleteMany({ where: { userId: found.id } }).catch(() => {})
      await tx.account.deleteMany({ where: { userId: found.id } }).catch(() => {})
      // Jeśli masz model VerificationToken w schemacie (np. dla magic linków),
      // usuń powiązane rekordy – najpierw sprawdź runtime'owo:
      const anyTx = tx as any
      if (anyTx.verificationToken) {
        await anyTx.verificationToken.deleteMany({ where: { identifier: email } }).catch(() => {})
      }
      await tx.user.delete({ where: { id: found.id } })
    })

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('delete-account error:', e)
    return res.status(500).json({ ok: false, message: 'Server error' })
  }
}
