'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const html = document.documentElement
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      html.classList.add('dark')
      setIsDark(true)
    } else {
      html.classList.remove('dark')
      setIsDark(false)
    }
  }, [])

  const toggleTheme = () => {
    const html = document.documentElement
    const body = document.body

    if (isDark) {
      // wyłącz dark
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      // włącz dark
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      // zdejmij kontrast, jeśli był włączony
      if (body.classList.contains('contrast')) {
        body.classList.remove('contrast')
        const saved = localStorage.getItem('a11y-classes')
        if (saved) {
          const filtered = (JSON.parse(saved) as string[]).filter(c => c !== 'contrast')
          localStorage.setItem('a11y-classes', JSON.stringify(filtered))
        }
      }
    }

    setIsDark(!isDark)
  }

  return (
    <button
      onClick={toggleTheme}
      className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      aria-label="Przełącz tryb jasny/ciemny"
    >
      {isDark ? '☀️ Jasny' : '🌙 Ciemny'}
    </button>
  )
}
