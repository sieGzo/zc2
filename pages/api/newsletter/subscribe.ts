import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { email, name } = req.body

  if (!email) {
    return res.status(400).json({ message: 'Brakuje adresu e-mail' })
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { name },
      create: { email, name },
    })

    return res.status(200).json({ message: 'Zapisano do newslettera ✨' })
  } catch (err) {
    console.error('❌ Błąd newslettera:', err)
    return res.status(500).json({ message: 'Błąd serwera' })
  }
}
