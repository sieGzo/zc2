import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.status(200).json({ ok: true })
  } catch (e: any) {
    console.error('DB health error:', e?.message || e)
    res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
}
