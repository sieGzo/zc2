// pages/offers/index.tsx
import Head from 'next/head'
import { useEffect, useState } from 'react'

type Offer = { id: string; title: string; price: number; origin: string; destination: string; date: string }

const MOCK: Offer[] = [
  { id: 'of1', title: 'Gdańsk → Kopenhaga (RT)', price: 129, origin: 'GDN', destination: 'CPH', date: '2025-10-12' },
  { id: 'of2', title: 'Warszawa → Barcelona (OW)', price: 159, origin: 'WAW', destination: 'BCN', date: '2025-09-03' },
]

export default function OffersPage() {
  const [list, setList] = useState<Offer[]>(MOCK)
  useEffect(() => {
    // TODO: podłącz realny feed tanich lotów / Twój endpoint
  }, [])

  return (
    <main className="max-w-6xl mx-auto p-6">
      <Head><title>Oferty tanich lotów — Zwiedzaj Chytrze</title></Head>
      <h1 className="text-3xl font-bold mb-4">Oferty tanich lotów</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Na start — przykładowe oferty. Podmień na realne API.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(o => (
          <div key={o.id} className="rounded-xl overflow-hidden border dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <h3 className="font-bold text-lg">{o.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{o.origin} → {o.destination} · {o.date}</p>
            <div className="mt-2 font-extrabold text-[#f1861e]">{o.price} zł</div>
          </div>
        ))}
      </div>
    </main>
  )
}
