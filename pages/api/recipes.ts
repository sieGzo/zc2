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
const cap = (s: string) => (s ? s.slice(0,1).toUpperCase() + s.slice(1) : '')

// ---------- diet inference ----------
const hasAny = (nameList: string[], needles: string[]) =>
  needles.some(n => nameList.some(x => x.includes(n)))

const inferDietTags = (r: any): string[] => {
  const names = Array.isArray(r.ingredients)
    ? r.ingredients.map((i: any) => String(i?.name || '').toLowerCase())
    : []

  const glutenWords = ['mąka pszen','pszen','jęczmie','żyto','orkisz','kasza manna','bułka tarta','panierka','makaron','pierogi','ciasto francuskie']
  const mentionsGluten = hasAny(names, glutenWords)
  const mentionsOats = hasAny(names, ['owies','płatki ows'])
  const hasOatsGF = hasAny(names, ['bezglutenowy owies','płatki owsiane bezglutenowe'])

  const dairyWords = ['mleko','jogurt','skyr','ser','masło','śmiet','kefir','maślanka','twaro','ricotta','mozarella','parmezan']
  const isDairyFree = !hasAny(names, dairyWords)

  const meatFishEggsHoney = ['kurczak','wołow','wieprz','indyk','szynka','boczek','tuńczyk','łosoś','ryba','jaj','białko jaj','miód','żelatyna']
  const hasAnimal = hasAny(names, meatFishEggsHoney)

  const tags: string[] = []
  const glutenFree = !mentionsGluten && (!mentionsOats || hasOatsGF)
  if (glutenFree) tags.push('Bez glutenu')

  const vegan = isDairyFree && !hasAnimal
  if (vegan) tags.push('Wegańskie')

  const vegetarian = !hasAny(names, ['kurczak','wołow','wieprz','indyk','tuńczyk','łosoś','ryba','szynka','boczek','żelatyna'])
  if (vegetarian && !vegan) tags.push('Wegetariańskie')

  if (isDairyFree && !vegan) tags.push('Bez nabiału')

  return tags
}

const buildTagsFromFeed = (r: any): string[] => {
  const toArr = (x: any): string[] =>
    Array.isArray(x) ? x.map(String) : (typeof x === 'string' ? x.split(/[;,/]/).map(s=>s.trim()).filter(Boolean) : [])

  const cap = (s: string) => (s ? s.slice(0,1).toUpperCase() + s.slice(1) : '')

  const fromFeed = [
    ...toArr(r.diet_tags),
    ...toArr(r.cuisine),
    ...toArr(r.course),
  ].map(cap).filter(Boolean)

  // --- tagi z tytułu (słówka-klucze) ---
  const title = String(r.title || '').toLowerCase()
  const titleMap: [string, string[]][] = [
    ['Ciasto',      ['ciasto','sernik','biszkopt','brownie','tort']],
    ['Ciasteczka',  ['ciastecz','ciastka','cookies']],
    ['Chlebek',     ['chlebek','banana bread','chleb']],
    ['Placuszki',   ['placusz','racuch']],
    ['Naleśniki',   ['naleśn','crepes']],
    ['Sałatka',     ['sałat','salat']],
    ['Makaron',     ['makaron','pasta']],
    ['Zupa',        ['zupa','krem z']],
    ['Śniadanie',   ['omlet','owsian','jajeczn','tost','skyr']],
    ['Deser',       ['deser','słodk','słodycz','bezy','beziki','meringue']]
  ]
  const fromTitle = titleMap
    .filter(([tag, keys]) => keys.some(k => title.includes(k)))
    .map(([tag]) => tag)

  return Array.from(new Set([...fromFeed, ...fromTitle]))
}

// ---------- mapping ----------
const mapIngredients = (arr: any[]): Ingredient[] => {
  const out: Ingredient[] = []
  if (!Array.isArray(arr)) return out

  // rekurencyjne rozwinięcie grup -> płaska lista
  const walk = (items: any[], ctx?: { spiceMode?: boolean }) => {
    for (const it of items) {
      const isGroup = Array.isArray(it?.items) || Array.isArray(it?.children)
      const groupTitle = String(it?.title || it?.group || '').toLowerCase()
      const spiceMode = ctx?.spiceMode || /przypraw/.test(groupTitle)

      if (isGroup) {
        walk((it.items || it.children) as any[], { spiceMode })
        continue
      }

      // zwykła pozycja
      let name = String(it?.name ?? '').trim()
      let quantity = (typeof it?.quantity === 'number' || typeof it?.quantity === 'string') ? it.quantity : null
      let unit = it?.unit ? String(it.unit) : null

      // jeżeli „przyprawy” i nazwa ma przecinki -> rozbijamy na osobne
      if (spiceMode && name.includes(',')) {
        for (const one of name.split(',').map((s: string) => s.trim()).filter(Boolean)) {
          out.push({ name: one, quantity: null, unit: null })
        }
        continue
      }

      // czasem autor wrzuca "przyprawy: sól, pieprz" w polu name
      const nameLower = name.toLowerCase()
      if (!quantity && !unit && /przypraw/.test(nameLower) && name.includes(',')) {
        const afterColon = name.split(':').slice(1).join(':') || name
        for (const one of afterColon.split(',').map(s=>s.trim()).filter(Boolean)) {
          out.push({ name: one, quantity: null, unit: null })
        }
        continue
      }

      if (name) out.push({ name, quantity, unit })
    }
  }

  walk(arr)
  return out
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
  const mediaUrl = r?.media?.url || r?.image || null
  return {
    id: String(r.id),
    title: String(r.title || '').trim(),
    ingredients: mapIngredients(r.ingredients),
    instructions: mapSteps(r.steps),
    image: mediaUrl,
    tags: buildTagsFromFeed(r),
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

    res.status(200).json({ items })
  } catch {
    res.status(500).json({ error: 'Failed to load recipes' })
  }
}
