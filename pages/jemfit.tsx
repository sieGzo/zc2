import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'

type Ingredient = { name: string; quantity?: string | number | null; unit?: string | null }

// --- Typy odżywki (obsługujemy 2 formaty) ---
type NutritionArrayItem = { basis: 'per_serving'; calories_kcal?: number }
type Nutrition = NutritionArrayItem[] | { kcal?: number; calories_kcal?: number } | null | undefined

interface Recipe {
  id: string
  title: string
  ingredients: Ingredient[]
  tags?: string[] | null
  image?: string | null
  nutrition?: Nutrition
  // możliwe alternatywne źródła tagów (często tak bywa w feedach)
  cuisine?: string | string[] | null
  course?: string | string[] | null
  category?: string | string[] | null
  meal_type?: string | string[] | null
}

interface ApiResponse { items: Recipe[]; total: number }

const BRAND_RED = '#A21F1A'
const BRAND_GREEN = '#125D49'
const BLUR_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='

// kcal helper
function getKcal(nutrition: Nutrition): number | undefined {
  if (!nutrition) return undefined
  if (Array.isArray(nutrition)) {
    return nutrition.find(n => n.basis === 'per_serving')?.calories_kcal
  }
  const n = nutrition as { kcal?: number; calories_kcal?: number }
  return typeof n.kcal === 'number' ? n.kcal : n.calories_kcal
}

// >>> Normalizacja tagów (działa nawet bez r.tags)
function toArr(x: unknown): string[] {
  if (Array.isArray(x)) return x.map(String)
  if (typeof x === 'string') return x.split(/[;,/]/).map(s=>s.trim()).filter(Boolean)
  return []
}
function normTag(s: string) {
  const t = s.trim()
  if (!t) return ''
  // kapitalizacja „ładna”, bez krzyku
  return t.slice(0,1).toUpperCase() + t.slice(1)
}
function getTags(r: Recipe): string[] {
  const raw = [
    ...(r.tags || []),
    ...toArr(r.cuisine),
    ...toArr(r.course),
    ...toArr(r.category),
    ...toArr(r.meal_type),
  ]
  const clean = Array.from(new Set(raw.map(normTag).filter(Boolean)))
  return clean
}

