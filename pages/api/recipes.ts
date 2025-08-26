// /pages/api/recipes.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

type Ingredient = { name: string; quantity?: string | number | null; unit?: string | null }
type Macros = { kcal?: number; carbs?: number; protein?: number; fat?: number } | null | undefined

type NutritionArrayItem = {
  basis?: 'per_serving' | string
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

export interface Recipe {
  id: string
  title: string
  ingredients: Ingredient[]
  instructions?: string[] | null
  image?: string | null
  tags?: string[]
  pre_info?: string | null
  pro_tip?: string | null
  nutrition?: Nutrition
  nutrition100?: Macros
  cuisine?: string | string[] | null
  course?: string | string[] | null
  category?: string | string[] | null
  meal_type?: string | string[] | null
}

// ---------- helpers ----------
const tryRead = (p: string) => {
  try { return fs.readFileSync(p, 'utf8') } catch { return null }
}

function loadRaw(): any[] {
  const root = process.cwd()
  const candidates = [
    path.join(root, 'public', 'jemfit_recipes.jsonl'),
    path.join(root, 'data', 'jemfit_recipes.jsonl'),
    path.join(root, 'public', 'jemfit_recipes.json'),
    path.join(root, 'data', 'jemfit_recipes.json'),
  ]

  for (const file of candidates) {
    const txt = tryRead(file)
    if (!txt) continue

    if (file.endsWith('.jsonl')) {
      return txt
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => { try { return JSON.parse(l) } catch { return null } })
        .filter(Boolean) as any[]
    }
    if (file.endsWith('.json')) {
      try {
        const j = JSON.parse(txt)
        if (Array.isArray(j)) return j
        if (j && Array.isArray(j.items)) return j.items
      } catch {}
    }
  }
  return []
}

const toArr = (x: any): string[] => {
  if (Array.isArray(x)) return x.map(String)
  if (typeof x === 'string') return x.split(/[;,/]/).map(s => s.trim()).filter(Boolean)
  return []
}

const norm = (s: string) => (s ? s.trim() : '')
const cap = (s: string) => (s ? s.slice(0,1).toUpperCase() + s.slice(1) : '')

const buildTagsFromFeed = (r: any): string[] => {
  const diet = toArr(r.diet_tags)
  const cuisine = toArr(r.cuisine)
  const course = toArr(r.course)
  // jeśli w przyszłości pojawi się cokolwiek w powyższych polach — trafi do tagów
  const raw = [...diet, ...cuisine, ...course]
  return Array.from(new Set(raw.map(cap).filter(Boolean)))
}

const mapIngredients = (arr: any[]): Ingredient[] => {
  if (!Array.isArray(arr)) return []
  return arr
    .sort((a,b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map(i => ({
      name: norm(String(i?.name ?? '')),
      quantity: typeof i?.quantity === 'number' || typeof i?.quantity === 'string' ? i.quantity : null,
      unit: i?.unit ? String(i.unit) : null,
    }))
    .filter(i => i.name)
}

const mapSteps = (steps: any[]): string[] => {
  if (!Array.isArray(steps)) return []
  return steps
    .sort((a,b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map(s => {
      if (typeof s === 'string') return s.trim()
      const t = s?.instruction ?? s?.text ?? s?.content ?? ''
      return String(t).trim()
    })
    .filter(Boolean)
}

const normalizeRecipe = (r: any): Recipe => {
  const mediaUrl =
    r?.media?.url ||
    r?.image ||
    null

  return {
    id: String(r.id),
    title: String(r.title || '').trim(),
    ingredients: mapIngredients(r.ingredients),
    instructions: mapSteps(r.steps),
    image: mediaUrl,
    tags: buildTagsFromFeed(r),           // może być pusta tablica – wtedy front nie powinien pokazywać panelu „Tagi”
    pre_info: r.read_before ?? null,
    pro_tip: r.protip ?? r.fun_fact ?? null,
    nutrition: r.nutrition ?? null,
    nutrition100: r.nutrition100 ?? null,
    cuisine: r.cuisine ?? null,
    course: r.course ?? null,
    category: r.category ?? null,
    meal_type: r.meal_type ?? null,
  }
}

const filterByQuery = (items: Recipe[], q: NextApiRequest['query']) => {
  let out = items

  const ingredients = typeof q.ingredients === 'string'
    ? q.ingredients.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    : []

  if (ingredients.length) {
    out = out.filter(rec => {
      const names = (rec.ingredients || []).map(i => (i.name || '').toLowerCase())
      return ingredients.every(needle => names.some(n => n.includes(needle)))
    })
  }

  const tag = typeof q.tag === 'string' ? q.tag.trim().toLowerCase() : ''
  if (tag) {
    out = out.filter(rec => (rec.tags || []).map(t => t.toLowerCase()).includes(tag))
  }

  return out
}

// ---------- handler ----------
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const raw = loadRaw()
    let items: Recipe[] = raw.map(normalizeRecipe)

    const id = typeof req.query.id === 'string' ? req.query.id : ''
    if (id) {
      const item = items.find(r => r.id === id) || null
      res.status(200).json({ item })
      return
    }

    items = filterByQuery(items, req.query)
    res.status(200).json({ items })
  } catch {
    res.status(500).json({ error: 'Failed to load recipes' })
  }
}
