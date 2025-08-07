'use client'

import { useEffect, useState } from 'react'

const slides = [
  {
    image: '/hero1.webp',
    title: 'Twoje&nbsp;podróże, Twoje&nbsp;zasady',
    subtitle: 'Zaplanuj każdy&nbsp;wyjazd z&nbsp;głową i&nbsp;sercem 🧡',
  },
  {
    image: '/hero2.webp',
    title: 'W&nbsp;drogę z&nbsp;liskiem',
    subtitle: 'Praktyczne porady, gotowe trasy, ciekawe&nbsp;miejsca',
  },
  {
    image: '/hero3.webp',
    title: 'Rodzinne&nbsp;wyprawy',
    subtitle: 'Odkrywaj świat bez stresu – z&nbsp;dzieckiem i&nbsp;uśmiechem',
  },
]

export default function HeroSlider() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const { image, title, subtitle } = slides[index]

  return (
    <div className="relative h-[80vh] w-full overflow-hidden">
      <img
        src={image}
        alt={title.replace(/&nbsp;/g, ' ')}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
      />
      <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4" dangerouslySetInnerHTML={{ __html: title }} />
        <p className="text-lg md:text-xl text-white" dangerouslySetInnerHTML={{ __html: subtitle }} />
      </div>
    </div>
  )
}
