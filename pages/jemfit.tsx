import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'

type Ingredient = { name: string; quantity?: string | number | null; unit?: string | null }
interface Recipe {
  id: string
  title: string
  ingredients: Ingredient[]
  tags?: string[]
  image?: string | null
  nutrition?: { basis: 'per_serving'; calories_kcal?: number }[] | null
}
interface ApiResponse { items: Recipe[]; total: number }

const BRAND_RED = '#A21F1A'
const BRAND_GREEN = '#125D49'
const BLUR_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='

export default function JemfitList() {
  const [raw, setRaw] = useState<Recipe[]>([])
  const [sort, setSort] = useState<'title_asc'|'title_desc'|'ingredients_asc'|'ingredients_desc'>('title_asc')
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    let cancelled = false
    setError(null)
    fetch(`/api/recipes?sort=${sort}`)
      .then(async r => {
        if (!r.ok) throw new Error(`API /api/recipes zwróciło ${r.status}`)
        return r.json() as Promise<ApiResponse>
      })
      .then(d => { if (!cancelled) setRaw(d.items || []) })
      .catch(err => {
        console.warn(err)
        if (!cancelled) {
          setError('Nie udało się wczytać listy przepisów.')
          setRaw([])
        }
      })
    return () => { cancelled = true }
  }, [sort])

  // wszystkie wybrane składniki = z inputu + z klikniętych „popularnych”
  const allIngTokens = useMemo(
    () => Array.from(new Set([...ingTokensFromInput, ...selectedIngs.map(s=>s.toLowerCase())])),
    [ingTokensFromInput, selectedIngs]
  )

  const filtered = useMemo(() => {
    return raw.filter(r => {
      if (selectedTags.length && !selectedTags.every(t => (r.tags||[]).includes(t))) return false
      if (allIngTokens.length) {
        const names = r.ingredients.map(i => (i.name||'').toLowerCase())
        const ok = allIngTokens.every(tok => names.some(n => n.includes(tok)))
        if (!ok) return false
      }
      return true
    })
  }, [raw, selectedTags, allIngTokens])

  const facets = useMemo(() => {
    const tagCount: Record<string, number> = {}
    const ingCount: Record<string, number> = {}
    for (const r of filtered) {
      for (const t of (r.tags||[])) tagCount[t] = (tagCount[t]||0)+1
      for (const i of r.ingredients) {
        const n = (i.name||'').toLowerCase().trim()
        if (n) ingCount[n] = (ingCount[n]||0)+1
      }
    }
    const tags = Object.entries(tagCount).sort((a,b)=>b[1]-a[1])
    const ings = Object.entries(ingCount).sort((a,b)=>b[1]-a[1])
    return { tags, ings }
  }, [filtered])

  return (
    <main className="bg-white dark:bg-gray-900 min-h-screen">
      <Head><title>JemFit — przepisy</title></Head>

      {/* >>> Większe logo w gradientowym nagłówku (użyjemy /jemfit-logo.2.png) <<< */}
      <header className="w-full" style={{ background: `linear-gradient(90deg, ${BRAND_GREEN}, ${BRAND_RED})` }}>
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
          <div className="text-sm text-gray-600 dark:text-gray-300 md:ml-auto">
            {error ? 'Błąd wczytywania' : `${filtered.length} / ${raw.length} przepisów`}
          </div>
        </div>

        {/* Facety (accordion) */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* TAGI */}
          <section className="rounded-2xl border" style={{ borderColor: BRAND_GREEN + '33' }}>
            <button className="w-full flex justify-between items-center px-4 py-3" onClick={() => setTagOpen(o=>!o)}>
              <h2 className="font-medium">Tagi</h2>
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
                        className="text-xs px-2 py-1 rounded-full border"
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
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                    Aktywne: {selectedTags.join(', ')} · <button onClick={()=>setSelectedTags([])} className="underline">wyczyść</button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* POPULARNE SKŁADNIKI */}
          <section className="rounded-2xl border" style={{ borderColor: BRAND_RED + '33' }}>
            <button className="w-full flex justify-between items-center px-4 py-3" onClick={() => setIngOpen(o=>!o)}>
              <h2 className="font-medium">Popularne składniki</h2>
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
                        className="text-xs px-2 py-1 rounded-full border"
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
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
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
            const kcal = r.nutrition?.find(n => n.basis === 'per_serving')?.calories_kcal
            return (
              <article key={r.id} className="rounded-2xl border shadow-sm overflow-hidden bg-white dark:bg-gray-800">
                <Link href={`/jemfit/${r.id}`} className="group block">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={r.image || '/placeholder.jpg'}
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
                  <h2 className="font-semibold mb-1 text-lg">
                    <Link href={`/jemfit/${r.id}`} className="hover:underline">{r.title}</Link>
                  </h2>
                  {typeof kcal === 'number' && (
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                      ~{Math.round(kcal)} kcal / porcję
                    </div>
                  )}

                  <ul className="text-sm text-gray-800 dark:text-gray-100 space-y-1">
                    {r.ingredients.map((i, idx) => (
                      <li key={idx} className="flex justify-between gap-3">
                        <span className="min-w-0">{i.name}</span>
                        <span className="text-gray-600 dark:text-gray-300 shrink-0">
                          {i.quantity}{i.unit ? ` ${i.unit}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {!!(r.tags && r.tags.length) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {r.tags.slice(0, 8).map(t => {
                        const active = selectedTags.includes(t)
                        return (
                          <button
                            key={t}
                            onClick={() => toggleTag(t)}
                            className="text-[11px] px-2 py-1 rounded-full border"
                            style={{
                              borderColor: active ? BRAND_GREEN : '#e5e7eb',
                              background: active ? BRAND_GREEN + '10' : 'white',
                              color: active ? BRAND_GREEN : '#111827'
                            }}
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
