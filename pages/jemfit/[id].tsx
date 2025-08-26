import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

type Ingredient = { name: string; quantity?: string | number | null; unit?: string | null }
type Macros = { kcal?: number; carbs?: number; protein?: number; fat?: number }
interface Recipe {
  id: string
  title: string
  ingredients: Ingredient[]
  instructions?: string[] | null
  image?: string | null
  pre_info?: string | null
  pro_tip?: string | null
  nutrition?: Macros | null
  nutrition100?: Macros | null
}

const BRAND_RED = '#A21F1A'
const BRAND_GREEN = '#125D49'

export default function RecipeView() {
  const { query } = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)

  useEffect(() => {
    if (query.id) fetch(`/api/recipes?id=${query.id}`).then(r => r.json()).then(d => setRecipe(d.item))
  }, [query.id])

  if (!recipe) return <main className="p-6">Ładowanie…</main>

  return (
    <main className="bg-white min-h-screen">
      <Head><title>{recipe.title} — JemFit</title></Head>

      {/* Header: tytuł po lewej, DUŻE logo po prawej */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 p-3">
          <div className="flex items-center gap-3">
            <Link href="/jemfit" className="text-sm text-gray-600">← Powrót</Link>
            <h1 className="text-lg md:text-xl font-semibold">{recipe.title}</h1>
          </div>
          <img src="/jemfit-logo.png" className="h-10 md:h-12" alt="JemFit" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 grid md:grid-cols-[2fr_1fr] gap-8">
        {/* Kolumna główna */}
        <section className="space-y-6">
          {/* Co warto wiedzieć */}
          {recipe.pre_info && (
            <div className="rounded-2xl border p-4" style={{ borderColor: BRAND_GREEN + '33' }}>
              <h2 className="font-semibold mb-2" style={{ color: BRAND_GREEN }}>Co warto wiedzieć przed przygotowaniem</h2>
              <p className="text-gray-800 whitespace-pre-line">{recipe.pre_info}</p>
            </div>
          )}

          {/* Pro tip */}
          {recipe.pro_tip && (
            <div className="rounded-2xl border p-4" style={{ borderColor: BRAND_RED + '33' }}>
              <h2 className="font-semibold mb-2" style={{ color: BRAND_RED }}>Pro tip</h2>
              <p className="text-gray-800 whitespace-pre-line">{recipe.pro_tip}</p>
            </div>
          )}

          {/* Składniki */}
          <div>
            <h2 className="font-semibold mb-2">Składniki</h2>
            <ul className="space-y-1 text-gray-800">
              {recipe.ingredients.map((i, idx) => (
                <li key={idx} className="flex justify-between gap-3">
                  <span className="min-w-0">{i.name}</span>
                  <span className="text-gray-600 shrink-0">{i.quantity}{i.unit ? ` ${i.unit}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Przygotowanie */}
          <div>
            <h2 className="font-semibold mb-2">Przygotowanie</h2>
            {recipe.instructions?.length
              ? <ol className="list-decimal pl-5 space-y-2">{recipe.instructions.map((s, i) => <li key={i}>{s}</li>)}</ol>
              : <p className="text-gray-600">—</p>
            }
          </div>
        </section>

        {/* Kolumna boczna (prawa) */}
        <aside className="space-y-6">
          {/* Małe zdjęcie osadzone w treści */}
          {recipe.image
            ? <img src={recipe.image} alt={recipe.title} className="w-full rounded-xl border object-cover" style={{ maxHeight: 240 }} />
            : <div className="w-full h-40 rounded-xl border" style={{background:`linear-gradient(90deg, ${BRAND_GREEN}22, ${BRAND_RED}22)`}} />
          }

          {/* Makra */}
          {(recipe.nutrition || recipe.nutrition100) && (
            <div className="rounded-2xl border p-4">
              <h3 className="font-semibold mb-3">Wartość odżywcza</h3>
              {recipe.nutrition && (
                <div className="mb-3">
                  <div className="text-sm text-gray-600 mb-1">na porcję</div>
                  <MacroRow m={recipe.nutrition} />
                </div>
              )}
              {recipe.nutrition100 && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">na 100 g</div>
                  <MacroRow m={recipe.nutrition100} />
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}

function MacroRow({ m }: { m: Macros }) {
  const Cell = ({ label, value }:{ label: string; value?: number }) => (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-700">{label}</span>
      <span className="text-gray-900">{typeof value === 'number' ? value : '—'}{label === 'kcal' ? '' : ' g'}</span>
    </div>
  )
  return (
    <div className="rounded-xl border px-3 py-2">
      <Cell label="kcal" value={m.kcal} />
      <Cell label="węglowodany" value={m.carbs} />
      <Cell label="białko" value={m.protein} />
      <Cell label="tłuszcze" value={m.fat} />
    </div>
  )
}