export default function JemfitList() {
  const [raw, setRaw] = useState<Recipe[]>([])
  const [sort, setSort] = useState<'title_asc'|'title_desc'|'ingredients_asc'|'ingredients_desc'>('title_asc')
  const [error, setError] = useState<string | null>(null)
  const [imgMap, setImgMap] = useState<Record<string, string>>({})

  // wyszukiwarka po składnikach (input -> AND)
  const [ingQuery, setIngQuery] = useState('')
  const ingTokensFromInput = useMemo(
    () => ingQuery.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
    [ingQuery]
  )

  // klikane popularne składniki (toggle jak tagi)
  const [selectedIngs, setSelectedIngs] = useState<string[]>([])
  const toggleIng = (n: string) =>
    setSelectedIngs(s => s.includes(n) ? s.filter(x=>x!==n) : [...s, n])

  // tagi
  const [tagOpen, setTagOpen] = useState(true)
  const [ingOpen, setIngOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const toggleTag = (t: string) =>
    setSelectedTags(s => s.includes(t) ? s.filter(x=>x!==t) : [...s, t])

  // wczytaj listę
  useEffect(() => {
    let cancelled = false
    setError(null)
    fetch(`/api/recipes?sort=${sort}`)
      .then(async r => {
        if (!r.ok) throw new Error(`API /api/recipes zwróciło ${r.status}`)
        return r.json() as Promise<ApiResponse>
      })
      .then(d => { if (!cancelled) setRaw(d.items || []) })
      .catch(() => {
        if (!cancelled) {
          setError('Nie udało się wczytać listy przepisów.')
          setRaw([])
        }
      })
    return () => { cancelled = true }
  }, [sort])

  // wczytaj mapę obrazków
  useEffect(() => {
    let cancelled = false
    fetch('/recipes_images.json')
      .then(r => (r.ok ? r.json() : {}))
      .then((m) => { if (!cancelled && m && typeof m === 'object') setImgMap(m as Record<string,string>) })
      .catch(()=>{})
    return () => { cancelled = true }
  }, [])

  const allIngTokens = useMemo(
    () => Array.from(new Set([...ingTokensFromInput, ...selectedIngs.map(s=>s.toLowerCase())])),
    [ingTokensFromInput, selectedIngs]
  )

  const filtered = useMemo(() => {
    const byFilter = raw.filter(r => {
      const tags = getTags(r)
      if (selectedTags.length && !selectedTags.every(t => tags.includes(t))) return false
      if (allIngTokens.length) {
        const names = r.ingredients.map(i => (i.name||'').toLowerCase())
        const ok = allIngTokens.every(tok => names.some(n => n.includes(tok)))
        if (!ok) return false
      }
      return true
    })
    const sorted = [...byFilter].sort((a,b) => {
      if (sort === 'title_asc') return a.title.localeCompare(b.title, 'pl')
      if (sort === 'title_desc') return b.title.localeCompare(a.title, 'pl')
      if (sort === 'ingredients_asc') return a.ingredients.length - b.ingredients.length
      if (sort === 'ingredients_desc') return b.ingredients.length - a.ingredients.length
      return 0
    })
    return sorted
  }, [raw, selectedTags, allIngTokens, sort])

  const facets = useMemo(() => {
    const tagCount: Record<string, number> = {}
    const ingCount: Record<string, number> = {}
    for (const r of filtered) {
      for (const t of getTags(r)) tagCount[t] = (tagCount[t]||0)+1
      for (const i of r.ingredients) {
        const n = (i.name||'').toLowerCase().trim()
        if (n) ingCount[n] = (ingCount[n]||0)+1
      }
    }
    const tags = Object.entries(tagCount).sort((a,b)=>b[1]-a[1])
    const ings = Object.entries(ingCount).sort((a,b)=>b[1]-a[1])
    return { tags, ings }
  }, [filtered])

  const resolveImg = (r: Recipe) => {
    const local = imgMap[r.id]
    if (typeof local === 'string' && local.startsWith('/')) return local
    if (r.image && (r.image.startsWith('/') || r.image.startsWith('data:') || /^https?:\/\//i.test(r.image))) return r.image
    return '/placeholder.jpg'
  }

  return (
    <main className="bg-white dark:bg-gray-900 min-h-screen">
      <Head><title>JemFit — przepisy</title></Head>

      {/* Nagłówek: czysty zielony brand, wyrównanie do siatki */}
      <header className="w-full" style={{ background: BRAND_GREEN }}>
        <div className="max-w-6xl mx-auto flex items-center gap-4 p-3">
          <div className="relative h-12 md:h-14 w-auto">
            <Image
              src="/jemfit-logo.png"
              alt="JemFit"
              width={220}
              height={56}
              className="h-12 md:h-14 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-white font-semibold text-lg md:text-xl">Przepisy</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* Kontrolki */}
        <div className="rounded-2xl border p-4 mb-4 flex flex-col md:flex-row gap-3 items-end" style={{ borderColor: BRAND_GREEN + '33' }}>
          <label className="flex-1">
            <span className="block text-sm font-medium mb-1">Szukaj po składnikach (oddziel przecinkami)</span>
            <input className="w-full rounded-xl border px-3 py-2" placeholder="np. pomidor, ryż, bazylia" value={ingQuery} onChange={e=>setIngQuery(e.target.value)} />
          </label>
          <label>
            <span className="block text-sm font-medium mb-1">Sortowanie</span>
            <select className="w-full rounded-xl border px-3 py-2" value={sort} onChange={e=>setSort(e.target.value as any)}>
              <option value="title_asc">Tytuł A→Z</option>
              <option value="title_desc">Tytuł Z→A</option>
              <option value="ingredients_asc">Mniej składników</option>
              <option value="ingredients_desc">Więcej składników</option>
            </select>
          </label>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 md:ml-auto">
            {error ? 'Błąd wczytywania' : `${filtered.length} / ${raw.length} przepisów`}
          </div>
        </div>

        {/* Facety (accordion) */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* TAGI */}
          <section className="rounded-2xl border" style={{ borderColor: BRAND_GREEN + '33' }}>
            <button className="w-full flex justify-between items-center px-4 py-3" onClick={() => setTagOpen(o=>!o)}>
              <h2 className="font-medium" style={{ color: BRAND_GREEN }}>Tagi</h2>
              <span className="text-sm" style={{ color: BRAND_GREEN }}>{tagOpen ? '−' : '+'}</span>
            </button>
            {tagOpen && (
              <div className="p-3 pt-0">
                <div className="flex flex-wrap gap-2 max-h-48 overflow-auto pr-1">
                  {facets.tags.map(([name, count]) => {
                    const active = selectedTags.includes(name)
                    return (
                      <button
                        key={name}
                        onClick={() => toggleTag(name)}
                        className="text-[11px] px-2 py-1 rounded-full border"
                        style={{
                          borderColor: active ? BRAND_GREEN : '#e5e7eb',
                          background: active ? BRAND_GREEN + '10' : 'white',
                          color: active ? BRAND_GREEN : '#111827'
                        }}
                        title={`${count} przepisów`}
                      >
                        {name} <span className="opacity-60">({count})</span>
                      </button>
                    )
                  })}
                </div>
                {selectedTags.length > 0 && (
                  <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300">
                    Aktywne: {selectedTags.join(', ')} · <button onClick={()=>setSelectedTags([])} className="underline">wyczyść</button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* POPULARNE SKŁADNIKI */}
          <section className="rounded-2xl border" style={{ borderColor: BRAND_RED + '33' }}>
            <button className="w-full flex justify-between items-center px-4 py-3" onClick={() => setIngOpen(o=>!o)}>
              <h2 className="font-medium" style={{ color: BRAND_RED }}>Popularne składniki</h2>
              <span className="text-sm" style={{ color: BRAND_RED }}>{ingOpen ? '−' : '+'}</span>
            </button>
            {ingOpen && (
              <div className="p-3 pt-0">
                <div className="flex flex-wrap gap-2 max-h-48 overflow-auto pr-1">
                  {facets.ings.slice(0,100).map(([name, count]) => {
                    const active = selectedIngs.includes(name)
                    return (
                      <button
                        key={name}
                        onClick={() => toggleIng(name)}
                        className="text-[11px] px-2 py-1 rounded-full border"
                        style={{
                          borderColor: active ? BRAND_RED : '#e5e7eb',
                          background: active ? BRAND_RED + '10' : 'white',
                          color: active ? BRAND_RED : '#111827'
                        }}
                        title={`${count} przepisów`}
                      >
                        {name} <span className="opacity-60">({count})</span>
                      </button>
                    )
                  })}
                </div>
                {selectedIngs.length > 0 && (
                  <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300">
                    Aktywne: {selectedIngs.join(', ')} · <button onClick={()=>setSelectedIngs([])} className="underline">wyczyść</button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Grid kart */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(r => {
            const kcal = getKcal(r.nutrition)
            const imgSrc = resolveImg(r)
            const tags = getTags(r)
            return (
              <article key={r.id} className="rounded-2xl border shadow-sm overflow-hidden bg-white dark:bg-gray-800">
                <Link href={`/jemfit/${encodeURIComponent(r.id)}`} className="group block">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={imgSrc}
                      alt={r.title}
                      fill
                      sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                      placeholder="blur"
                      blurDataURL={BLUR_PIXEL}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </Link>

                <div className="p-4">
                  <h2 className="font-semibold mb-1 text-lg text-gray-900 dark:text-gray-100">
                    <Link href={`/jemfit/${encodeURIComponent(r.id)}`} className="hover:underline">{r.title}</Link>
                  </h2>
                  {typeof kcal === 'number' && (
                    <div className="text-[11px] text-gray-600 dark:text-gray-300 mb-2">
                      ~{Math.round(kcal)} kcal / porcję
                    </div>
                  )}

                  {/* składniki — mniejsze fonty, liczby po lewej */}
                  <ul className="text-[13px] text-gray-800 dark:text-gray-100 space-y-1">
                    {r.ingredients.map((i, idx) => (
                      <li key={idx} className="flex justify-between gap-3">
                        <span className="text-gray-600 dark:text-gray-300 shrink-0 text-[12px]">
                          {i.quantity}{i.unit ? ` ${i.unit}` : ''}
                        </span>
                        <span className="min-w-0 text-right">{i.name}</span>
                      </li>
                    ))}
                  </ul>

                  {!!tags.length && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tags.slice(0, 8).map(t => {
                        const active = selectedTags.includes(t)
                        return (
                          <button
                            key={t}
                            onClick={() => toggleTag(t)}
                            className="text-[10px] px-2 py-0.5 rounded-full border"
                            style={{
                              borderColor: active ? BRAND_GREEN : '#e5e7eb',
                              background: active ? BRAND_GREEN + '10' : 'white',
                              color: active ? BRAND_GREEN : '#111827'
                            }}
                            title="Filtruj po tagu"
                          >
                            {t}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        {(!error && filtered.length === 0) && (
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-8">
            Brak wyników. <button className="underline" onClick={()=>{ setIngQuery(''); setSelectedTags([]); setSelectedIngs([]) }}>Wyczyść filtry</button>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 mt-8">
            {error} Sprawdź, czy działa <code>/api/recipes</code>.
          </div>
        )}
      </div>
    </main>
  )
}
