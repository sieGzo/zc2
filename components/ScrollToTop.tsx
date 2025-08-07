'use client'
import { useEffect, useState } from 'react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const toggleVisible = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', toggleVisible)
    return () => window.removeEventListener('scroll', toggleVisible)
  }, [])

  return visible ? (
    <button
      className="fixed bottom-6 right-6 bg-orange-500 text-white px-3 py-2 rounded-full shadow-md hover:bg-orange-600 transition"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Przewiń do góry"
    >
      <span className="text-2xl">🦊↑️</span>

    </button>
  ) : null
}
