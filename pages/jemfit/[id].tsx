import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'

type Ingredient = { name: string; quantity?: string | number | null; unit?: string | null }
type Macros = { kcal?: number; carbs?: number; protein?: number; fat?: number } | null | undefined
type NutritionArrayItem = { basis: 'per_serving'; calories_kcal?: number }
type Nutrition = NutritionArrayItem[] | { kcal?: number; calories_kcal?: number } | null | undefined

interface Recipe {
  id: string
  title: string
  ingredients: Ingredient[]
  instructions?: string[] | null
  image?: string | null
  tags?: string[] | null
  pre_info?: string | null
  pro_tip?: string | null
  nutrition?: Nutrition             // na porcję (stary/nowy format)
  nutrition100?: Macros             // na 100 g (nowy format)
  cuisine?: string | string[] | null
  course?: string | string[] | null
  category?: string | string[] | null
  meal_type?: string | string[] | null
}

const BRAND_RED = '#A21F1A'
const BRAND_GREEN = '#125D49'
const BLUR_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='

function kcalFromNutrition(nutrition: Nutrition): number | undefined {
  if (!nutrition) return undefined
  if (Array.isArray(nutrition)) return nutrition.find(n => n.basis === 'per_serving')?.calories_kcal
  const o = nutrition as { kcal?: number; calories_kcal?: number }
  return typeof o.kcal === 'number' ? o.kcal : o.calories_kcal
}
function normalizeMacrosPerServing(nutrition: Nutrition): Macros {
  const kcal = kcalFromNutrition(nutrition)
  return { kcal: typeof kcal === 'number' ? kcal : undefined, carbs: undefined, protein: undefined, fat: undefined }
}
function fmtNum(n?: number | null, digits = 0) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  return n.toLocaleString('pl-PL', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

// tag helper (jak na liście)
function toArr(x: unknown): string[] {
  if (Array.isArray(x)) return x.map(String)
  if (typeof x === 'string') return x.split(/[;,/]/).map(s=>s.trim()).filter(Boolean)
  return []
}
function normTag(s: string) { return s ? s.slice(0,1).toUpperCase() + s.slice(1) : '' }
function getTags(r: Recipe): string[] {
  const raw = [
    ...(r.tags || []),
    ...toArr(r.cuisine),
    ...toArr(r.course),
    ...toArr(r.category),
    ...toArr(r.meal_type),
  ]
  return Array.from(new Set(raw.map(normTag).filter(Boolean)))
}

export default function RecipePage() {
  const router = useRouter()
  const { id } = router.query as { id?: string }

  const [data, setData] = useState<Recipe | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imgMap, setImgMap] = useState<Record<string, string>>({})

  // pobierz przepis
  useEffect(() => {
    if (!id) return
    let cancelled = false
    setError(null)
    fetch(`/api/recipes?id=${encodeURIComponent(id)}`)
      .then(async r => {
        if (!r.ok) throw new Error(`API /api/recipes zwróciło ${r.status}`)
        return r.json() as Promise<{ item?: Recipe } | { items?: Recipe[] }>
      })
      .then(d => {
        if (cancelled) return
        const item = (d as any).item ?? ((d as any).items?.find?.((x: Recipe)=>x.id===id)) ?? null
        setData(item)
      })
      .catch(() => {
        if (!cancelled) setError('Nie udało się wczytać przepisu.')
      })
    return () => { cancelled = true }
  }, [id])

  // mapa obrazków
  useEffect(() => {
    let cancelled = false
    fetch('/recipes_images.json')
      .then(r => (r.ok ? r.json() : {}))
      .then((m) => { if (!cancelled && m && typeof m === 'object') setImgMap(m as Record<string,string>) })
      .catch(()=>{})
    return () => { cancelled = true }
  }, [])

  const imgSrc = useMemo(() => {
    if (!data) return '/placeholder.jpg'
    const local = imgMap[data.id]
    if (typeof local === 'string' && local.startsWith('/')) return local
    if (data.image && (data.image.startsWith('/') || data.image.startsWith('data:') || /^https?:\/\//i.test(data.image))) return data.image
    return '/placeholder.jpg'
  }, [data, imgMap])

  const perServing: Macros = useMemo(() => normalizeMacrosPerServing(data?.nutrition), [data?.nutrition])
  const per100: Macros = data?.nutrition100
  const tags = getTags(data || ({} as any))

  return (
    <main className="bg-white dark:bg-gray-900 min-h-screen">
      <Head><title>{data?.title ? `${data.title} — JemFit` : 'Przepis — JemFit'}</title></Head>

      {/* Nagłówek */}
      <header className="w-full" style={{ background: BRAND_GREEN }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4 p-3">
          <Link href="/jemfit" className="inline-flex items-center gap-2 text-white/90 hover:text-white">
            ← Wróć do listy
          </Link>
          <div className="ml-auto relative h-10 w-auto">
            <Image
              src="/jemfit-logo.png"
              alt="JemFit"
              width={180}
              height={46}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 mt-4">
            {error} <Link href="/jemfit" className="underline">Wróć do listy</Link>
          </div>
        )}

        {!data && !error && (
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-4">Wczytywanie…</div>
        )}

        {data && (
          <>
            {/* Tytuł + małe zdjęcie po prawej */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{data.title}</h1>
              <div className="relative w-full sm:w-56 h-40 sm:h-40 rounded-xl overflow-hidden border">
                <Image
                  src={imgSrc}
                  alt={data.title}
                  fill
                  sizes="224px"
                  placeholder="blur"
                  blurDataURL={BLUR_PIXEL}
                  className="object-cover"
                />
              </div>
            </div>

            {/* Tagi */}
            {!!tags.length && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map(t => (
                  <span
                    key={t}
                    className="text-[11px] px-2 py-1 rounded-full border"
                    style={{ borderColor: BRAND_GREEN, color: BRAND_GREEN, background: BRAND_GREEN + '10' }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Panele info */}
            {(data.pre_info || data.pro_tip) && (
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {data.pre_info && (
                  <section className="rounded-2xl border p-4" style={{ borderColor: BRAND_GREEN + '33' }}>
                    <h2 className="font-medium mb-2" style={{ color: BRAND_GREEN }}>Co wiedzieć przed przygotowaniem</h2>
                    <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-line">{data.pre_info}</p>
                  </section>
                )}
                {data.pro_tip && (
                  <section className="rounded-2xl border p-4" style={{ borderColor: BRAND_RED + '33' }}>
                    <h2 className="font-medium mb-2" style={{ color: BRAND_RED }}>Pro tip</h2>
                    <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-line">{data.pro_tip}</p>
                  </section>
                )}
              </div>
            )}

            {/* Makra / kalorie */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <section className="rounded-2xl border p-4" style={{ borderColor: BRAND_GREEN + '33' }}>
                <h3 className="font-medium mb-3" style={{ color: BRAND_GREEN }}>Na porcję</h3>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <dt className="text-gray-600 dark:text-gray-300">Kalorie</dt>
                  <dd className="text-right font-semibold">{fmtNum(perServing?.kcal)} kcal</dd>
                  <dt className="text-gray-600 dark:text-gray-300">Węgle</dt>
                  <dd className="text-right">{fmtNum(perServing?.carbs, 1)} g</dd>
                  <dt className="text-gray-600 dark:text-gray-300">Białko</dt>
                  <dd className="text-right">{fmtNum(perServing?.protein, 1)} g</dd>
                  <dt className="text-gray-600 dark:text-gray-300">Tłuszcz</dt>
                  <dd className="text-right">{fmtNum(perServing?.fat, 1)} g</dd>
                </dl>
              </section>

              <section className="rounded-2xl border p-4" style={{ borderColor: BRAND_RED + '33' }}>
                <h3 className="font-medium mb-3" style={{ color: BRAND_RED }}>Na 100 g</h3>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <dt className="text-gray-600 dark:text-gray-300">Kalorie</dt>
                  <dd className="text-right font-semibold">{fmtNum(per100?.kcal)} kcal</dd>
                  <dt className="text-gray-600 dark:text-gray-300">Węgle</dt>
                  <dd className="text-right">{fmtNum(per100?.carbs, 1)} g</dd>
                  <dt className="text-gray-600 dark:text-gray-300">Białko</dt>
                  <dd className="text-right">{fmtNum(per100?.protein, 1)} g</dd>
                  <dt className="text-gray-600 dark:text-gray-300">Tłuszcz</dt>
                  <dd className="text-right">{fmtNum(per100?.fat, 1)} g</dd>
                </dl>
              </section>
            </div>

            {/* Składniki — mniejsze fonty + ilość po lewej */}
            <section className="mb-8">
              <h2 className="font-medium mb-3" style={{ color: '#111827' }}>Składniki</h2>
              <ul className="text-[13px] text-gray-800 dark:text-gray-100 space-y-1">
                {data.ingredients.map((i, idx) => (
                  <li key={idx} className="flex justify-between gap-3">
                    <span className="text-gray-600 dark:text-gray-300 shrink-0 text-[12px]">
                      {i.quantity}{i.unit ? ` ${i.unit}` : ''}
                    </span>
                    <span className="min-w-0 text-right">{i.name}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Instrukcje */}
            {!!(data.instructions && data.instructions.length) && (
              <section className="mb-12">
                <h2 className="font-medium mb-3" style={{ color: '#111827' }}>Przygotowanie</h2>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-800 dark:text-gray-100">
                  {data.instructions.map((step, idx) => (
                    <li key={idx} className="whitespace-pre-line">{step}</li>
                  ))}
                </ol>
              </section>
            )}

            <div className="mt-8">
              <Link href="/jemfit" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border"
                style={{ borderColor: BRAND_GREEN, color: BRAND_GREEN }}>
                ← Wróć do listy
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
