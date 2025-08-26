// pages/api/recipes.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

type Ingredient = { name: string; quantity?: string | number | null; unit?: string | null }
type Macros = { kcal?: number; carbs?: number; protein?: number; fat?: number } | null | undefined
type NutritionArrayItem = { basis?: 'per_serving' | string; calories_kcal?: number; carbs_g?: number; protein_g?: number; fat_g?: number }
type Nutrition = NutritionArrayItem[] | { kcal?: number; calories_kcal?: number; carbs?: number; protein?: number; fat?: number } | null | undefined

interface RecipeIn {
  id?: string
  slug?: string
  title?: string
  name?: string

  ingredients?: Ingredient[] | string[]
  ingredient_list?: Ingredient[] | string[]
  image?: string | null

  // tagi i alternatywy
  tags?: string[] | string | null
  tag?: string[] | string | null
  labels?: string[] | string | null
  categories?: string[] | string | null
  category_name?: string[] | string | null
  cuisine?: string | string[] | null
  course?: string | string[] | null
  category?: string | string[] | null
  meal_type?: string | string[] | null

  // panele i instrukcje – aliasy
  pre_info?: string | null
  preinfo?: string | null
  co_wiedziec?: string | null
  notes_before?: string | null
  about?: string | null
  description_short?: string | null

  pro_tip?: string | null
  tips?: string | string[] | null
  uwagi?: string | string[] | null
  note?: string | null
  extra_tips?: string | null

  instructions?: string[] | string | null
  instruction?: string[] | string | null
  steps?: string[] | string | null
  steps_text?: string | null
  directions?: string[] | string | null
  przygotowanie?: string[] | string | null
  opis_przygotowania?: string | null
  method?: string[] | string | null
  howto?: string[] | string | null

  nutrition?: Nutrition
  nutrition100?: Macros
}

interface RecipeOut {
  id: string
  title: string
  ingredients: Ingredient[]
  image?: string | null
  // filtrowanie/wyświetlanie
  tags?: string[] | null
  cuisine?: string | string[] | null
  course?: string | string[] | null
  category?: string | string[] | null
  meal_type?: string | string[] | null
  // panele + instrukcje
  pre_info?: string | null
  pro_tip?: string | null
  instructions?: string[] | null
  // makra
  nutrition?: Nutrition
  nutrition100?: Macros
}

function toArr(x: any): string[] {
  if (!x) return []
  if (Array.isArray(x)) return x.flat().map(String)
  return String(x).split(/[;,/]/).map(s => s.trim()).filter(Boolean)
}
function toText(x: any): string | null {
  if (!x) return null
  if (Array.isArray(x)) return x.map(String).join('\n').trim() || null
  const s = String(x).trim()
  return s || null
}
function normalizeIngredients(src?: Ingredient[] | string[]): Ingredient[] {
  if (!src) return []
  return src.map((row: any) => {
    if (typeof row === 'string') return { name: row }
    const { name, quantity, unit } = row || {}
    return { name: String(name || '').trim(), quantity: quantity ?? null, unit: unit ?? null }
  }).filter(i => i.name)
}
function normalizeInstructions(x: any): string[] | null {
  const text = toText(x)
  if (!text) return null
  // spróbuj po newline
  let parts = text.split(/\r?\n+/).map(s => s.trim()).filter(Boolean)
  // jeżeli wygląda jak jeden akapit z numeracją "1. ", tnij po numerach
  if (parts.length <= 1) {
    parts = text.split(/\s*(?:^|\n|\r)\s*(?=\d+\.)/g).map(s => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)
  }
  return parts.length ? parts : null
}
function mergeInstructions(r: RecipeIn): string[] | null {
  // preferencje: tablice > stringi; bierz pierwsze niepuste
  const candidates: any[] = [
    r.instructions, r.instruction, r.steps, r.directions, r.howto, r.method,
    r.przygotowanie, r.opis_przygotowania, r.steps_text
  ]
  for (const c of candidates) {
    if (!c) continue
    if (Array.isArray(c)) {
      const arr = c.map((s: any) => String(s).trim()).filter(Boolean)
      if (arr.length) return arr
    } else {
      const arr = normalizeInstructions(c)
      if (arr?.length) return arr
    }
  }
  return null
}
function mergePreInfo(r: RecipeIn): string | null {
  return toText(r.pre_info || r.preinfo || r.co_wiedziec || r.notes_before || r.about || r.description_short)
}
function mergeProTip(r: RecipeIn): string | null {
  const txt = toText(r.pro_tip || r.note || r.extra_tips)
  const list = toArr(r.tips).concat(toArr(r.uwagi))
  const merged = [txt, list.length ? '• ' + list.join('\n• ') : ''].filter(Boolean).join('\n')
  return merged || null
}
function mergeTags(r: RecipeIn): string[] | null {
  const raw = [
    ...toArr(r.tags),
    ...toArr(r.tag),
    ...toArr(r.labels),
    ...toArr(r.categories),
    ...toArr(r.category_name),
    ...toArr(r.cuisine),
    ...toArr(r.course),
    ...toArr(r.category),
    ...toArr(r.meal_type),
  ]
  const cleaned = Array.from(new Set(raw.map((s) => {
    const t = s.trim()
    return t ? t.slice(0,1).toUpperCase() + t.slice(1) : ''
  }).filter(Boolean)))
  return cleaned.length ? cleaned : null
}
function normalizeRecipe(r: RecipeIn): RecipeOut | null {
  const id = (r.id || r.slug || r.name || r.title)?.toString().trim()
  const title = (r.title || r.name || id)?.toString().trim()
  if (!id || !title) return null

  const ingredients =
    r.ingredients && (r.ingredients as any[]).length
      ? normalizeIngredients(r.ingredients as any)
      : normalizeIngredients(r.ingredient_list as any)

  const out: RecipeOut = {
    id, title, ingredients,
    image: r.image ?? null,
    // pola do filtrów
    tags: mergeTags(r),
    cuisine: r.cuisine ?? null,
    course: r.course ?? null,
    category: r.category ?? null,
    meal_type: r.meal_type ?? null,
    // panele i instrukcje
    pre_info: mergePreInfo(r),
    pro_tip: mergeProTip(r),
    instructions: mergeInstructions(r),
    // makra
    nutrition: r.nutrition ?? null,
    nutrition100: r.nutrition100 ?? null,
  }
  return out
}

function safeRead(filePath: string): string | null {
  try { return fs.readFileSync(filePath, 'utf8') } catch { return null }
}
function loadData(): RecipeOut[] {
  const roots = [path.join(process.cwd(), 'public'), path.join(process.cwd(), 'data'), process.cwd()]

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
          const n = normalizeRecipe(obj)
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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const all = loadData()
  if (!all.length) return res.status(200).json({ items: [], total: 0 })

  const { id, sort, ing } = req.query as { id?: string; sort?: string; ing?: string }

  // GET /api/recipes?id=...
  if (id) {
    const item = all.find(r => r.id === id)
    if (!item) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json({ item })
  }

  // list + prosta filtracja po składnikach (?ing=a,b)
  let items = all
  const ingTokens = (ing ? String(ing) : '')
    .split(',')
    .map(s=>s.trim().toLowerCase())
    .filter(Boolean)
  if (ingTokens.length) {
    items = items.filter(r => {
      const names = r.ingredients.map(i => (i.name||'').toLowerCase())
      return ingTokens.every(tok => names.some(n => n.includes(tok)))
    })
  }

  items = applySort(items, sort)
  res.status(200).json({ items, total: items.length })
}
