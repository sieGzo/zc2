import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

type Ingredient = { name: string; quantity?: string | number | null; unit?: string | null }
interface Recipe { id: string; title: string; ingredients: Ingredient[]; tags?: string[]; image?: string | null }
interface ApiResponse { items: Recipe[]; total: number }

export default function JemfitList() {
  const [data, setData] = useState<ApiResponse | null>(null)

  useEffect(() => {
    fetch('/api/recipes')
      .then(r => r.json())
      .then(setData)
  }, [])

  const brandRed = '#A21F1A'
  const brandGreen = '#125D49'

  return (
    <main className="bg-white min-h-screen">
      <Head>
        <title>JemFit — przepisy</title>
      </Head>

      <header className="w-full" style={{ background: `linear-gradient(90deg, ${brandGreen}, ${brandRed})` }}>
        <div className="max-w-6xl mx-auto flex items-center gap-4 p-3">
          <img src="https://www.jemfit.pl/wp-content/uploads/2024/10/logo-glowne-tagline-png-1.png" alt="JemFit" className="h-8" />
          <h1 className="text-white font-semibold">Przepisy</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map(r => (
          <article key={r.id} className="rounded-2xl border shadow-sm overflow-hidden">
            {r.image && <img src={r.image} alt={r.title} className="w-full aspect-[16/9] object-cover" />}
            <div className="p-4">
              <h2 className="font-semibold mb-2 text-lg">
                <Link href={`/jemfit/${r.id}`} className="hover:underline">{r.title}</Link>
              </h2>
              <ul className="text-sm text-gray-700 space-y-1">
                {r.ingredients.map((i, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{i.name}</span>
                    <span className="text-gray-600">
                      {i.quantity}{i.unit ? ` ${i.unit}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
