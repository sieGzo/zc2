// pages/api/recipes.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

// ---- Typy spójne z frontendem ----
type Ingredient = { name: string; quantity?: string | number | null; unit?: string | null }
type Macros = { kcal?: number; carbs?: number; protein?: number; fat?: number }
interface Recipe {
  id: string
  title: string
  ingredients: Ingredient[]
  instructions?: string[] | null
  image?: string | null
  tags?: string[] | null
  pre_info?: string | null
  pro_tip?: string | null
  nutrition?: Macros | null       // na porcję
  nutrition100?: Macros | null    // na 100 g
}

// ---- Pomocnicze ----
const num = (v: any) => (v === null || v === undefined || v === '' ? undefined : Number(v))
const first = <T,>(arr: T[] | null | undefined) => (Array.isArray(arr) && arr.length ? arr[0] : undefined)

// Obsługa makr z dowolnymi aliasami
function pickMacros(obj: any, keys: { kcal?: string[]; carbs?: string[]; protein?: string[]; fat?: string[] }): Macros {
  const g = (arr?: string[]) => {
    if (!arr) return undefined
    for (const k of arr) if (obj && obj[k] !== undefined) return num(obj[k])
    return undefined
  }
  return {
    kcal: g(keys.kcal),
    carbs: g(keys.carbs),
    protein: g(keys.protein),
    fat: g(keys.fat),
  }
}

// ---- Ładowanie danych (JSON lub JSONL) z wieloma ścieżkami + fallback HTTP ----
function tryReadFile(p: string): string | null {
  try {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8')
  } catch {}
  return null
}

async function loadRaw(req: NextApiRequest): Promise<any[]> {
  const cwd = process.cwd()
  const candidates = [
    path.join(cwd, 'public', 'data', 'jemfit_recipes.jsonl'),
    path.join(cwd, 'public', 'jemfit_recipes.jsonl'),
    path.join(cwd, 'public', 'data', 'jemfit_recipes.json'),
    path.join(cwd, 'public', 'jemfit_recipes.json'),
  ]

  let content: string | null = null
  let from: 'jsonl' | 'json' | null = null

  for (const p of candidates) {
    const txt = tryReadFile(p)
    if (txt) {
      content = txt
      from = p.endsWith('.jsonl') ? 'jsonl' : 'json'
      break
    }
  }

  // Fallback HTTP z tej samej domeny (przydatne na Vercel, gdy FS nie ma zasobu)
  if (!content) {
    try {
      const host = req.headers.host
      const proto = (req.headers['x-forwarded-proto'] as string) || 'http'
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
    } catch {}
  }

  if (!content || !from) return []

  try {
    if (from === 'jsonl') {
      return content.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => JSON.parse(l))
    }
    return JSON.parse(content)
  } catch {
    // awaryjnie spróbuj linia-po-linii (czasem na końcu są puste/śmieci)
    try {
      return content.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => JSON.parse(l))
    } catch {
      return []
    }
  }
}

// ---- Normalizacja pól do schematu frontendu ----
function normalize(r: any): Recipe {
  // składniki: dopuszczamy stringi i obiekty
  const ingredients: Ingredient[] = Array.isArray(r.ingredients)
    ? r.ingredients.map((i: any) => {
        if (typeof i === 'string') return { name: i }
        return {
          name: i?.name ?? i?.nazwa ?? i?.ingredient ?? '',
          quantity: i?.quantity ?? i?.qty ?? i?.amount ?? null,
          unit: i?.unit ?? i?.jm ?? i?.uom ?? null,
        }
      })
    : []

  // instrukcje / kroki
  const instructions: string[] | null =
    Array.isArray(r.instructions) ? r.instructions :
    typeof r.instructions === 'string' ? r.instructions.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean) :
    Array.isArray(r.steps) ? r.steps : null

  // obrazek
  const image = r.image ?? r.photo ?? r.img ?? r.cover ?? null

  // tagi
  const tags = r.tags ?? r.kategorie ?? r.categories ?? null

  // --- NUTRITION ---
  // 1) w Twoim zbiorze to zwykle TABLICA obiektów; szukamy basis: 'per_serving'
  const nutritionSource =
    Array.isArray(r.nutrition) ? (r.nutrition.find((n: any) => n?.basis === 'per_serving') ?? first(r.nutrition)) :
    r.nutrition ?? r.per_serving ?? r.macro ?? r.makro ?? null

  const nutrition = nutritionSource
    ? pickMacros(nutritionSource, {
        kcal: ['calories_kcal', 'kcal', 'calories', 'energy_kcal', 'kalorie'],
        carbs: ['carbs_g', 'carbs', 'carbohydrates', 'weglowodany', 'węglowodany'],
        protein: ['protein_g', 'protein', 'bialko', 'białko'],
        fat: ['fat_g', 'fat', 'tluszcz', 'tłuszcz'],
      })
    : null

  // 2) /100 g – jeśli masz w danych (u Ciebie raczej brak)
  const per100Source = r.nutrition100 ?? r.per_100g ?? r['100g'] ?? r.macro100 ?? r.makro100 ?? null
  const nutrition100 = per100Source
    ? pickMacros(per100Source, {
        kcal: ['calories_kcal', 'kcal', 'calories', 'energy_kcal', 'kalorie'],
        carbs: ['carbs_g', 'carbs', 'carbohydrates', 'weglowodany', 'węglowodany'],
        protein: ['protein_g', 'protein', 'bialko', 'białko'],
        fat: ['fat_g', 'fat', 'tluszcz', 'tłuszcz'],
      })
    : null

  // „co warto wiedzieć” + „pro tip”
  const pre_info =
    (Array.isArray(r.read_before) ? r.read_before.filter(Boolean).join(' ') : undefined) ??
    r.pre_info ?? r.notes ?? r.info ?? null

  const pro_tip = r.pro_tip ?? r.protip ?? r.tip ?? null

  return {
    id: String(r.id ?? r.slug ?? r._id ?? r.uid),
    title: r.title ?? r.name ?? r.tytul ?? 'Bez tytułu',
    ingredients,
    instructions,
    image,
    tags,
    pre_info,
    pro_tip,
    nutrition,
    nutrition100,
  }
}

// ---- Handler ----
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const raw = await loadRaw(req)
    const all = raw.map(normalize)

    // sortowanie + listing
    if (!req.query.id) {
      const sort = String(req.query.sort || 'title_asc')
      const items = [...all].sort((a, b) => {
        if (sort === 'title_desc') return a.title.localeCompare(b.title) * -1
        if (sort === 'ingredients_asc') return (a.ingredients?.length ?? 0) - (b.ingredients?.length ?? 0)
        if (sort === 'ingredients_desc') return (b.ingredients?.length ?? 0) - (a.ingredients?.length ?? 0)
        return a.title.localeCompare(b.title)
      })
      return res.status(200).json({ items, total: items.length })
    }

    // pojedynczy przepis
    const id = String(req.query.id)
    const item = all.find(r => r.id === id) || null
    if (!item) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json({ item })
  } catch (e: any) {
    console.error('/api/recipes error:', e)
    return res.status(500).json({ error: 'Internal error' })
  }
}
