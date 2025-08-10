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
    if (!hasMounted.current) { hasMounted.current = true; return }
    const el = ref.current
    const card = el?.children[index] as HTMLElement | undefined
    if (card) requestAnimationFrame(() => card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }))
  }, [index])

  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => Math.min(destinations.length - 1, i + 1))
  const scrollToIndex = (i: number) => setIndex(i)

  return (
    <div className="max-w-6xl mx-auto my-10">
      <div className="flex items-center justify-between px-4">
        <button className="btn btn-outline btn-sm rounded-full" aria-label="Poprzedni" onClick={prev}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-2xl font-bold">Pomysły na kierunki</h3>
        <button className="btn btn-outline btn-sm rounded-full" aria-label="Następny" onClick={next}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div ref={ref} className="flex gap-6 px-4 py-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar">
        {destinations.map((dest, i) => (
          <div
            key={i}
            onClick={() => scrollToIndex(i)}
            className="snap-center shrink-0 w-[80vw] sm:w-[300px] card card-hover text-center cursor-pointer"
          >
            <div className="card-body">
              <h4 className="text-xl font-bold text-[#f1861e] mb-2" dangerouslySetInnerHTML={{ __html: dest.title }} />
              <p className="text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: dest.desc }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
