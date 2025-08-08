// pages/places/[xid].tsx
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function PlaceDetail() {
  const { query } = useRouter()
  const xid = String(query.xid || '')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!xid) return
    fetch(`/api/opentripmap/place/${xid}`).then(r=>r.json()).then(setData).catch(()=>setData(null))
  }, [xid])

  const img = data?.preview?.source || '/placeholder.jpg'

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Head><title>{data?.name || 'Miejsce'} — Zwiedzaj Chytrze</title></Head>
      <h1 className="text-3xl font-bold mb-2">{data?.name || 'Miejsce'}</h1>
      {data?.address && <p className="text-gray-600 dark:text-gray-400 mb-4">
        {data.address.road || ''} {data.address.city || ''}
      </p>}

      <div className="relative w-full h-64 rounded-xl overflow-hidden border dark:border-gray-700 mb-4">
        <Image src={img} alt={data?.name || 'Miejsce'} fill className="object-cover" />
      </div>

      <p className="whitespace-pre-wrap">{data?.wikipedia_extracts?.text || 'Brak opisu.'}</p>
      {data?.info && <p className="text-sm text-gray-500 mt-4">{data.info}</p>}
    </main>
  )
}
