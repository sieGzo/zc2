'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type PriceObj = { amount: number; currency: string }
type Deal = {
  origin: string
  destination: string
  departureDate?: string
  returnDate?: string
  price?: PriceObj | number | string | null
}

export default function PromocjeLinii() {
  const [flights, setFlights] = useState<Deal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const fmt = useMemo(() => new Intl.NumberFormat('pl-PL'), [])

  async function fetchFlights({ nocache = false }: { nocache?: boolean } = {}) {
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const url = nocache
        ? `/api/flights?nocache=1&t=${Date.now()}`
        : `/api/flights?t=${Date.now()}`
      const res = await fetch(url, { cache: 'no-store' })
      const src = res.headers.get('x-source')
      if (src) setSource(src)
      if (!res.ok) throw new Error('HTTP ' + res.status)

      const json = await res.json()

      // Obsłuż oba kształty odpowiedzi: Deal[] lub { flights: Deal[], notice?: string }
      const list: Deal[] = Array.isArray(json) ? json : Array.isArray(json?.flights) ? json.flights : []
      setFlights(list)
      setNotice(!Array.isArray(json) ? (json?.notice ?? null) : null)
    } catch (e: any) {
      console.error('Błąd ładowania promocji:', e)
      setError('Nie udało się pobrać promocji.')
      setFlights([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFlights() }, [])

  useEffect(() => {
    if (listRef.current) listRef.current.focus({ preventScroll: true })
  }, [flights])

  function formatPrice(price: Deal['price']) {
    if (!price) return 'cena wkrótce'
    if (typeof price === 'object' && 'amount' in price && 'currency' in price) {
      const p = price as PriceObj
      return `od ${fmt.format(p.amount)} ${p.currency}`
    }
    const n = Number(price)
    if (!Number.isNaN(n) && n > 0) return `od ${fmt.format(n)} PLN`
    return 'cena wkrótce'
  }

  return (
    <section className="bg-white dark:bg-gray-800 contrast:bg-black p-6 rounded-lg shadow text-center">
      <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 contrast:text-white">
        źródło: {source ?? '—'}
      </div>

      {notice && (
        <p className="mb-3 text-xs text-amber-600 dark:text-amber-400 contrast:text-yellow-300">
          {notice}
        </p>
      )}

      <button
        type="button"
        onClick={() => fetchFlights({ nocache: true })}
        disabled={loading}
        className="mb-6 inline-flex items-center justify-center bg-[#f1861e] text-white px-5 py-2 rounded-full font-semibold hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        aria-busy={loading}
      >
        🔄 {loading ? 'Ładuję…' : 'Odśwież promocje'}
      </button>

      <div aria-live="polite">
        {loading && <p className="text-orange-600 dark:text-orange-400 font-semibold mt-2">✈️ Szukam najlepszych ofert…</p>}
        {error && <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>}

        {!loading && !error && flights.length > 0 ? (
          <ul ref={listRef} tabIndex={-1} className="space-y-4 mt-4">
            {flights.map((f, idx) => (
              <li key={`${f.origin}-${f.destination}-${idx}`} className="border-b border-gray-200 dark:border-gray-700 contrast:border-white pb-4">
                <p className="text-lg font-semibold text-[#f1861e]">
                  {f.origin} → {f.destination} {formatPrice(f.price)}
                </p>
                <a
                  href="https://www.google.com/flights?hl=pl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 underline"
                >
                  Wyszukaj lot ręcznie
                </a>
              </li>
            ))}
          </ul>
        ) : (
          !loading && !error && (
            <p className="text-gray-500 dark:text-gray-400 contrast:text-white mt-4">
              Brak dostępnych promocji.
            </p>
          )
        )}
      </div>
    </section>
  )
}
