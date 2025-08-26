import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

type Ingredient = {
  group?: string | null
  name: string
  quantity?: number | string | null
  unit?: string | null
}

type Macros = { kcal?: number; carbs?: number; protein?: number; fat?: number }

export type Recipe = {
  id: string
  title: string
  ingredients: Ingredient[]
  instructions?: string[] | null
  // ★ makra: per serving / per 100g
  nutrition?: Macros | null
  nutrition100?: Macros | null
  // ★ meta
  pre_info?: string | null
  pro_tip?: string | null
  cuisine?: string | null
  prep_time?: string | number | null
  tags?: string[]
  image?: string | null
}

const norm = (s?: string) => (s || '').toLowerCase()

// ===== lokalna mapa obrazków (z /public/recipes_images.json) =====
let IMAGE_MAP: Record<string, string> = {}
try {
  const p = path.join(process.cwd(), 'public', 'recipes_images.json')
  if (fs.existsSync(p)) IMAGE_MAP = JSON.parse(fs.readFileSync(p, 'utf8'))
} catch {}

// ===== tagi (lekko) =====
const MEAT = ['kurczak','wołowina','wieprzowina','indyk','łosoś','tuńczyk','ryba']
const DAIRY = ['mleko','jogurt','śmietana','masło','ser','twaro']
const GLUTEN = ['mąka','pszen','makaron','pieczywo']
const DESSERT = ['ciasto','sernik','deser','lody','muffin','brownie']
const SOUP = ['zupa','krem','rosół','barszcz']
const SALAD = ['sałatka','surówka']

function autoTags(title: string, ingredients: Ingredient[]): string[] {
  const t = norm(title)
  const ing = ingredients.map(i => norm(i.name))
  const tags = new Set<string>()
  if (SOUP.some(w => t.includes(w))) tags.add('zupa')
  if (SALAD.some(w => t.includes(w))) tags.add('sałatka')
  if (DESSERT.some(w => t.includes(w))) tags.add('deser')
  const hasMeat = ing.some(n => MEAT.some(m => n.includes(m)))
  const hasDairy = ing.some(n => DAIRY.some(d => n.includes(d)))
  const hasGluten = ing.some(n => GLUTEN.some(g => n.includes(g)))
  if (!hasMeat && !hasDairy) tags.add('wegańskie')
  else if (!hasMeat) tags.add('wegetariańskie')
  if (!hasGluten) tags.add('bezglutenowe')
  if (!hasDairy) tags.add('beznabiałowe')
  return Array.from(tags)
}

// ===== makra =====
function pickNum(n: any, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = n?.[k] ?? n?.[k.toLowerCase()] ?? n?.[k.toUpperCase()]
    if (v !== undefined && v !== null && v !== '') return Number(v)
  }
  return undefined
}
function normMacros(n?: Record<string, any> | null): Macros | null {
  if (!n) return null
  return {
    kcal: pickNum(n, ['kcal','calories','energia','energy_kcal']),
    carbs: pickNum(n, ['carbs','w','węglowodany','weglowodany','carbohydrates']),
    protein: pickNum(n, ['protein','b','białko','bialko']),
    fat: pickNum(n, ['fat','t','tłuszcz','tluszcz']),
  }
}
// spróbuj znaleźć strukturę makr dla 100 g i dla porcji
function extractMacros(obj: any) {
  // per portion / serving
  const perServ = obj.nutrition_per_serving ?? obj.per_serving ?? obj.na_porcje ?? obj['na_porcję'] ?? obj.nutrition ?? null
  // per 100g
  const per100 = obj.nutrition_per_100g ?? obj.per100g ?? obj.per_100g ?? obj['na_100g'] ?? obj['per_100_g'] ?? null
  return { nutrition: normMacros(perServ), nutrition100: normMacros(per100) }
}

