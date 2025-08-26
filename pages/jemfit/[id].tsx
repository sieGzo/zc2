// /pages/jemfit/[id].tsx
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

type Ingredient = { name: string; quantity?: number | string | null; unit?: string | null; group?: string | null }
interface Recipe {
  id: string
  title: string
  ingredients: Ingredient[]
  tags?: string[]
  prep_time?: string | number | null
  instructions?: string | string[] | null
  nutrition?: { kcal?: number; carbs?: number; protein?: number; fat?: number } | null
  image?: string | null
}

export default function RecipeView() {
  const r = useRouter()
  const { id } = r.query
  const [data, setData] = useState<Recipe | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true
    fetch(`/api/recipes?id=${id}`)
      .then(x => x.json())
      .then(json => { if (active) setData(json.item) })
    return () => { active = false }
  }, [id])

  const brandRed = '#A21F1A'
  const brandGreen = '#125D49'

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Head>
        <title>{data?.title ? `${data.title} — JemFit` : 'Przepis — JemFit'}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* HEADER z logo */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto flex items-center gap-4 p-3">
          <Link href="/jemfit" className="text-sm text-gray-500 hover:text-gray-700">← Wróć</Link>
          <img src="https://www.jemfit.pl/wp-content/uploads/2024/10/logo-glowne-tagline-png-1.png" alt="JemFit" className="h-8 w-auto" />
        </div>
      </header>

      {/* HERO: zdjęcie + gradient paskiem wg brandu */}
      {data?.image && (
        <div className="w-full bg-gray-100">
          <div className="max-w-5xl mx-auto">
            <div className="aspect-[16/9] w-full overflow-hidden">
              <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}
      <div className="w-full" style={{background: `linear-gradient(90deg, ${brandGreen}, ${brandRed})`}}>
        <div className="max-w-5xl mx-auto py-6 px-4">
          <h1 className="text-2xl font-semibold text-white drop-shadow-sm">{data?.title || '—'}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4">
        {/* Makra */}
        {data?.nutrition && (
          <section className="rounded-2xl border p-4 mb-6">
            <div className="text-sm text-gray-600 mb-2">Wartość odżywcza jednej porcji:</div>
            <div className="flex flex-wrap gap-2">
              {typeof data.nutrition.kcal !== 'undefined' && (
                <Badge label={`${Math.round(Number(data.nutrition.kcal))} kcal`} color={brandRed} />
              )}
              {typeof data.nutrition.carbs !== 'undefined' && (
                <Badge label={`W: ${data.nutrition.carbs} g`} color={brandGreen} />
              )}
              {typeof data.nutrition.protein !== 'undefined' && (
                <Badge label={`B: ${data.nutrition.protein} g`} color={brandGreen} />
              )}
              {typeof data.nutrition.fat !== 'undefined' && (
                <Badge label={`T: ${data.nutrition.fat} g`} color={brandGreen} />
              )}
            </div>
          </section>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Składniki */}
          <section>
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-lg font-semibold">Składniki</h2>
              <div className="text-xs text-gray-500">na 1 porcję</div>
            </div>
            <ul className="divide-y">
              {data?.ingredients.map((i, idx) => (
                <li key={idx} className="py-2 grid grid-cols-[1fr_auto] gap-4">
                  <span>{i.name}</span>
                  <span className="text-gray-600">{i.quantity ? `${i.quantity}${i.unit ? ' '+i.unit : ''}` : ''}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Przygotowanie */}
          <section>
            <h2 className="text-lg font-semibold mb-2">Przygotowanie</h2>
            {Array.isArray(data?.instructions) ? (
              <ol className="list-decimal pl-5 space-y-2">
                {data?.instructions.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            ) : (
              <p className="whitespace-pre-line leading-relaxed">{(data?.instructions as string) || '—'}</p>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function Badge({ label, color }:{ label: string; color: string }) {
  return (
    <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm" style={{ borderColor: color, color }}>
      {label}
    </span>
  )
}
