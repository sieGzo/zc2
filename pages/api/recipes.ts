// /pages/api/recipes.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

// ---------- Types ----------
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

// ---------- Heurystyki tagów ----------
const MEAT = ['kurczak','wołowina','wieprzowina','indyk','karkówka','boczek','szynka','kiełbasa','łosoś','tuńczyk','ryba']
const DAIRY = ['mleko','jogurt','śmietana','masło','ser','twaro','maślanka']
const GLUTEN = ['mąka pszenna','pszen','bułka','makaron','kuskus','jęczmień','słód','pieczywo']
const BREAKFAST = ['owsian','jajeczn','omlet','naleśnik','granola','tost']
const DESSERT = ['ciasto','sernik','deser','lody','muffin','brownie','kruszonka','mus']
const SOUP = ['zupa','krem','rosół','barszcz','krupnik','chłodnik']
const SALAD = ['sałatka','coleslaw','surówka']
const SAUCE = ['sos','ketchup','majonez','dressing','pesto']

function autoTags(title: string, ingredients: Ingredient[]): string[] {
  const t = norm(title)
  const ing = ingredients.map(i => norm(i.name))
  const tags = new Set<string>()

  if (SOUP.some(w => t.includes(w))) tags.add('zupa')
  if (SALAD.some(w => t.includes(w))) tags.add('sałatka')
  if (DESSERT.some(w => t.includes(w))) tags.add('deser')
  if (BREAKFAST.some(w => t.includes(w))) tags.add('śniadanie')
  if (SAUCE.some(w => t.includes(w))) tags.add('sos')

  const hasMeat = ing.some(n => MEAT.some(m => n.includes(m)))
  const hasDairy = ing.some(n => DAIRY.some(d => n.includes(d)))
  const hasGluten = ing.some(n => GLUTEN.some(g => n.includes(g)))
  if (!hasMeat && !hasDairy) tags.add('wegańskie')
  else if (!hasMeat) tags.add('wegetariańskie')
  if (!hasGluten) tags.add('bezglutenowe')
  if (!hasDairy) tags.add('beznabiałowe')

  if (ing.some(n => n.includes('ryż'))) tags.add('z ryżem')
  if (ing.some(n => n.includes('makaron'))) tags.add('z makaronem')
  if (ing.some(n => n.includes('kukurydza'))) tags.add('kukurydza')
  if (ing.some(n => n.includes('pomidor'))) tags.add('pomidorowe')

  return Array.from(tags)
}

// ---------- Normalizacja żywieniowa ----------
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
    kcal: pick(['kcal','calories','energy_kcal','energia','kalorie']),
    carbs: pick(['carbs','w','weglowodany','węglowodany','carbohydrates']),
    protein: pick(['protein','b','bialko','białko']),
    fat: pick(['fat','t','tluszcz','tłuszcz']),
  }
}