// ===== obrazek =====
function extractImage(obj: any): string | null {
  const cands = [
    obj.image, obj.img, obj.photo, obj.image_url, obj.imageUrl, obj.picture,
    Array.isArray(obj.photos) ? obj.photos[0] : undefined,
  ]
  for (const c of cands) if (typeof c === 'string' && c.trim()) return c.trim()
  return null
}

// ===== instrukcje => string[] =====
function normalizeInstructions(obj: any): string[] | null {
  const candidates = [obj.instructions, obj.steps, obj.directions, obj.opis]
  let src: any = candidates.find(Boolean)
  if (!src) return null
  if (typeof src === 'string') return [src]
  if (Array.isArray(src)) {
    return src.map((item) => {
      if (!item) return null
      if (typeof item === 'string') return item
      if (typeof item === 'object') return item.instruction ?? item.text ?? item.step ?? item.content ?? item.description ?? null
      return String(item)
    }).filter(Boolean) as string[]
  }
  if (typeof src === 'object') {
    const s = src.instruction ?? src.text ?? src.content ?? src.description
    return s ? [s] : null
  }
  return null
}

// ===== meta: co wiedzieć + pro tip =====
function extractPreInfo(obj: any): string | null {
  return obj.pre_info ?? obj.co_wiedziec ?? obj['co_wiedzieć'] ?? obj.know_before ?? obj.notes ?? obj.uwagi ?? null
}
function extractProTip(obj: any): string | null {
  return obj.pro_tip ?? obj.protip ?? obj.tip ?? obj.wskazowka ?? obj['wskazówka'] ?? obj.porada ?? null
}

// ===== cache =====
let CACHE: { items: Recipe[] } | null = null

function parseJSONL(filePath: string): Recipe[] {
  const raw = fs.readFileSync(filePath, 'utf8')
  const lines = raw.split(/\n+/).filter(Boolean)
  const items: Recipe[] = []
  lines.forEach((line, idx) => {
    const obj = JSON.parse(line)
    const id = obj.id?.toString() ?? String(idx)
    const { nutrition, nutrition100 } = extractMacros(obj)
    const rec: Recipe = {
      id,
      title: obj.title,
      ingredients: Array.isArray(obj.ingredients) ? obj.ingredients : [],
      instructions: normalizeInstructions(obj),
      nutrition,
      nutrition100,
      pre_info: extractPreInfo(obj),
      pro_tip: extractProTip(obj),
      cuisine: obj.cuisine ?? null,
      prep_time: obj.prep_time ?? obj.total_time ?? null,
      tags: Array.isArray(obj.tags) ? obj.tags : [],
      image: IMAGE_MAP[id] ?? extractImage(obj),
    }
    rec.tags = Array.from(new Set([...(rec.tags ?? []), ...autoTags(rec.title, rec.ingredients)]))
    items.push(rec)
  })
  return items
}

function loadData() {
  if (CACHE) return CACHE
  const filePath = fs.existsSync(path.join(process.cwd(), 'data/jemfit_recipes.jsonl'))
    ? path.join(process.cwd(), 'data/jemfit_recipes.jsonl')
    : '/mnt/data/jemfit_recipes.jsonl'
  CACHE = { items: parseJSONL(filePath) }
  return CACHE
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { items } = loadData()

  if (req.query.id) {
    const one = items.find(r => r.id === String(req.query.id))
    if (!one) return res.status(404).json({ error: 'not found' })
    return res.json({ item: one })
  }

  // sortowanie
  const sort = String(req.query.sort || 'title_asc')
  let sorted = [...items]
  switch (sort) {
    case 'title_asc': sorted.sort((a,b)=>a.title.localeCompare(b.title,'pl')); break
    case 'title_desc': sorted.sort((a,b)=>b.title.localeCompare(a.title,'pl')); break
    case 'ingredients_asc': sorted.sort((a,b)=>a.ingredients.length-b.ingredients.length); break
    case 'ingredients_desc': sorted.sort((a,b)=>b.ingredients.length-a.ingredients.length); break
  }

  res.json({ items: sorted, total: sorted.length })
}
