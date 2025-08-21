import type { NextApiRequest, NextApiResponse } from 'next'
import { promos, promoPath } from '@/lib/promos'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  // wzbogacamy o href, jeśli brak → /promo/[id]
  const items = promos.map(p => ({ ...p, href: p.href ?? promoPath(p.id) }))
  res.status(200).json({ items })
}
