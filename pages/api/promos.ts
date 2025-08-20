// pages/api/promos.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  // 👇 podmień obrazki na swoje w /public/promos/*
  const items = [
    {
      id: 'demo-egipt',
      title: 'Egipt – 7 dni all inclusive (Hurghada)',
      brand: 'TUI',
      price: 'od 1999 zł',
      dates: 'marzec–maj',
      img: '/promos/egipt.webp',
      href: '#',
      tag: 'All inclusive',
    },
    {
      id: 'demo-italy',
      title: 'Tanie loty do Włoch (Rzym, Bolonia, Mediolan)',
      brand: 'Ryanair',
      price: 'od 49 zł',
      dates: 'kwiecień–czerwiec',
      img: '/promos/italy.webp',
      href: '#',
      tag: 'City break',
    },
    {
      id: 'demo-lisbon',
      title: 'Lizbona – noclegi w centrum',
      brand: 'Booking',
      price: 'od 120 zł/noc',
      dates: 'maj–lipiec',
      img: '/promos/lisbon.webp',
      href: '#',
      tag: 'Hotel',
    },
  ]

  res.status(200).json({ items })
}
