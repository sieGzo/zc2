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

// ---- Ładowanie danych (JSON lub JSONL) ----
function loadRaw(): any[] {
  // 1) JSONL (po 1 obiekcie na linię) – plik z Twojego uploadu
  const jsonlPath = path.join(process.cwd(), 'public', 'data', 'jemfit_recipes.jsonl')
  if (fs.existsSync(jsonlPath)) {
    const text = fs.readFileSync(jsonlPath, 'utf8')
    return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => JSON.parse(l))
  }

  // 2) Zapasowo .json (tablica)
  const jsonPath = path.join(process.cwd(), 'public', 'data', 'jemfit_recipes.json')
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  }

  // 3) Awaryjnie – pusta lista
  return []
}

// ---- Normalizacja pól do schematu frontendu ----
const num = (v: any) => (v === null || v === undefined || v === '' ? undefined : Number(v))

function pickMacros(obj: any, keys: { kcal?: string[]; carbs?: string[]; protein?: string[]; fat?: string[] }): Macros {
  const g = (arr?: string[]) => {
    if (!arr) return undefined
    for (const k of arr) if (obj?.[k] !== undefined) return num(obj[k])
    return undefined
  }
  return {
    kcal: g(keys.kcal),
    carbs: g(keys.carbs),
    protein: g(keys.protein),
    fat: g(keys.fat),
  }
}

function normalize(r: any): Recipe {
  // składniki: dopuszczamy różne formaty
  const ingredients: Ingredient[] =
    (r.ingredients?.map?.((i: any) => ({
      name: i.name ?? i.nazwa ?? i.ingredient ?? '',
      quantity: i.quantity ?? i.qty ?? i.amount ?? null,
      unit: i.unit ?? i.jm ?? i.uom ?? null,
    }))) ?? []

  // instrukcje: jako tablica stringów
  const instructions: string[] | null =
    Array.isArray(r.instructions) ? r.instructions :
    typeof r.instructions === 'string' ? r.instructions.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean) :
    Array.isArray(r.steps) ? r.steps : null

  // obrazek
  const image = r.image ?? r.photo ?? r.img ?? null

  // tagi
  const tags = r.tags ?? r.kategorie ?? r.categories ?? null

  // makra NA PORCJĘ – obsłuż kilka nazw
  const perServingSource = r.nutrition ?? r.per_serving ?? r.macro ?? r.makro ?? r
  const nutrition = pickMacros(perServingSource, {
    kcal: ['kcal', 'calories', 'energy_kcal', 'kalorie'],
    carbs: ['carbs', 'carbohydrates', 'weglowodany', 'węglowodany'],
    protein: ['protein', 'bialko', 'białko'],
    fat: ['fat', 'tluszcz', 'tłuszcz'],
  })

  // makra NA 100 g – jeśli istnieją, pokaż
  const per100Source = r.nutrition100 ?? r.per_100g ?? r['100g'] ?? r.macro100 ?? r.makro100
  const nutrition100 = per100Source
    ? pickMacros(per100Source, {
        kcal: ['kcal', 'calories', 'energy_kcal', 'kalorie'],
        carbs: ['carbs', 'carbohydrates', 'weglowodany', 'węglowodany'],
        protein: ['protein', 'bialko', 'białko'],
        fat: ['fat', 'tluszcz', 'tłuszcz'],
      })
    : null

  // „co warto wiedzieć” + „pro tip”
  const pre_info = r.pre_info ?? r.notes ?? r.info ?? null
  const pro_tip = r.pro_tip ?? r.tip ?? r.protip ?? null

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
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const all = loadRaw().map(normalize)

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
}
