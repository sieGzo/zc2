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

const SOURCES = [
  { key: 'flights', label: 'Amadeus' },
  { key: 'kiwi', label: 'Kiwi' },
  { key: 'skyscanner', label: 'Skyscanner' },
  { key: 'promocje-all', label: 'Wszystko' },
]

export default function PromocjeLinii() {
  const [source, setSource] = useState(SOURCES[0].key)
  const [flights, setFlights] = useState<Deal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const fmt = useMemo(() => new Intl.NumberFormat('pl-PL'), [])

  const fetchFlights = async (src = source) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/${src}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as Deal[]

      if (!Array.isArray(data) || data.length === 0) {
        setFlights([])
        setError('Źródło chwilowo niedostępne lub brak ofert')
        return
      }

      setFlights(data)
    } catch (e: any) {
      console.error(`Błąd ładowania promocji (${src}):`, e)
      setError('Nie udało się pobrać promocji')
      setFlights([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlights()
  }, [source])

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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
      {/* Przełącznik źródła */}
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {SOURCES.map((s) => (
          <button
            key={s.key}
            onClick={() => setSource(s.key)}
            className={`px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${
              source === s.key
                ? 'bg-[#f1861e] text-white border-[#f1861e]'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          fetchFlights()
        }}
        className="mb-6 inline-flex items-center justify-center bg-[#f1861e] text-white px-5 py-2 rounded-full font-semibold hover:bg-orange-600 transition-colors"
        tabIndex={-1}
      >
        🔄 Odśwież promocje
      </button>

      {loading && <p className="text-orange-600 font-semibold mt-4">✈️ Szukam najlepszych ofert...</p>}
      {error && <p className="text-red-600 mt-2">{error}</p>}

      {!loading && !error && flights.length > 0 ? (
        <ul ref={listRef} tabIndex={-1} className="space-y-4 mt-4">
          {flights.map((f, idx) => (
            <li key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-4">
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
        !loading &&
        !error && <p className="text-gray-500 dark:text-gray-400 mt-4">Brak dostępnych promocji.</p>
      )}
    </div>
  )
}
