'use client'

import { useEffect, useRef, useState } from 'react'
import { MdOutlineContrast } from 'react-icons/md'
import { BsTextParagraph, BsTypeBold, BsLink45Deg } from 'react-icons/bs'
import { PiTextAa, PiTextColumnsBold } from 'react-icons/pi'
import { FaUniversalAccess } from 'react-icons/fa'

type Opt = { icon: JSX.Element; label: string; cls: string }

const OPTIONS: Opt[] = [
  { icon: <MdOutlineContrast className="min-w-[20px]" />, label: 'Kontrast', cls: 'contrast' },
  { icon: <PiTextAa className="min-w-[20px]" />, label: 'Rozmiar tekstu', cls: 'large-font' },
  { icon: <PiTextColumnsBold className="min-w-[20px]" />, label: 'Odstępy między znakami', cls: 'letter-spacing' },
  { icon: <BsTypeBold className="min-w-[20px]" />, label: 'Zmiana czcionki', cls: 'font-alt' },
  { icon: <BsTextParagraph className="min-w-[20px]" />, label: 'Odstępy między wierszami', cls: 'line-spacing' },
  { icon: <BsLink45Deg className="min-w-[20px]" />, label: 'Wyraźne linki', cls: 'underline-links' },
]

export default function AccessPanel() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)

  // zapamiętywanie ustawień (opcjonalnie)
  useEffect(() => {
    const saved = localStorage.getItem('a11y-classes')
    if (saved) {
      const list = JSON.parse(saved) as string[]
      list.forEach(c => document.body.classList.add(c))
    }
  }, [])

  const persist = () => {
    const list = Array.from(document.body.classList).filter(c =>
      OPTIONS.some(o => o.cls === c)
    )
    localStorage.setItem('a11y-classes', JSON.stringify(list))
  }

  const toggleClass = (cls: string) => {
    document.body.classList.toggle(cls)
    persist()
  }

  // zamykanie po kliknięciu poza i ESC
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current) return
      if (!panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative z-[95]">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-[#f1861e] text-2xl hover:scale-110 transition"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Dostępność"
      >
        <FaUniversalAccess />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          className="
            absolute
            left-1/2 -translate-x-1/2
            mt-2 w-[90vw] sm:w-72
            max-h-[70vh] overflow-auto
            rounded-xl shadow-2xl
            bg-white dark:bg-gray-800 backdrop-blur-md
            text-sm text-gray-800 dark:text-gray-100
            p-4 space-y-2 border border-gray-300 dark:border-gray-700
            z-[100]
          "
        >
          {OPTIONS.map(({ icon, label, cls }) => (
            <button
              key={cls}
              role="menuitemcheckbox"
              aria-checked={document.body.classList.contains(cls)}
              onClick={() => toggleClass(cls)}
              className="
                flex items-center gap-2
                hover:underline
                whitespace-normal break-words
                w-full text-left
                py-2
              "
            >
              {icon} {label}
            </button>
          ))}

          <hr className="my-2 border-gray-200 dark:border-gray-700" />

          <button
            onClick={() => {
              OPTIONS.forEach(o => document.body.classList.remove(o.cls))
              persist()
              setOpen(false)
            }}
            className="w-full text-left py-2 font-semibold text-[#f1861e] hover:underline"
          >
            Resetuj ustawienia
          </button>
        </div>
      )}
    </div>
  )
}
