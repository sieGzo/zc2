// pages/trails/[id].tsx
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function TrailDetail() {
  const { query } = useRouter()
  const id = String(query.id || '')
  return (
    <main className="max-w-3xl mx-auto p-6">
      <Head><title>Trasa — Zwiedzaj Chytrze</title></Head>
      <h1 className="text-3xl font-bold mb-4">Szczegóły trasy</h1>
      <p className="text-gray-600 dark:text-gray-400">ID: <code>{id}</code></p>
      <p className="mt-4">Tu możesz dodać mapę (Leaflet/Mapbox) i profil wysokości.</p>
    </main>
  )
}
