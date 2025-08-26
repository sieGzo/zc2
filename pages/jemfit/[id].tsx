// pages/jemfit/[id].tsx
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { GetServerSideProps } from 'next'
import fs from 'fs'
import path from 'path'

type JemfitNutrition = {
  basis: 'per_serving'
  calories_kcal?: number
  carbs_g?: number
  protein_g?: number
  fat_g?: number
}

type RecipeRaw = {
  id: string
  title: string
  image?: string | null
  ingredients: { name: string; quantity?: string | number | null; unit?: string | null }[]
  steps?: string[] | null
  read_before?: string[] | null
  protip?: string | null
  nutrition?: JemfitNutrition[] | null
}

type Macros = { kcal?: number; carbs?: number; protein?: number; fat?: number }

function normalize(recipe: RecipeRaw) {
  const perServing = (recipe.nutrition ?? []).find(n => n.basis === 'per_serving')
  const nutrition: Macros | undefined = perServing
    ? {
        kcal: perServing.calories_kcal ?? undefined,
        carbs: perServing.carbs_g ?? undefined,
        protein: perServing.protein_g ?? undefined,
        fat: perServing.fat_g ?? undefined,
      }
    : undefined

  const preInfo = recipe.read_before?.filter(Boolean) ?? []
  const proTip = recipe.protip ?? undefined

  return { ...recipe, nutrition, preInfo, proTip }
}

export default function RecipePage({ recipe: raw }: { recipe: RecipeRaw }) {
  const recipe = normalize(raw)

  return (
    <>
      <Head>
        <title>{recipe.title} — JemFit</title>
      </Head>

      <article className="container mx-auto max-w-5xl px-4 py-8 grid gap-8 md:grid-cols-[1fr_320px]">
        {/* LEWA KOLUMNA */}
        <section>
          <Link href="/jemfit" className="text-sm text-gray-500 hover:underline">
            ← Powrót
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold">{recipe.title}</h1>

          {recipe.image && (
            <div className="mt-4 relative w-full h-72">
              <Image
                src={recipe.image}
                alt={recipe.title}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}

          {/* Co warto wiedzieć */}
          {!!recipe.preInfo?.length && (
            <div className="mt-6 card">
              <div className="card-body">
                <h2 className="font-semibold text-lg mb-2">Co warto wiedzieć</h2>
                <ul className="list-disc pl-5 space-y-1">
                  {recipe.preInfo.map((info, idx) => (
                    <li key={idx}>{info}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Pro tip */}
          {recipe.proTip && (
            <div className="mt-6 card border-orange-400">
              <div className="card-body">
                <h2 className="font-semibold text-lg mb-2 text-orange-500">Pro tip 💡</h2>
                <p>{recipe.proTip}</p>
              </div>
            </div>
          )}

          {/* Składniki */}
          <div className="mt-6 card">
            <div className="card-body">
              <h2 className="font-semibold text-lg mb-2">Składniki</h2>
              <ul className="list-disc pl-5 space-y-1">
                {recipe.ingredients.map((i, idx) => (
                  <li key={idx}>
                    {i.quantity ? `${i.quantity} ${i.unit ?? ''} ` : ''}{i.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Kroki */}
          {recipe.steps && (
            <div className="mt-6 card">
              <div className="card-body">
                <h2 className="font-semibold text-lg mb-2">Przygotowanie</h2>
                <ol className="list-decimal pl-5 space-y-2">
                  {recipe.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </section>

        {/* PRAWA KOLUMNA */}
        <aside className="space-y-6">
          {/* Logo Jemfit */}
          <div className="flex justify-center">
            <Image
              src="/jemfit-logo.2.png"
              alt="JemFit logo"
              width={200}
              height={80}
              className="object-contain"
              priority
            />
          </div>

          {recipe.nutrition && (
            <div className="card">
              <div className="card-body">
                <h2 className="font-semibold text-lg mb-2">Wartość odżywcza (na porcję)</h2>
                <ul className="space-y-1 text-sm">
                  <li>Kalorie: {recipe.nutrition.kcal ?? '—'} kcal</li>
                  <li>Węglowodany: {recipe.nutrition.carbs ?? '—'} g</li>
                  <li>Białko: {recipe.nutrition.protein ?? '—'} g</li>
                  <li>Tłuszcz: {recipe.nutrition.fat ?? '—'} g</li>
                </ul>
              </div>
            </div>
          )}
        </aside>
      </article>
    </>
  )
}

// ---- SSR: wczytaj dane z pliku JSONL ----
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const id = ctx.params?.id as string
  const filePath = path.join(process.cwd(), 'public', 'data', 'jemfit_recipes.jsonl')
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/).filter(Boolean)
  const recipes: RecipeRaw[] = lines.map(l => JSON.parse(l))
  const recipe = recipes.find(r => r.id === id) || null

  if (!recipe) return { notFound: true }

  return { props: { recipe } }
}
