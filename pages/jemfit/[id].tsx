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
  nutrition?: Nutrition            // per serving
  nutrition100?: Macros            // per 100 g (opcjonalnie)
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

// ułamki elegancko; duże/całkowite zostają liczbami
function formatQuantityNumber(n: number): string {
  if (Number.isInteger(n)) return String(n)
  const abs = Math.abs(n)
  if (abs < 5) {
    const denoms = [2,3,4,5,6,8,10,12,16]
    for (const d of denoms) {
      const num = Math.round(n * d)
      const approx = num / d
      if (Math.abs(approx - n) < 1e-3 && num > 0) return `${num}/${d}`
    }
  }
  const s = (Math.round(n * 100) / 100).toString().replace('.', ',')
  return s
}
function fmtQty(q?: string | number | null): string {
  if (q == null || q === '') return '—'
  if (typeof q === 'string' && q.includes('/')) return q.trim()
  if (typeof q === 'number') return formatQuantityNumber(q)
  const t = q.trim()
  const num = Number(t.replace(',', '.'))
  if (!Number.isNaN(num) && /^-?\d+([.,]\d+)?$/.test(t)) return formatQuantityNumber(num)
  return t
}

// Instrukcje → tablica
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

// pre_info → lista (dzieli także „kropkaBezSpacji” i myślniki)
// pre_info → lista (dzieli też „kropkaBezSpacji” i myślniki)
function preInfoToItems(txt?: unknown): string[] {
  if (txt == null) return []

  // Wyciągnij tekst niezależnie od formatu
  const pick = (x: any): string => {
    if (x == null) return ''
    if (typeof x === 'string') return x
    if (typeof x === 'object') {
      const cand =
        x.text ?? x.content ?? x.description ?? x.value ??
        (Array.isArray(x) ? x.map(pick).join(' ') : '')
      return typeof cand === 'string' ? cand : ''
    }
    return String(x)
  }

  const base =
    Array.isArray(txt) ? txt.map(pick).join(' ') :
    typeof txt === 'string' ? txt :
    pick(txt)

  const s = base
    .replace(/([a-ząćęłńóśźż])\.([A-ZĄĆĘŁŃÓŚŹŻ])/g, '$1. $2') // kropkaBezSpacji → kropka spacja
    .replace(/\s*[-–—]\s*/g, '. ')                              // myślnik jako separator

  return s
    .split(/\.\s+|\n+|•\s+|·\s+|;+\s+|(?<=\.)$/g)
    .map(t => t.trim())
    .filter(Boolean)
}

