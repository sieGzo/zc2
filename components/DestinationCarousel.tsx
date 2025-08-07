'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const destinations = [
  { title: 'Lofoty&nbsp;🇳🇴', desc: 'Wodospady, widoki i&nbsp;magiczne&nbsp;światło północy' },
  { title: 'Bieszczady&nbsp;🇵🇱', desc: 'Cisza, dzikość i&nbsp;szlaki dla&nbsp;każdego' },
  { title: 'Madera&nbsp;🇵🇹', desc: 'Levada, klify i&nbsp;wieczna&nbsp;wiosna' },
  { title: 'Azory&nbsp;🇵🇹', desc: 'Zielone wulkany i&nbsp;gorące&nbsp;źródła' },
  { title: 'Teneryfa&nbsp;🇪🇸', desc: 'Słońce, ocean i&nbsp;Teide w&nbsp;tle' },
]

export default function DestinationCarousel() {
  const ref = useRef<HTMLDivElement>(null)
  const hasMounted = useRef(false)
  const [index, setIndex] = useState(0)

  // Automatyczna zmiana indeksu co 5 sekund
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % destinations.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Przewijanie do elementu po zmianie indeksu (z pominięciem pierwszego renderu)
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }

    const el = ref.current
    const card = el?.children[index] as HTMLElement
    if (card) {
      card.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest' // 👈 ZAPOBIEGA przewijaniu w pionie!
      })
    }
  }, [index])

  const scrollToIndex = (i: number) => {
    setIndex(i) // Sam useEffect zajmie się przewinięciem
  }

  const prev = () => scrollToIndex(index === 0 ? destinations.length - 1 : index - 1)
  const next = () => scrollToIndex((index + 1) % destinations.length)

  return (
    <div className="relative">
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition hidden md:block"
      >
        <ChevronLeft className="text-[#f1861e]" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition hidden md:block"
      >
        <ChevronRight className="text-[#f1861e]" />
      </button>

      <div
        ref={ref}
        className="flex gap-6 px-4 py-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar"
      >
        {destinations.map((dest, i) => (
          <div
            key={i}
            className="snap-center shrink-0 w-[80vw] sm:w-[300px] bg-gradient-to-br from-orange-100 via-white to-orange-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg text-center transition-transform duration-300 hover:scale-[1.03]"
          >
            <h4
              className="text-xl font-bold mb-3 text-[#f1861e]"
              dangerouslySetInnerHTML={{ __html: dest.title }}
            />
            <p
              className="text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: dest.desc }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
