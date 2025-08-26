// pages/api/recipes.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

type Ingredient = { name: string; quantity?: string | number | null; unit?: string | null }
type NutritionArrayItem = { basis: 'per_serving'; calories_kcal?: number }
type Nutrition = NutritionArrayItem[] | { kcal?: number; calories_kcal?: number } | null | undefined

interface RecipeIn {
  id?: string
  slug?: string
  title?: string
  name?: string
  ingredients?: Ingredient[]
  ingredient_list?: Ingredient[] | string[]
  image?: string | null
  tags?: string[] | string | null
  cuisine?: string | string[] | null
  course?: string | string[] | null
  category?: string | string[] | null
  meal_type?: string | string[] | null
  pre_info?: string | null
  pro_tip?: string | null
  nutrition?: Nutrition
  nutrition100?: { kcal?: number; carbs?: number; protein?: number; fat?: number } | null
}

interface RecipeOut {
  id: string
  title: string
  ingredients: Ingredient[]
  image?: string | null
  tags?: string[] | null
  cuisine?: string | string[] | null
  course?: string | string[] | null
  category?: string | string[] | null
  meal_type?: string | string[] | null
  pre_info?: string | null
  pro_tip?: string | null
  nutrition?: Nutrition
  nutrition100?: { kcal?: number; carbs?: number; protein?: number; fat?: number } | null
}

function toArray(x: any): string[] {
  if (!x) return []
  if (Array.isArray(x)) return x.map(String)
  return String(x).split(/[;,/]/).map((s) => s.trim()).filter(Boolean)
}

function normalizeIngredients(src?: Ingredient[] | string[]): Ingredient[] {
  if (!src) return []
  return src.map((row: any) => {
    if (typeof row === 'string') return { name: row }
    const { name, quantity, unit } = row || {}
    return { name: String(name || '').trim(), quantity: quantity ?? null, unit: unit ?? null }
  }).filter(i => i.name)
}

function normalizeRecipe(r: RecipeIn, idx: number): RecipeOut | null {
  const id = (r.id || r.slug || r.name || r.title)?.toString().trim()
  const title = (r.title || r.name || id)?.toString().trim()
  if (!id || !title) return null

  const ingredients =
    r.ingredients && r.ingredients.length
      ? normalizeIngredients(r.ingredients as any)
      : normalizeIngredients(r.ingredient_list as any)

  const tagsArr = toArray(r.tags || [])
  return {
    id,
    title,
    ingredients,
    image: r.image ?? null,
    tags: tagsArr.length ? tagsArr : null,
    cuisine: r.cuisine ?? null,
    course: r.course ?? null,
    category: r.category ?? null,
    meal_type: r.meal_type ?? null,
    pre_info: r.pre_info ?? null,
    pro_tip: r.pro_tip ?? null,
    nutrition: r.nutrition ?? null,
    nutrition100: r.nutrition100 ?? null,
  }
}

function safeRead(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch {
    return null
  }
}

function loadData(): RecipeOut[] {
  const roots = [
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), 'data'),
    process.cwd(),
  ]

  // prefer JSON
  for (const root of roots) {
    const p = path.join(root, 'jemfit_recipes.json')
    const txt = safeRead(p)
    if (txt) {
      try {
        const arr = JSON.parse(txt) as RecipeIn[]
        return arr.map(normalizeRecipe).filter(Boolean) as RecipeOut[]
      } catch {}
    }
  }

  // fallback: JSONL
  for (const root of roots) {
    const p = path.join(root, 'jemfit_recipes.jsonl')
    const txt = safeRead(p)
    if (txt) {
      const out: RecipeOut[] = []
      for (const line of txt.split(/\r?\n/)) {
        const s = line.trim()
        if (!s) continue
        try {
          const obj = JSON.parse(s) as RecipeIn
          const n = normalizeRecipe(obj, out.length)
          if (n) out.push(n)
        } catch {}
      }
      return out
    }
  }

  return []
}

function applySort(items: RecipeOut[], sort?: string): RecipeOut[] {
  const s = sort || 'title_asc'
  const arr = [...items]
  if (s === 'title_asc') arr.sort((a,b)=>a.title.localeCompare(b.title,'pl'))
  else if (s === 'title_desc') arr.sort((a,b)=>b.title.localeCompare(a.title,'pl'))
  else if (s === 'ingredients_asc') arr.sort((a,b)=>a.ingredients.length - b.ingredients.length)
  else if (s === 'ingredients_desc') arr.sort((a,b)=>b.ingredients.length - a.ingredients.length)
  return arr
}

function matchAllTokens(haystack: string[], tokens: string[]): boolean {
  if (!tokens.length) return true
  const hs = haystack.map(s=>s.toLowerCase())
  return tokens.every(t => hs.some(h => h.includes(t)))
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const all = loadData()
  if (!all.length) {
    return res.status(200).json({ items: [], total: 0 })
  }

  const { id, sort, ing } = req.query as { id?: string; sort?: string; ing?: string }
  const ingTokens = (ing ? String(ing) : '')
    .split(',')
    .map(s=>s.trim().toLowerCase())
    .filter(Boolean)

  if (id) {
    const item = all.find(r => r.id === id)
    if (!item) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json({ item })
  }

  let items = all
  if (ingTokens.length) {
    items = items.filter(r => matchAllTokens(r.ingredients.map(i=>i.name||''), ingTokens))
  }
  items = applySort(items, sort)

  res.status(200).json({ items, total: items.length })
}
