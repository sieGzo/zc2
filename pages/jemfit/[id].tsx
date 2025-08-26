import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

type Ingredient = { name: string; quantity?: string | number | null; unit?: string | null }
interface Recipe { id: string; title: string; ingredients: Ingredient[]; instructions?: string | string[] | null; image?: string | null }

export default function RecipeView() {
  const { query } = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)

  useEffect(() => {
    if (query.id) {
      fetch(`/api/recipes?id=${query.id}`).then(r => r.json()).then(d => setRecipe(d.item))
    }
  }, [query.id])

  const brandRed = '#A21F1A'
  const brandGreen = '#125D49'

  if (!recipe) return <div>Ładowanie…</div>

  return (
    <main className="bg-white min-h-screen">
      <Head><title>{recipe.title} — JemFit</title></Head>

      <header className="border-b">
        <div className="max-w-4xl mx-auto flex items-center gap-4 p-3">
          <Link href="/jemfit" className="text-sm text-gray-600">← Wróć</Link>
          <img src="https://www.jemfit.pl/wp-content/uploads/2024/10/logo-glowne-tagline-png-1.png" className="h-8" alt="JemFit" />
        </div>
      </header>

      {recipe.image && <img src={recipe.image} alt={recipe.title} className="w-full max-h-96 object-cover" />}
      <div className="w-full" style={{ background: `linear-gradient(90deg, ${brandGreen}, ${brandRed})` }}>
        <div className="max-w-4xl mx-auto p-4 text-white font-semibold text-xl">{recipe.title}</div>
      </div>

      <div className="max-w-4xl mx-auto p-4 grid md:grid-cols-2 gap-6">
        <section>
          <h2 className="font-semibold mb-2">Składniki</h2>
          <ul className="space-y-1">
            {recipe.ingredients.map((i, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{i.name}</span>
                <span className="text-gray-600">{i.quantity}{i.unit ? ` ${i.unit}` : ''}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-semibold mb-2">Przygotowanie</h2>
          {Array.isArray(recipe.instructions)
            ? <ol className="list-decimal pl-5 space-y-2">{recipe.instructions.map((s, i) => <li key={i}>{s}</li>)}</ol>
            : <p className="whitespace-pre-line">{recipe.instructions || '—'}</p>}
        </section>
      </div>
    </main>
  )
}
