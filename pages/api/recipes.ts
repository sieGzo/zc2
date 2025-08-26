import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

type Ingredient = {
  group?: string | null
  name: string
  quantity?: number | string | null
  unit?: string | null
}

export type Recipe = {
  id: string
  title: string
  ingredients: Ingredient[]
  instructions?: string | string[] | null
  nutrition?: { kcal?: number; carbs?: number; protein?: number; fat?: number } | null
  cuisine?: string | null
  prep_time?: string | number | null
  tags?: string[]
  image?: string | null
}

function norm(s?: string) {
  return (s || '').toLowerCase()
}

// ===== heurystyki tagów =====
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
function normalizeNutrition(n?: Record<string, any> | null) {
  if (!n) return null
  const pick = (keys: string[]) => {
    for (const k of keys) {
      const v = n[k] ?? n[k.toLowerCase()] ?? n[k.toUpperCase()]
      if (v !== undefined && v !== null && v !== '') return Number(v)
    }
    return undefined
  }
  return {
    kcal: pick(['kcal','calories','energia']),
    carbs: pick(['carbs','w','węglowodany']),
    protein: pick(['protein','b','białko']),
    fat: pick(['fat','t','tłuszcz']),
  }
}

// ===== obrazki =====
function extractImage(obj: any): string | null {
  const cands = [
    obj.image, obj.img, obj.photo, obj.image_url, obj.imageUrl, obj.picture,
    Array.isArray(obj.photos) ? obj.photos[0] : undefined,
  ]
  for (const c of cands) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return null
}

// ===== cache danych =====
let CACHE: { items: Recipe[]; facets: { tags: Record<string, number>; ingredients: Record<string, number> } } | null = null

function parseJSONL(filePath: string): Recipe[] {
  const raw = fs.readFileSync(filePath, 'utf8')
  return raw.split(/\n+/).filter(Boolean).map((line, idx) => {
    const obj = JSON.parse(line)
    const rec: Recipe = {
      id: obj.id?.toString() ?? String(idx),
      title: obj.title,
      ingredients: Array.isArray(obj.ingredients) ? obj.ingredients : [],
      instructions: obj.instructions ?? obj.steps ?? null,
      nutrition: normalizeNutrition(obj.nutrition ?? null),
      cuisine: obj.cuisine ?? null,
      prep_time: obj.prep_time ?? obj.total_time ?? null,
      tags: obj.tags ?? [],
      image: extractImage(obj),
    }
    rec.tags = Array.from(new Set([...(rec.tags ?? []), ...autoTags(rec.title, rec.ingredients)]))
    return rec
  })
}

function loadData() {
  if (CACHE) return CACHE
  const filePath = fs.existsSync(path.join(process.cwd(), 'data/jemfit_recipes.jsonl'))
    ? path.join(process.cwd(), 'data/jemfit_recipes.jsonl')
    : '/mnt/data/jemfit_recipes.jsonl'
  const items = parseJSONL(filePath)
  const facets = { tags: {}, ingredients: {} as Record<string, number> }
  for (const r of items) {
    for (const t of r.tags ?? []) facets.tags[t] = (facets.tags[t] || 0) + 1
    for (const i of r.ingredients) {
      const n = norm(i.name).trim()
      if (n) facets.ingredients[n] = (facets.ingredients[n] || 0) + 1
    }
  }
  CACHE = { items, facets }
  return CACHE
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { items, facets } = loadData()

  // pojedynczy przepis
  if (req.query.id) {
    const one = items.find(r => r.id === req.query.id)
    if (!one) return res.status(404).json({ error: 'not found' })
    return res.json({ item: one })
  }

  // lista
  return res.json({
    items,
    facets: {
      tags: Object.entries(facets.tags),
      ingredients: Object.entries(facets.ingredients),
    },
    total: items.length,
  })
}