// niełamliwa spacja po jednowyrazowych spójnikach/przyimkach
function nb(s: string) {
  return (s || '').replace(/(^|\s)([wWzZiIoOuUaA])\s+/g, (_, p, l) => p + l + '\u00A0')
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
  const steps = useMemo(() => normalizeInstructions(data?.instructions), [data?.instructions])
  const preList = useMemo(() => preInfoToItems(data?.pre_info), [data?.pre_info])

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

      {/* HERO – pełna szerokość */}
      {data && (
        <div className="relative w-full">
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] md:aspect-[21/9]">
            <Image
              src={imgSrc}
              alt={data.title}
              fill
              sizes="100vw"
              placeholder="blur"
              blurDataURL={BLUR_PIXEL}
              className="object-cover"
              priority
            />
          </div>

          {/* Tytuł w czerwonym na dolnym overlay'u */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl md:text-3xl font-semibold drop-shadow"
                  style={{ color: BRAND_RED, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                {nb(data.title)}
              </h1>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 mt-4">
            {error} <Link href="/jemfit" className="underline">Wróć do listy</Link>
          </div>
        )}
        {!data && !error && <div className="text-sm text-gray-600 dark:text-gray-300 mt-4">Wczytywanie…</div>}

        {data && (
          <>
            {/* Karty: Pro tip + Co wiedzieć */}
<div className="grid sm:grid-cols-2 gap-4 mb-6">
  {data.pro_tip && (
    <section className="relative rounded-2xl border p-4 overflow-hidden" style={{ borderColor: BRAND_RED + '33' }}>
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full" style={{ background: BRAND_RED + '10' }} />
      <span className="inline-flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-full mb-2"
        style={{ color: BRAND_RED, background: BRAND_RED + '10', border: `1px solid ${BRAND_RED}33` }}>
        💡 Pro tip
      </span>
      <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-line">{data.pro_tip}</p>
    </section>
  )}

  {preList.length > 0 && (
    <section className="relative rounded-2xl border p-4 overflow-hidden" style={{ borderColor: BRAND_GREEN + '33' }}>
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full" style={{ background: BRAND_RED + '10' }} />
      <button
        className="w-full flex items-center justify-between text-left mb-2"
        onClick={() => setShowPreInfo(s => !s)}
      >
        <span className="font-medium" style={{ color: BRAND_GREEN }}>
          Co wiedzieć przed przygotowaniem
        </span>
        <span className="text-sm" style={{ color: BRAND_GREEN }}>{showPreInfo ? '−' : '+'}</span>
      </button>
      {showPreInfo && (
        <ul className="space-y-2 text-sm">
          {preList.map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-[6px] h-1.5 w-1.5 rounded-full" style={{ background: BRAND_GREEN }} />
              <span className="text-gray-800 dark:text-gray-100">{t}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )}
</div>

    {/* Makra + stepper porcji */}
    <section className="rounded-2xl border p-4 mb-8" style={{ borderColor: BRAND_GREEN + '33' }}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h3 className="font-medium" style={{ color: BRAND_GREEN }}>Porcje i makro</h3>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="h-8 w-8 rounded-full border text-lg leading-none"
            style={{ borderColor: BRAND_RED, color: BRAND_RED }}
            onClick={() => setServings(s => Math.max(1, s - 1))}
            aria-label="Mniej porcji"
          >−</button>
          <div className="min-w-[3rem] text-center font-semibold">{servings}</div>
          <button
            className="h-8 w-8 rounded-full border text-lg leading-none"
            style={{ borderColor: BRAND_RED, color: BRAND_RED }}
            onClick={() => setServings(s => Math.min(10, s + 1))}
            aria-label="Więcej porcji"
          >+</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="rounded-xl p-3 border" style={{ borderColor: BRAND_GREEN + '22' }}>
          <div className="opacity-70">Kalorie</div>
          <div className="text-lg font-semibold">{fmtNum(total?.kcal)} kcal</div>
          <div className="text-[11px] opacity-60">~{fmtNum(perServing?.kcal)} kcal / porcja</div>
        </div>
        <div className="rounded-xl p-3 border" style={{ borderColor: BRAND_GREEN + '22' }}>
          <div className="opacity-70">Białko</div>
          <div className="text-lg font-semibold">{fmtNum(total?.protein, 1)} g</div>
          <div className="text-[11px] opacity-60">~{fmtNum(perServing?.protein, 1)} g / porcja</div>
        </div>
        <div className="rounded-xl p-3 border" style={{ borderColor: BRAND_GREEN + '22' }}>
          <div className="opacity-70">Węgle</div>
          <div className="text-lg font-semibold">{fmtNum(total?.carbs, 1)} g</div>
          <div className="text-[11px] opacity-60">~{fmtNum(perServing?.carbs, 1)} g / porcja</div>
        </div>
        <div className="rounded-xl p-3 border" style={{ borderColor: BRAND_GREEN + '22' }}>
          <div className="opacity-70">Tłuszcz</div>
          <div className="text-lg font-semibold">{fmtNum(total?.fat, 1)} g</div>
          <div className="text-[11px] opacity-60">~{fmtNum(perServing?.fat, 1)} g / porcja</div>
        </div>
      </div>
    </section>

            {/* Składniki */}
            <section className="mb-8">
              <h2 className="font-medium mb-3" style={{ color: BRAND_GREEN }}>Składniki</h2>
              <div className="rounded-2xl border" style={{ borderColor: BRAND_GREEN + '22' }}>
                <ul className="divide-y" style={{ borderColor: BRAND_GREEN + '11' }}>
                  {data.ingredients.map((i, idx) => {
                    const qty = fmtQty(i.quantity)
                    const unit = i.unit ? ` ${i.unit}` : ''
                    return (
                      <li key={idx} className="flex items-center gap-3 px-4 py-2">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold"
                             style={{ background: BRAND_GREEN + '10', color: BRAND_GREEN, border: `1px solid ${BRAND_GREEN}22` }}>
                          {idx + 1}
                        </div>
                        <span className="text-gray-600 dark:text-gray-300 text-[12px] shrink-0 w-24 text-right">
                          {qty}{unit}
                        </span>
                        <span className="min-w-0 text-sm">{i.name}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </section>

            {/* Instrukcje */}
            {steps.length > 0 && (
              <section className="mb-12">
                <h2 className="font-medium mb-3" style={{ color: BRAND_GREEN }}>Przygotowanie</h2>
                <ol className="space-y-3">
                  {steps.map((step, idx) => (
                    <li key={idx} className="relative rounded-xl border p-4 pl-12"
                        style={{ borderColor: BRAND_GREEN + '22' }}>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold"
                           style={{ background: BRAND_RED + '10', color: BRAND_RED, border: `1px solid ${BRAND_RED}22` }}>
                        {idx + 1}
                      </div>
                      <div className="text-sm whitespace-pre-line">{step}</div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <div className="mt-8 flex gap-3">
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