// ---------- Wykrycie pola obrazu ----------
function extractImage(obj: any): string | null {
  const candidates = [
    obj.image, obj.img, obj.photo, obj.image_url, obj.imageUrl, obj.picture,
    Array.isArray(obj.photos) ? obj.photos[0] : undefined,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return null
}

// ---------- Wczytanie danych ----------
let CACHE:
  | { items: Recipe[]; lastLoaded: number; facets: { tags: Record<string, number>; ingredients: Record<string, number> } }
  | null = null

function parseJSONL(filePath: string): Recipe[] {
  const raw = fs.readFileSync(filePath, 'utf8')
  const lines = raw.split(/\n+/).filter(Boolean)
  const items: Recipe[] = []

  lines.forEach((line, idx) => {
    try {
      const obj = JSON.parse(line)

      const rec: Recipe = {
        id: obj.id?.toString() ?? String(idx),
        title: obj.title,
        ingredients: Array.isArray(obj.ingredients) ? obj.ingredients : [],
        instructions: obj.instructions ?? obj.steps ?? obj.directions ?? obj.opis ?? null,
        nutrition: normalizeNutrition(obj.nutrition ?? null),
        cuisine: obj.cuisine ?? null,
        prep_time: obj.prep_time ?? obj.total_time ?? obj.totalTime ?? null,
        tags: Array.isArray(obj.tags) ? obj.tags : undefined,
        image: extractImage(obj),
      }

      // auto-tagi (dopisz do istniejących)
      const auto = autoTags(rec.title, rec.ingredients)
      rec.tags = Array.from(new Set([...(rec.tags ?? []), ...auto]))

      items.push(rec)
    } catch {
      /* pomiń wadliwą linię */
    }
  })
  return items
}

function buildFacets(items: Recipe[]) {
  const tags: Record<string, number> = {}
  const ingredients: Record<string, number> = {}
  for (const r of items) {
    for (const t of r.tags ?? []) tags[t] = (tags[t] || 0) + 1
    for (const ing of r.ingredients) {
      const name = norm(ing.name).trim()
      if (!name) continue
      ingredients[name] = (ingredients[name] || 0) + 1
    }
  }
  return { tags, ingredients }
}

function loadData() {
  if (CACHE) return CACHE
  const projectPath = path.join(process.cwd(), 'data', 'jemfit_recipes.jsonl')
  const fallback = '/mnt/data/jemfit_recipes.jsonl'
  const filePath = fs.existsSync(projectPath) ? projectPath : fallback
  const items = parseJSONL(filePath)
  const facets = buildFacets(items)
  CACHE = { items, lastLoaded: Date.now(), facets }
  return CACHE
}

// ---------- Filtr i sort ----------
function filterAndSort(
  items: Recipe[],
  q: string | undefined,
  includeTags: string[],
  includeIngs: string[],
  excludeTags: string[],
  excludeIngs: string[],
  sort: string
) {
  let out = items
  const Q = norm(q || '')
  if (Q) {
    out = out.filter(r => norm(r.title).includes(Q) || r.ingredients.some(i => norm(i.name).includes(Q)))
  }
  if (includeTags.length) out = out.filter(r => includeTags.every(t => r.tags?.includes(t)))
  if (excludeTags.length) out = out.filter(r => !r.tags?.some(t => excludeTags.includes(t)))
  if (includeIngs.length) out = out.filter(r => includeIngs.every(ing => r.ingredients.some(i => norm(i.name) === norm(ing))))
  if (excludeIngs.length) out = out.filter(r => !r.ingredients.some(i => excludeIngs.includes(norm(i.name))))

  switch (sort) {
    case 'title_asc': out = out.slice().sort((a,b)=>a.title.localeCompare(b.title,'pl')); break
    case 'title_desc': out = out.slice().sort((a,b)=>b.title.localeCompare(a.title,'pl')); break
    case 'ingredients_asc': out = out.slice().sort((a,b)=>a.ingredients.length - b.ingredients.length); break
    case 'ingredients_desc': out = out.slice().sort((a,b)=>b.ingredients.length - a.ingredients.length); break
  }

  return out
}

// ---------- Handler ----------
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { items, facets } = loadData()

  // tryb pojedynczego przepisu
  const id = (req.query.id as string) || ''
  if (id) {
    const one = items.find(r => r.id === id)
    if (!one) return res.status(404).json({ error: 'not_found' })
    return res.status(200).json({ item: one })
  }

  // lista
  const q = (req.query.q as string) || ''
  const includeTags = ([] as string[]).concat(req.query.tag || []).flatMap(v => typeof v === 'string' ? v.split(',').filter(Boolean) : [])
  const excludeTags = ([] as string[]).concat(req.query.notag || []).flatMap(v => typeof v === 'string' ? v.split(',').filter(Boolean) : [])
  const includeIngs = ([] as string[]).concat(req.query.ing || []).flatMap(v => typeof v === 'string' ? v.split(',').filter(Boolean) : [])
  const excludeIngs = ([] as string[]).concat(req.query.noing || []).flatMap(v => typeof v === 'string' ? v.split(',').filter(Boolean) : [])
  const sort = (req.query.sort as string) || 'title_asc'

  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10))
  const pageSize = Math.min(50, Math.max(5, parseInt((req.query.pageSize as string) || '24', 10)))

  const filtered = filterAndSort(items, q, includeTags, includeIngs, excludeTags, excludeIngs, sort)
  const total = filtered.length
  const start = (page - 1) * pageSize
  const pageItems = filtered.slice(start, start + pageSize)

  res.status(200).json({
    items: pageItems,
    total,
    page,
    pageSize,
    facets: {
      tags: Object.entries(facets.tags).sort((a,b)=>b[1]-a[1]).slice(0, 50),
      ingredients: Object.entries(facets.ingredients).sort((a,b)=>b[1]-a[1]).slice(0, 100),
    }
  })
}
