// components/TrailCard.tsx
import Link from 'next/link'

export default function TrailCard({ trail }: any) {
  return (
    <div className="rounded-xl overflow-hidden border dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <h3 className="font-bold text-lg">{trail.name}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">Długość: {trail.distance_km} km · Typ: {trail.type}</p>
      <Link className="inline-block mt-3 text-[#f1861e] hover:underline" href={`/trails/${trail.id}`} prefetch={false}>
        Szczegóły trasy
      </Link>
    </div>
  )
}
