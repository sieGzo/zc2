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
  instructions?: string[] | string | any[] | null
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

// ---------- Helpers ----------

const tryRead = (p: string): string | null => {
  try {
    return fs.readFileSync(p, 'utf8')
  } catch {
    return null
  }
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
    const data = tryRead(file)
    if (!data) continue

    if (file.endsWith('.jsonl')) {
      // JSONL: jedna linia = jeden JSON
      return data
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => {
          try { return JSON.parse(l) } catch { return null }
        })
        .filter(Boolean) as any[]
    }

    if (file.endsWith('.json')) {
      try {
        const parsed = JSON.parse(data)
        if (Array.isArray(parsed)) return parsed
        if (parsed && Array.isArray(parsed.items)) return parsed.items
        return []
      } catch {
        return []
      }
    }
  }

  return []
}

const toArr = (x: any): string[] => {
  if (Array.isArray(x)) return x.map(String)
  if (typeof x === 'string') return x.split(/[;,/]/).map((s) => s.trim()).filter(Boolean)
  return []
}

const normTag = (s: string) => (s ? s.slice(0, 1).toUpperCase() + s.slice(1) : '')

const buildTags = (r: any): string[] => {
  const raw = [
    ...(r.tags ?? []),
    ...toArr(r.tag),
    ...toArr(r.cuisine),
    ...toArr(r.course),
    ...toArr(r.category),
    ...toArr(r.categories),
    ...toArr(r.category_name),
    ...toArr(r.meal_type),
    ...toArr(r.labels),
  ]
  return Array.from(new Set(raw.map(normTag).filter(Boolean)))
}

const normalizeInstructions = (instr: any): string[] => {
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

const normalizeNutritionPerServing = (nutrition: Nutrition): Macros => {
  if (!nutrition) return null
  if (Array.isArray(nutrition)) {
    const n = nutrition.find(x => x?.basis === 'per_serving') || nutrition[0]
    if (!n) return null
    return { kcal: n.calories_kcal, carbs: n.carbs_g, protein: n.protein_g, fat: n.fat_g }
  }
  const o = nutrition as { kcal?: number; calories_kcal?: number; carbs?: number; protein?: number; fat?: number }
  return { kcal: typeof o.kcal === 'number' ? o.kcal : o.calories_kcal, carbs: o.carbs, protein: o.protein, fat: o.fat }
}

const normalizeRecipe = (r: any): Recipe => {
  return {
    ...r,
    instructions: normalizeInstructions(r.instructions),
    tags: buildTags(r),
    // per-serving w obiekcie `nutrition` zostawiamy w oryginale — UI ma własny helper,
    // ale jeśli chcesz, można też dodać pole `nutrition_per_serving` tutaj.
  }
}

// proste filtry po query (?ingredients=..., ?tag=...)
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
    out = out.filter(rec => (buildTags(rec).map(t => t.toLowerCase()).includes(tag)))
  }

  return out
}

// ---------- Handler ----------

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const raw = loadRaw()
    let items: Recipe[] = raw.map(normalizeRecipe)

    // pojedynczy przepis
    const id = typeof req.query.id === 'string' ? req.query.id : ''
    if (id) {
      const item = items.find(r => r.id === id) || null
      res.status(200).json({ item })
      return
    }

    // opcjonalne filtry
    items = filterByQuery(items, req.query)

    res.status(200).json({ items })
  } catch (e) {
    res.status(500).json({ error: 'Failed to load recipes' })
  }
}
