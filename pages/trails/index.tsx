// pages/trails/index.tsx
import Head from 'next/head'
import { useState } from 'react'

export default function TrailsPage() {
  const [mode, setMode] = useState<'walk'|'bicycle'>('walk')
  const [start, setStart] = useState({ lat: 52.2297, lon: 21.0122 })
  const [end, setEnd] = useState({ lat: 52.4064, lon: 16.9252 })
  const [route, setRoute] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function plan() {
    setLoading(true)
    try {
      const waypoints = [[start.lon, start.lat], [end.lon, end.lat]]
      const res = await fetch('/api/geo/route', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, waypoints })
      })
      const data = await res.json()
      setRoute(data)
    } finally { setLoading(false) }
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Head><title>Szlaki (Geoapify Routing) — Zwiedzaj Chytrze</title></Head>
      <h1 className="text-3xl font-bold mb-4">Planer trasy</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm">Start — lat</label>
          <input className="border rounded p-2 w-full" type="number" step="0.0001" value={start.lat} onChange={e=>setStart({...start, lat: Number(e.target.value)})} />
          <label className="block text-sm mt-2">Start — lon</label>
          <input className="border rounded p-2 w-full" type="number" step="0.0001" value={start.lon} onChange={e=>setStart({...start, lon: Number(e.target.value)})} />
        </div>
        <div>
          <label className="block text-sm">Meta — lat</label>
          <input className="border rounded p-2 w-full" type="number" step="0.0001" value={end.lat} onChange={e=>setEnd({...end, lat: Number(e.target.value)})} />
          <label className="block text-sm mt-2">Meta — lon</label>
          <input className="border rounded p-2 w-full" type="number" step="0.0001" value={end.lon} onChange={e=>setEnd({...end, lon: Number(e.target.value)})} />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2">
          <input type="radio" name="mode" checked={mode==='walk'} onChange={()=>setMode('walk')} /> piesza
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="mode" checked={mode==='bicycle'} onChange={()=>setMode('bicycle')} /> rowerowa
        </label>
        <button onClick={plan} className="ml-auto px-4 py-2 rounded bg-[#f1861e] text-white hover:bg-orange-600">
          Zaplanuj
        </button>
      </div>

      {loading && <p>Liczenie trasy...</p>}
      {route && (
        <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded text-xs overflow-x-auto">
          {JSON.stringify(route?.features?.[0]?.properties?.distance || route, null, 2)}
        </pre>
      )}
    </main>
  )
}
