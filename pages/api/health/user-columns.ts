// pages/api/health/user-columns.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Postgres: tabela z wielką literą bywa cytowana jako "User"
    const rows = await prisma.$queryRawUnsafe<
      { column_name: string }[]
    >(`SELECT column_name FROM information_schema.columns WHERE table_name = 'User' OR table_name = 'user';`)

    res.json({
      ok: true,
      columns: rows.map(r => r.column_name).sort(),
    })
  } catch (e: any) {
    console.error('health/user-columns error:', e)
    res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
}
