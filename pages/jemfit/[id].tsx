// pages/jemfit/[id].tsx
import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'

type Ingredient = { name: string; quantity?: string | number | null; unit?: string | null }
type Macros = { kcal?: number; carbs?: number; protein?: number; fat?: number } | null | undefined

type NutritionArrayItem = {
  basis: 'per_serving'
  calories_kcal?: number
  carbs_g?: number
  protein_g?: number
  fat_g?: number
}
type Nutrition =
  | NutritionArrayItem[]
  | { kcal?: number; calories_kcal?: number; carbs?: number; protein?: number; fat?: number }
  | null
  | undefined

interface Recipe {
  id: string
  title: string
  ingredients: Ingredient[]
  instructions?: string[] | string | null
  image?: string | null
  tags?: string[] | null
  pre_info?: string | null
  pro_tip?: string | null
  nutrition?: Nutrition            // per serving (obsługujemy tablicę i obiekt)
  nutrition100?: Macros            // per 100 g (opcjonalnie)
  cuisine?: string | string[] | null
  course?: string | string[] | null
  category?: string | string[] | null
  meal_type?: string | string[] | null
}

const BRAND_RED = '#A21F1A'
const BRAND_GREEN = '#125D49'
const BLUR_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='

// ---------- helpers ----------
function normalizeMacrosPerServing(nutrition: Nutrition): Macros {
  if (!nutrition) return null
  if (Array.isArray(nutrition)) {
    const n = nutrition.find(x => x?.basis === 'per_serving') || nutrition[0]
    if (!n) return null
    return { kcal: n.calories_kcal, carbs: n.carbs_g, protein: n.protein_g, fat: n.fat_g }
  }
  const o = nutrition as { kcal?: number; calories_kcal?: number; carbs?: number; protein?: number; fat?: number }
  return { kcal: typeof o.kcal === 'number' ? o.kcal : o.calories_kcal, carbs: o.carbs, protein: o.protein, fat: o.fat }
}

