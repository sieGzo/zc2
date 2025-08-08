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

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    const el = ref.current
    const card = el?.children[index] as HTMLElement | undefined
    if (card) {
      requestAnimationFrame(() => {
        card.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        })
      })
    }
  }, [index])

  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => Math.min(destinations.length - 1, i + 1))
  const scrollToIndex = (i: number) => setIndex(i)

  return (
    <div className="max-w-6xl mx-auto my-10">
      <div className="flex items-center justify-between px-4">
        <button
          className="p-2 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-800"
          aria-label="Poprzedni"
          onClick={prev}
        >
          <ChevronLeft />
        </button>
        <h3 className="text-2xl font-bold">Pomysły na kierunki</h3>
        <button
          className="p-2 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-800"
          aria-label="Następny"
          onClick={next}
        >
          <ChevronRight />
        </button>
      </div>
      <div
        ref={ref}
        className="flex gap-6 px-4 py-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar"
      >
        {destinations.map((dest, i) => (
          <div
            key={i}
            onClick={() => scrollToIndex(i)}
            className="snap-center shrink-0 w-[80vw] sm:w-[300px] bg-white dark:bg-gray-800 p-6 rounded-xl shadow text-center transition-transform duration-300 hover:scale-[1.03] cursor-pointer"
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
