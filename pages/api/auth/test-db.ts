import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const users = await prisma.user.findMany({ take: 1 })
    return res.status(200).json({ ok: true, users })
  } catch (error: any) {
    console.error('❌ Błąd w test-db.ts:', error)

    return res.status(500).json({
      ok: false,
      error: error.message || 'Unknown error',
      full: String(error),
      stack: error.stack || null
    })
  }
}
