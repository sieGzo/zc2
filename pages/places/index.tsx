// pages/places/index.tsx
import Head from 'next/head'
import { useEffect, useState } from 'react'
import PlaceCard from '@/components/PlaceCard'

export default function PlacesPage() {
  const [lat, setLat] = useState(52.2297)
  const [lon, setLon] = useState(21.0122)
  const [cats, setCats] = useState('tourism.sights,natural')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const url = `/api/geo/places?lat=${lat}&lon=${lon}&radius=10000&categories=${encodeURIComponent(cats)}&limit=24`
      const res = await fetch(url)
      const data = await res.json()
      setItems(data?.features || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <main className="max-w-7xl mx-auto p-6">
      <Head><title>Miejsca — Zwiedzaj Chytrze</title></Head>
      <h1 className="text-3xl font-bold mb-4">Miejsca (Geoapify)</h1>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <label className="block">
          <span className="block text-sm">Szerokość (lat)</span>
          <input type="number" step="0.0001" className="border rounded p-2 w-40"
            value={lat} onChange={e=>setLat(Number(e.target.value))} />
        </label>
        <label className="block">
          <span className="block text-sm">Długość (lon)</span>
          <input type="number" step="0.0001" className="border rounded p-2 w-40"
            value={lon} onChange={e=>setLon(Number(e.target.value))} />
        </label>
        <label className="block">
          <span className="block text-sm">Kategorie</span>
          <input type="text" className="border rounded p-2 w-72"
            value={cats} onChange={e=>setCats(e.target.value)} placeholder="np. tourism.sights,natural" />
        </label>
        <button onClick={load} className="px-4 py-2 rounded bg-[#f1861e] text-white hover:bg-orange-600">
          Szukaj
        </button>
      </div>

      {loading && <p>Ładowanie...</p>}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((f: any) => <PlaceCard key={f.properties?.place_id || Math.random()} f={f} />)}
      </div>
      {!loading && items.length === 0 && <p className="text-gray-600 dark:text-gray-400">Brak wyników.</p>}
    </main>
  )
}
