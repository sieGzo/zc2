// components/PromoGrid.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import clsx from 'clsx'

type Promo = {
  id: string
  title: string
  brand: string
  price?: string   // np. "od 399 PLN"
  dates?: string
  img: string
  href?: string
  tag?: string     // np. "Loty", "Hotele", "Atrakcie"
}

type State = 'idle' | 'loading' | 'ready' | 'error'

export default function PromoGrid() {
  const [items, setItems] = useState<Promo[]>([])
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState<string | null>(null)
  const [tag, setTag] = useState<string | null>(null)
  const [brand, setBrand] = useState<string | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    const load = async () => {
      try {
        setState('loading')
        const r = await fetch('/api/promos', { signal: ac.signal, cache: 'no-store' })
        if (!r.ok) throw new Error('Błąd pobierania promocji')
        const d = await r.json()
        setItems(Array.isArray(d?.items) ? d.items : [])
        setState('ready')
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setError(e?.message || 'Błąd pobierania promocji')
          setState('error')
        }
      }
    }
    load()
    return () => ac.abort()
  }, [])

  // Zbiorcze filtry (zliczanie)
  const facets = useMemo(() => {
    const tags = new Map<string, number>()
    const brands = new Map<string, number>()
    items.forEach(i => {
      if (i.tag) tags.set(i.tag, (tags.get(i.tag) ?? 0) + 1)
      if (i.brand) brands.set(i.brand, (brands.get(i.brand) ?? 0) + 1)
    })
    return { tags, brands }
  }, [items])

  const filtered = useMemo(() => {
    return items.filter(i =>
      (tag ? i.tag === tag : true) &&
      (brand ? i.brand === brand : true)
    )
  }, [items, tag, brand])

  if (state === 'error') {
    return <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p>
  }

  return (
    <section aria-label="Promocje">
      {/* FILTRY */}
      {(items.length > 0) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {[...facets.tags.entries()].map(([t, count]) => (
            <button
              key={t}
              onClick={() => setTag(prev => prev === t ? null : t)}
              className={clsx(
                "rounded-full border px-3 py-1 text-sm transition",
                tag === t
                  ? "border-[#f1861e] bg-[#f1861e]/10 text-[#f1861e]"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
              )}
            >
              {t} <span className="opacity-60">({count})</span>
            </button>
          ))}

          {[...facets.brands.entries()].map(([b, count]) => (
            <button
              key={b}
              onClick={() => setBrand(prev => prev === b ? null : b)}
              className={clsx(
                "rounded-full border px-3 py-1 text-sm transition",
                brand === b
                  ? "border-[#f1861e] bg-[#f1861e]/10 text-[#f1861e]"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
              )}
              title={`Marka: ${b}`}
            >
              {b} <span className="opacity-60">({count})</span>
            </button>
          ))}

          {(tag || brand) && (
            <button
              onClick={() => { setTag(null); setBrand(null) }}
              className="ml-2 rounded-full border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Wyczyść filtry
            </button>
          )}
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(state === 'loading' ? Array.from({ length: 6 }) : filtered).map((p, idx) => (
          <PromoCard key={(p as any)?.id ?? idx} promo={p as Promo} loading={state === 'loading'} />
        ))}
      </div>

      {/* PUSTY STAN */}
      {state === 'ready' && filtered.length === 0 && (
        <p className="mt-6 rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          Brak wyników dla wybranych filtrów.
        </p>
      )}
    </section>
  )
}

/* -------------------------- subkomponent: karta -------------------------- */

function PromoCard({ promo, loading }: { promo?: Promo; loading?: boolean }) {
  if (loading) return <SkeletonCard />

  const Wrapper: any = promo?.href ? 'a' : 'div'
  const isExternal = Boolean(promo?.href?.startsWith('http'))

  return (
    <Wrapper
      href={promo?.href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'sponsored noopener' : undefined}
      className={clsx(
        "group relative overflow-hidden rounded-2xl border bg-white transition-all",
        "border-gray-200 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
      )}
      aria-label={promo?.title}
    >
      {/* obrazek z gradientem i wstążkami */}
      <div className="relative aspect-[16/9]">
        {promo?.img ? (
          <Image
            src={promo.img}
            alt={promo.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gray-200 dark:bg-gray-800" />
        )}

        {/* gradient na czytelność */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />

        {/* cena (wstążka) */}
        {promo?.price && (
          <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {promo.price}
          </div>
        )}

        {/* tag */}
        {promo?.tag && (
          <div className="absolute right-3 top-3 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-medium backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-white">
            {promo.tag}
          </div>
        )}
      </div>

      {/* treść */}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="rounded-full border px-2 py-0.5 text-[11px] dark:border-gray-700">
            {promo?.brand || '—'}
          </span>
          {promo?.dates && <span className="ml-auto">{promo.dates}</span>}
        </div>

        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug">
          {promo?.title}
        </h3>

        <div className="mt-3 inline-flex items-center text-[#f1861e]">
          <span className="font-medium underline-offset-2 group-hover:underline">Zobacz ofertę</span>
          <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M12.293 5.293a1 1 0 011.414 0l4 4a.997.997 0 01.083.094l.007.01a1 1 0 01-.09 1.307l-4 4a1 1 0 01-1.414-1.414L14.586 11H2a1 1 0 110-2h12.586l-2.293-2.293a1 1 0 010-1.414z"/>
          </svg>
        </div>
      </div>
    </Wrapper>
  )
}

/* -------------------------- skeleton -------------------------- */

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="relative aspect-[16/9] bg-gray-200 dark:bg-gray-800" />
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-full border border-gray-200 dark:border-gray-700" />
          <div className="ml-auto h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="mt-3 h-4 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-2 h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-4 h-5 w-28 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      {/* shimmer */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
      <style jsx>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  )
}
