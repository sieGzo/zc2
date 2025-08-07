'use client'

import { useEffect, useRef, useState } from 'react'

export default function PromocjeLinii() {
  const [flights, setFlights] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)

  const fetchFlights = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/flights')
      const data = await res.json()
      setFlights(data)
    } catch (error) {
      console.error('Błąd ładowania promocji:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlights()
  }, [])

  // zapobiega focusowi po renderze
  useEffect(() => {
    if (listRef.current) {
      listRef.current.focus({ preventScroll: true })
    }
  }, [flights])

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          fetchFlights()
        }}
        className="mb-6 inline-flex items-center justify-center bg-[#f1861e] text-white px-5 py-2 rounded-full font-semibold hover:bg-orange-600 transition-colors focus:outline-none"
        tabIndex={-1}
      >
        🔄 Odśwież promocje
      </button>

      {loading ? (
        <p className="text-orange-600 font-semibold mt-4">✈️ Szukam najlepszych ofert...</p>
      ) : flights.length > 0 ? (
        <ul
          ref={listRef}
          tabIndex={-1}
          className="space-y-4 mt-4"
        >
          {flights.map((flight, idx) => (
            <li key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <p className="text-lg font-semibold text-[#f1861e]">
                {flight.origin} → {flight.destination} za {flight.price} zł
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
        <p className="text-gray-500 dark:text-gray-400 mt-4">Brak dostępnych promocji.</p>
      )}
    </div>
  )
}
