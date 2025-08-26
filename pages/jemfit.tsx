// /pages/jemfit.tsx
import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

type Ingredient = { name: string; quantity?: number | string | null; unit?: string | null; group?: string | null }
interface Recipe { id: string; title: string; ingredients: Ingredient[]; tags?: string[]; prep_time?: string | number | null; image?: string | null }

interface ApiResponse {
  items: Recipe[]
  total: number
  page: number
  pageSize: number
  facets: { tags: [string, number][]; ingredients: [string, number][] }
}

export default function JemfitPreview() {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'title_asc'|'title_desc'|'ingredients_asc'|'ingredients_desc'>('title_asc')
  const [tagSel, setTagSel] = useState<string[]>([])
  const [ingSel, setIngSel] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const qs = useMemo(() => {
    const usp = new URLSearchParams()
    if (q) usp.set('q', q)
    if (tagSel.length) usp.set('tag', tagSel.join(','))
    if (ingSel.length) usp.set('ing', ingSel.join(','))
    usp.set('sort', sort)
    usp.set('page', String(page))
    usp.set('pageSize', '24')
    return usp.toString()
  }, [q, tagSel, ingSel, sort, page])

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch(`/api/recipes?${qs}`)
      .then(r => r.json())
      .then((json: ApiResponse) => { if (active) setData(json) })
      .catch(() => { if (active) setData(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [qs])

  useEffect(() => { setPage(1) }, [q, tagSel, ingSel, sort])

  const title = 'JemFit — podgląd przepisów (test)'
  const brandRed = '#A21F1A'
  const brandGreen = '#125D49'

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Head>
        <title>{title}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* top bar with logo */}
      <header className="border-b">
        <div className="mx-auto max-w-7xl p-3 flex items-center gap-4">
          <img
            src="https://www.jemfit.pl/wp-content/uploads/2024/10/logo-glowne-tagline-png-1.png"
            alt="JemFit"
            className="h-8 w-auto"
          />
          <h1 className="text-xl font-semibold">Podgląd przepisów</h1>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-4">
        {/* Controls */}
        <div className="grid gap-3 md:grid-cols-4 items-end rounded-2xl p-4 sticky top-0 z-10"
             style={{ background: `linear-gradient(90deg, ${brandGreen}10, ${brandRed}10)` }}>
          <label className="col-span-2">
            <span className="block text-sm font-medium mb-1">Szukaj (tytuł / składniki)</span>
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="np. ketchup, ryż, bezglutenowe"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </label>

          <label>
            <span className="block text-sm font-medium mb-1">Sortowanie</span>
            <select className="w-full rounded-xl border px-3 py-2" value={sort} onChange={e => setSort(e.target.value as any)}>
              <option value="title_asc">Tytuł A→Z</option>
              <option value="title_desc">Tytuł Z→A</option>
              <option value="ingredients_asc">Mniej składników</option>
              <option value="ingredients_desc">Więcej składników</option>
            </select>
          </label>

          <div className="text-sm text-gray-600">{loading ? 'Ładowanie…' : data ? `${data.total} przepisów` : '—'}</div>
        </div>

        {/* Facet filters */}
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <Facet
            title="Tagi (auto)"
            items={data?.facets.tags || []}
            selected={tagSel}
            onToggle={(v) => setTagSel(s => s.includes(v) ? s.filter(x=>x!==v) : [...s, v])}
            activeColor={brandGreen}
          />
          <Facet
            title="Składniki (top 100)"
            items={data?.facets.ingredients || []}
            selected={ingSel}
            onToggle={(v) => setIngSel(s => s.includes(v) ? s.filter(x=>x!==v) : [...s, v])}
            activeColor={brandRed}
          />
        </div>

        {/* Results grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.items.map(r => (
            <article key={r.id} className="rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition">
              {r.image && (
                <div className="aspect-[16/9] bg-gray-100">
                  <img src={r.image} alt={r.title} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">
                  <Link href={`/jemfit/${r.id}`} className="hover:underline decoration-from-font">{r.title}</Link>
                </h3>
                {r.tags && r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {r.tags.slice(0,6).map(t => (
                      <button key={t} onClick={()=> setTagSel(s => s.includes(t)? s : [...s,t])}
                        className="text-xs px-2 py-1 rounded-full border"
                        style={{ borderColor: brandGreen, color: brandGreen }}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
                <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                  {r.ingredients.slice(0,8).map((i, idx) => (
                    <li key={idx}>
                      <button className="underline decoration-dotted"
                              onClick={()=> setIngSel(s => s.includes(i.name.toLowerCase())? s : [...s, i.name.toLowerCase()])}>
                        {i.name}
                      </button>
                      {i.quantity ? ` — ${i.quantity}${i.unit ? ' '+i.unit : ''}` : ''}
                    </li>
                  ))}
                </ul>
                {r.ingredients.length > 8 && (
                  <div className="text-xs text-gray-500 mt-1">…i {r.ingredients.length - 8} więcej</div>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Pagination */}
        {data && data.total > data.pageSize && (
          <div className="flex items-center justify-center gap-2 my-8">
            <button className="px-3 py-2 rounded-xl border disabled:opacity-50"
                    style={{ borderColor: brandRed, color: brandRed }}
                    disabled={page<=1} onClick={()=> setPage(p => Math.max(1, p-1))}>← Poprzednia</button>
            <div className="text-sm">Strona {page} z {Math.ceil(data.total / data.pageSize)}</div>
            <button className="px-3 py-2 rounded-xl border disabled:opacity-50"
                    style={{ borderColor: brandGreen, color: brandGreen }}
                    disabled={page>=Math.ceil(data.total / data.pageSize)} onClick={()=> setPage(p => p+1)}>Następna →</button>
          </div>
        )}
      </div>
    </main>
  )
}

function Facet({
  title, items, selected, onToggle, activeColor
}:{
  title: string; items: [string, number][]; selected: string[]; onToggle: (v:string)=>void; activeColor: string
}) {
  return (
    <section>
      <h2 className="font-medium text-gray-800 mb-2">{title}</h2>
      <div className="flex flex-wrap gap-2 max-h-56 overflow-auto pr-1">
        {items.map(([name, count]) => {
          const active = selected.includes(name)
          return (
            <button
              key={name}
              className="text-xs px-2 py-1 rounded-full border"
              style={{
                borderColor: active ? activeColor : '#e5e7eb',
                background: active ? `${activeColor}10` : 'white',
                color: active ? activeColor : '#111827'
              }}
              onClick={() => onToggle(name)}
              title={`${count} przepisów`}
            >
              {name} <span className="opacity-60">({count})</span>
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">Aktywne: {selected.join(', ')}</div>
      )}
    </section>
  )
}
