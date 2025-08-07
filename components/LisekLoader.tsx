// components/LisekLoader.tsx
import Image from 'next/image'

export default function LisekLoader() {
  return (
    <div className="flex flex-col items-center mt-6">
      <div className="animate-swing">
        <Image
          src="/lisek-loader.png"
          alt="Ładowanie..."
          width={80}
          height={80}
          priority
        />
      </div>
      <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm">Lisek sprawdza...</p>
    </div>
  )
}
