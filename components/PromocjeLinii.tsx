'use client'

import { useEffect, useRef, useState, useMemo } from 'react'

type PriceShape =
  | number
  | { amount: number; currency?: string }
  | { total: string; currency?: string }

type Flight = {
  origin: string
  destination: string
  departureDate?: string
  returnDate?: string
  price: PriceShape
}

export default function PromocjeLinii() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  const fmt = useMemo(() => new Intl.NumberFormat('pl-PL'), [])

  const normalizePrice = (p: PriceShape) => {
    if (typeof p === 'number') return { amount: p, currency: 'PLN' as string }
    if (p && typeof p === 'object') {
      if ('amount' in p) return { amount: Number(p.amount || 0), currency: p.currency || 'PLN' }
      if ('total' in p) return { amount: Number(p.total || 0), currency: p.currency || 'PLN' }
    }
    return { amount: 0, currency: 'PLN' as string }
  }

  const fetchFlights = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/flights', { cache: 'no-store' })
      const data = await res.json()
      setFlights(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Błąd ładowania promocji:', e)
      setFlights([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFlights() }, [])
  useEffect(() => {
    if (listRef.current) listRef.current.focus({ preventScroll: true })
  }, [flights])

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); fetchFlights() }}
        className="mb-6 inline-flex items-center justify-center bg-[#f1861e] text-white px-5 py-2 rounded-full font-semibold hover:bg-orange-600 transition-colors focus:outline-none"
        tabIndex={-1}
      >
        🔄 Odśwież promocje
      </button>

      {loading ? (
        <p className="text-orange-600 font-semibold mt-4">✈️ Szukam najlepszych ofert...</p>
      ) : flights.length > 0 ? (
        <ul ref={listRef} tabIndex={-1} className="space-y-4 mt-4">
          {flights.map((f, i) => {
            const { amount, currency } = normalizePrice(f.price)
            return (
              <li key={i} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <p className="text-lg font-semibold text-[#f1861e]">
                  {f.origin} → {f.destination}{' '}
                  {amount > 0 ? <>od {fmt.format(amount)} {currency}</> : <>—</>}
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
            )
          })}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 mt-4">Brak dostępnych promocji.</p>
      )}
    </div>
  )
}