function fmtNum(n?: number | null, digits = 0) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  return n.toLocaleString('pl-PL', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

// 0.5->1/2, 0.33->1/3, 0.25->1/4 itd.
function formatQuantityNumber(n: number): string {
  // całkowite → wypisz normalnie
  if (Number.isInteger(n)) return String(n)

  const abs = Math.abs(n)

  // małe ilości → spróbuj ładnych ułamków
  if (abs < 5) {
    const denoms = [2, 3, 4, 5, 6, 8, 10, 12, 16]
    for (const d of denoms) {
      const num = Math.round(n * d)
      const approx = num / d
      if (Math.abs(approx - n) < 1e-3 && num > 0) return `${num}/${d}`
    }
  }

  // fallback: maks. 2 miejsca po przecinku, z przecinkiem PL
  const s = (Math.round(n * 100) / 100).toString().replace('.', ',')
  return s
}

function fmtQty(q?: string | number | null): string {
  if (q == null || q === '') return '—'

  // jeżeli oryginał był już ułamkiem w stringu ("1/3") — zostaw
  if (typeof q === 'string' && q.includes('/')) return q.trim()

  if (typeof q === 'number') return formatQuantityNumber(q)

  // string liczbowy → licz do 2 miejsc, inaczej zwróć jak jest
  const t = q.trim()
  const num = Number(t.replace(',', '.'))
  if (!Number.isNaN(num) && /^-?\d+([.,]\d+)?$/.test(t)) return formatQuantityNumber(num)
  return t
}

// Instrukcje z różnych formatów → tablica stringów
function normalizeInstructions(instr?: string[] | string | any[] | null): string[] {
  if (!instr) return []
  const pick = (x: any): string => {
    if (x == null) return ''
    if (typeof x === 'string') return x.trim()
    if (typeof x === 'object') {
      const cand =
        x.text ?? x.step ?? x.content ?? x.description ??
        Object.values(x).find(v => typeof v === 'string')
      return (cand ? String(cand) : '').trim()
    }
    return String(x).trim()
  }
  if (Array.isArray(instr)) return instr.map(pick).filter(Boolean)
  const s = String(instr)
  const byLine = s.split(/\r?\n+/).map(x => x.trim()).filter(Boolean)
  if (byLine.length > 1) return byLine
  return s.split(/\s*(?=\d+\.)/g).map(x => x.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)
}

export default function RecipeAppView() {
  const router = useRouter()
  const { id } = router.query as { id?: string }

  const [data, setData] = useState<Recipe | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imgMap, setImgMap] = useState<Record<string, string>>({})
  const [servings, setServings] = useState<number>(1)
  const [showPreInfo, setShowPreInfo] = useState<boolean>(false)

  // fetch przepisu
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
      .catch(() => { if (!cancelled) setError('Nie udało się wczytać przepisu.') })
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
  const tags = useMemo(() => Array.from(new Set((data?.tags || []).filter(Boolean))), [data?.tags])
  const steps = useMemo(() => normalizeInstructions(data?.instructions), [data?.instructions])

  // TOTAL dla X porcji
  const total = useMemo<Macros>(() => {
    if (!perServing) return null
    const mul = Math.max(1, servings)
    return {
      kcal: perServing.kcal ? perServing.kcal * mul : undefined,
      carbs: perServing.carbs ? perServing.carbs * mul : undefined,
      protein: perServing.protein ? perServing.protein * mul : undefined,
      fat: perServing.fat ? perServing.fat * mul : undefined,
    }
  }, [perServing, servings])

  return (
    <main className="bg-white dark:bg-gray-900 min-h-screen">
      <Head><title>{data?.title ? `${data.title} — JemFit` : 'Przepis — JemFit'}</title></Head>

      {/* App-like sticky header */}
      <header className="sticky top-0 z-20 backdrop-blur bg-white/85 dark:bg-gray-900/85 border-b" style={{ borderColor: BRAND_GREEN + '33' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-3 px-3 py-2">
          <Link href="/jemfit" className="rounded-xl px-3 py-1.5 border" style={{ borderColor: BRAND_GREEN, color: BRAND_GREEN }}>
            ← Lista
          </Link>
          <h1 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{data?.title || 'Przepis'}</h1>
          <div className="ml-auto relative h-8 w-auto">
            <Image
              src="/jemfit-logo2.png"
              alt="JemFit"
              width={140}
              height={36}
              className="h-8 w-auto object-contain"
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
            {/* Główny hero: tytuł + miniaturka */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{data.title}</h2>
              <div className="relative w-full sm:w-56 h-40 sm:h-40 rounded-2xl overflow-hidden border" style={{ borderColor: '#e5e7eb' }}>
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

            {/* Pro tip + Co wiedzieć (akordeon) */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {/* Pro tip – mocniej wyróżniony */}
              {data.pro_tip && (
                <section className="rounded-2xl border p-4 relative overflow-hidden" style={{ borderColor: BRAND_RED + '33' }}>
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full" style={{ background: BRAND_RED + '10' }} />
                  <span className="inline-flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-full mb-2"
                    style={{ color: BRAND_RED, background: BRAND_RED + '10', border: `1px solid ${BRAND_RED}33` }}>
                    💡 Pro tip
                  </span>
                  <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-line">{data.pro_tip}</p>
                </section>
              )}

              {/* Co wiedzieć – rozwijane */}
              {data.pre_info && (
                <section className="rounded-2xl border p-4" style={{ borderColor: BRAND_GREEN + '33' }}>
                  <button
                    className="w-full flex items-center justify-between text-left"
                    onClick={() => setShowPreInfo(s => !s)}
                  >
                    <span className="font-medium" style={{ color: BRAND_GREEN }}>
                      Co wiedzieć przed przygotowaniem
                    </span>
                    <span className="text-sm" style={{ color: BRAND_GREEN }}>{showPreInfo ? '−' : '+'}</span>
                  </button>
                  {showPreInfo && (
                    <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-line mt-2">{data.pre_info}</p>
                  )}
                </section>
              )}
            </div>

            {/* Makra – na porcję + razem dla X porcji */}
            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              <section className="rounded-2xl border p-4" style={{ borderColor: BRAND_GREEN + '33' }}>
                <h3 className="font-medium mb-3" style={{ color: BRAND_GREEN }}>Na porcję</h3>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <dt>Kalorie</dt><dd className="text-right font-semibold">{fmtNum(perServing?.kcal)} kcal</dd>
                  <dt>Węgle</dt><dd className="text-right">{fmtNum(perServing?.carbs, 1)} g</dd>
                  <dt>Białko</dt><dd className="text-right">{fmtNum(perServing?.protein, 1)} g</dd>
                  <dt>Tłuszcz</dt><dd className="text-right">{fmtNum(perServing?.fat, 1)} g</dd>
                </dl>
              </section>

              <section className="rounded-2xl border p-4" style={{ borderColor: BRAND_RED + '33' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium" style={{ color: BRAND_RED }}>Razem dla porcji</h3>
                  <label className="text-sm flex items-center gap-2">
                    <span>Liczba porcji:</span>
                    <select
                      className="rounded-lg border px-2 py-1"
                      value={servings}
                      onChange={e => setServings(parseInt(e.target.value) || 1)}
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <dt>Kalorie</dt><dd className="text-right font-semibold">{fmtNum(total?.kcal)} kcal</dd>
                  <dt>Węgle</dt><dd className="text-right">{fmtNum(total?.carbs, 1)} g</dd>
                  <dt>Białko</dt><dd className="text-right">{fmtNum(total?.protein, 1)} g</dd>
                  <dt>Tłuszcz</dt><dd className="text-right">{fmtNum(total?.fat, 1)} g</dd>
                </dl>
              </section>
            </div>

            {/* Tagi (jeśli są) */}
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

            {/* Składniki */}
            <section className="mb-8">
              <h2 className="font-medium mb-3">Składniki</h2>
              <ul className="text-[13px] space-y-1">
                {data.ingredients.map((i, idx) => {
                  const qty = fmtQty(i.quantity)
                  const unit = i.unit ? ` ${i.unit}` : ''
                  return (
                    <li key={idx} className="flex justify-between gap-3">
                      <span className="text-gray-600 dark:text-gray-300 shrink-0 text-[12px]">
                        {qty}{unit}
                      </span>
                      <span className="min-w-0 text-right">{i.name}</span>
                    </li>
                  )
                })}
              </ul>
            </section>

            {/* Instrukcje */}
            {steps.length > 0 && (
              <section className="mb-12">
                <h2 className="font-medium mb-3">Przygotowanie</h2>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  {steps.map((step, idx) => (
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
