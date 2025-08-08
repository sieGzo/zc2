// components/PlaceCard.tsx
import Image from 'next/image'
import Link from 'next/link'

export default function PlaceCard({ f }: any) {
  const props = f.properties || {}
  const img = props.preview?.image || '/placeholder.jpg'
  const title = props.name || 'Miejsce bez nazwy'
  return (
    <div className="rounded-xl overflow-hidden border dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
      <div className="relative h-48">
        <Image src={img} alt={title} fill className="object-cover" />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{props.categories}</p>
        <Link href={`/places/${props.place_id}`} prefetch={false} className="inline-block mt-3 text-[#f1861e] hover:underline">
          Zobacz szczegóły
        </Link>
      </div>
    </div>
  )
}
