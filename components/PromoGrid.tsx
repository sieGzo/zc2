// components/PromoGrid.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

type Promo = {
  id: string
  title: string
  brand: string
  price?: string
  dates?: string
  img: string
  href: string
  tag?: string
}

export default function PromoGrid() {
  const [items, setItems] = useState<Promo[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/promos')
      .then(r => r.json())
      .then(d => { if (alive) setItems(d?.items ?? []) })
      .catch(e => { if (alive) setErr(e?.message || 'Błąd pobierania promocji') })
    return () => { alive = false }
  }, [])

  if (err) return <p className="text-red-600">{err}</p>

  const skeletons = Array.from({ length: 6 }).map((_, i) => ({ id: `sk-${i}` } as any))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {(items ?? skeletons).map((p: Promo, i) => (
        <a
          key={p.id || `sk-${i}`}
          href={p.href || '#'}
          target={p.href ? '_blank' : undefined}
          rel={p.href ? 'sponsored noopener' : undefined}
          className="group relative rounded-xl overflow-hidden border border-gray-200/70 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xl hover:scale-[1.01] transition-all"
        >
          <div className="relative h-40">
            {p.img ? (
              <Image
                src={p.img}
                alt={p.title}
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <div className="h-full w-full animate-pulse bg-gray-200 dark:bg-gray-700" />
            )}
            {p.price && (
              <div className="absolute top-2 left-2 rounded-full px-3 py-1 text-xs font-semibold bg-black/70 text-white backdrop-blur">
                {p.price}
              </div>
            )}
          </div>

          <div className="p-4 text-left">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {p.tag && <span className="uppercase tracking-wide">{p.tag}</span>}
              <span className="ml-auto rounded-full px-2 py-0.5 border text-[11px]">{p.brand || '—'}</span>
            </div>
            <h3 className="mt-2 font-semibold min-h-[2.5rem]">
              {p.title || <span className="inline-block w-2/3 h-4 bg-gray-200 dark:bg-gray-700 animate-pulse" />}
            </h3>
            {p.dates && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{p.dates}</p>}
            <div className="mt-3 text-[#f1861e] font-medium underline underline-offset-2">
              Zobacz ofertę →
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
