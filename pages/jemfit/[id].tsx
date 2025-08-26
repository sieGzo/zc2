// pages/jemfit/[id].tsx
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
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
              width={220}
              height={88}
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

// ---- SSR: wczytaj dane z pliku JSONL/JSON (bez 500) ----
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const id = String(ctx.params?.id || '')
  const cwd = process.cwd()

  // Spróbuj kilku ścieżek (Vercel/Local) i formatów (JSONL/JSON)
  const candidates = [
    path.join(cwd, 'public', 'data', 'jemfit_recipes.jsonl'),
    path.join(cwd, 'public', 'jemfit_recipes.jsonl'),
    path.join(cwd, 'public', 'data', 'jemfit_recipes.json'),
    path.join(cwd, 'public', 'jemfit_recipes.json'),
  ]

  let content: string | null = null
  let from: 'jsonl' | 'json' | null = null

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        content = fs.readFileSync(p, 'utf8')
        from = p.endsWith('.jsonl') ? 'jsonl' : 'json'
        break
      }
    } catch (e) {
      // pomiń i próbuj dalej
    }
  }

  // Fallback: pobierz przez HTTP z /data (działa na Vercel nawet bez fs)
  if (!content) {
    try {
      const host = ctx.req.headers.host
      const proto = (ctx.req.headers['x-forwarded-proto'] as string) || 'http'
      const base = `${proto}://${host}`
      const urls = ['/data/jemfit_recipes.jsonl', '/jemfit_recipes.jsonl', '/data/jemfit_recipes.json', '/jemfit_recipes.json']
      for (const u of urls) {
        const res = await fetch(`${base}${u}`)
        if (res.ok) {
          content = await res.text()
          from = u.endsWith('.jsonl') ? 'jsonl' : 'json'
          break
        }
      }
    } catch {
      // zignoruj – obsłużymy niżej
    }
  }

  if (!content || !from) {
    // brak danych – pokaż 404 zamiast 500
    return { notFound: true }
  }

  let recipes: RecipeRaw[] = []
  try {
    if (from === 'jsonl') {
      recipes = content
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => JSON.parse(l))
    } else {
      recipes = JSON.parse(content)
    }
  } catch (e) {
    // jeżeli JSON ma śmieci na końcu – przefiltruj po kolei linie
    try {
      recipes = content
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => JSON.parse(l))
    } catch {
      return { notFound: true }
    }
  }

  const recipe = recipes.find(r => String(r.id) === id) || null
  if (!recipe) return { notFound: true }

  return { props: { recipe } }
}
