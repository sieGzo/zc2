// pages/places/[id].tsx
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function PlaceDetail() {
  const { query } = useRouter()
  const id = String(query.id || '')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/geo/place/${id}`).then(r=>r.json()).then(setData).catch(()=>setData(null))
  }, [id])

  const title = data?.features?.[0]?.properties?.name || 'Miejsce'
  const props = data?.features?.[0]?.properties || {}
  const img = props?.preview?.image || '/placeholder.jpg'

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Head><title>{title} — Zwiedzaj Chytrze</title></Head>
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{props?.address_line1 || ''} {props?.address_line2 || ''}</p>

      <div className="relative w-full h-64 rounded-xl overflow-hidden border dark:border-gray-700 mb-4">
        <Image src={img} alt={title} fill className="object-cover" />
      </div>

      <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded text-xs overflow-x-auto">
        {JSON.stringify(props, null, 2)}
      </pre>
    </main>
  )
}
