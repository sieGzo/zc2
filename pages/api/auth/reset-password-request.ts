import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email } = req.body
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'Nieprawidłowy adres e-mail.' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(200).json({ message: 'Jeśli konto istnieje, wysłano e-mail.' })
    }

    const token = randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1h

    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    })

    await sendPasswordResetEmail(email, token)

    return res.status(200).json({ message: 'Wysłano e-mail z linkiem do zmiany hasła.' })
  } catch (err) {
    console.error('❌ Błąd resetowania hasła:', err)
    return res.status(500).json({ message: 'Błąd serwera.' })
  }
}
